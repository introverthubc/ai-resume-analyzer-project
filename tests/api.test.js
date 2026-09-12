import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { normalizeAnalysis, parseJsonResponse, locateOriginal, createGeminiAnalyzer, AppError } from '../server/analysis.js';
import { sampleAnalysis, samplePdf, original, rewritten, second, secondRewrite } from './fixture.js';

async function serve(t, options = {}) {
  const server = createApp(options).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  return async (path, body, method = body ? 'POST' : 'GET') => {
    const response = await fetch(base + path, { method, headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
}
async function upload(request, pdf) {
  const form = new FormData(); form.append('resume', new Blob([pdf], { type: 'application/pdf' }), 'sample.pdf'); form.append('title', 'Integration resume');
  return request('/resume/upload', form);
}

test('JSON parser handles fences, prose, escaped quotes/braces and rejects truncation', () => {
  const raw = sampleAnalysis(original);
  raw.summary = 'A {brace} and "quote" are valid';
  for (const source of [JSON.stringify(raw), '```json\n' + JSON.stringify(raw) + '\n```', 'Here is the result:\n' + JSON.stringify(raw) + '\nDone.']) assert.deepEqual(parseJsonResponse(source), raw);
  for (const bad of ['', '{"summary":', 'not JSON']) assert.throws(() => parseJsonResponse(bad), AppError);
});
test('normalization validates scores and avoids unsafe/unmatchable rewrites', () => {
  const raw = sampleAnalysis(original);
  raw.scoreBreakdown.keywords = 99;
  raw.scoreBreakdown.impact = -1;
  raw.bulletRewrites.push({ original, rewritten: 'Improved performance by 40%.' });
  const a = normalizeAnalysis(raw, original);
  assert.equal(a.atsScore, 66);
  assert.equal(a.bulletRewrites.length, 1);
  assert.ok(a.bulletRewrites[0]._id);
  assert.throws(() => normalizeAnalysis({ ...raw, scoreBreakdown: {} }, original));
  assert.throws(() => normalizeAnalysis({ ...raw, issues: null }, original));
  assert.equal(locateOriginal(`${original}\n${original}`, original), null);
  assert.deepEqual(locateOriginal('Built a\n dashboard using React.', original), { start: 0, end: 31 });
});
test('real PDF upload -> analysis -> selected rewrite -> persisted V2 -> analyze V2 -> apply all', async t => {
  const seen = [];
  const request = await serve(t, { analyze: async ({ text, targetRole }) => { seen.push({ text, targetRole }); return { ...normalizeAnalysis(sampleAnalysis(text), text), model: 'test-provider' }; } });
  assert.equal((await request('/resumes')).data.resumes.length, 0);
  assert.equal((await request('/insights')).data.empty, true);
  const uploaded = await upload(request, await samplePdf());
  assert.equal(uploaded.status, 201);
  const id = uploaded.data.resume._id;
  const v1 = uploaded.data.versions[0];
  assert.match(v1.text, /Alex Example/);
  assert.equal((await request(`/resume/${id}/versions/v1/analysis`)).data.analysis, null);
  const result = await request('/resume/analyze', { resumeId: id, versionId: 'v1', targetRole: 'Frontend Engineer' });
  assert.equal(result.status, 200);
  const a = result.data.analysis;
  assert.equal(a.atsScore, 75);
  assert.equal(seen[0].targetRole, 'Frontend Engineer');
  const body = { analysisId: a._id, rewriteIds: [a.bulletRewrites[0]._id] };
  const applied = await request(`/resume/${id}/rewrite`, body);
  assert.equal(applied.status, 201);
  assert.equal(applied.data.appliedCount, 1);
  assert.equal(applied.data.version._id, 'v2');
  assert.ok(applied.data.version.text.includes(rewritten));
  assert.ok(applied.data.version.text.includes(second));
  assert.equal((await request(`/resume/${id}/rewrite`, body)).data.version._id, 'v2');
  assert.equal((await request(`/resume/${id}`)).data.versions.length, 2);
  assert.equal((await request(`/resume/${id}/versions/v1`)).data.version.text, v1.text);
  assert.equal((await request(`/resume/${id}/versions/v2/analysis`)).data.analysis, null);
  const a2 = (await request('/resume/analyze', { resumeId: id, versionId: 'v2' })).data.analysis;
  assert.ok(seen[1].text.includes(rewritten));
  assert.equal((await request(`/resume/${id}/versions/v1/analysis`)).data.analysis._id, a._id);
  const all = await request(`/resume/${id}/rewrite`, { analysisId: a2._id });
  assert.equal(all.status, 201);
  assert.ok(all.data.version.text.includes(secondRewrite));
  assert.equal(all.data.version.parentVersionId, 'v2');
  assert.equal((await request('/versions')).data.totals.all, 3);
  assert.equal((await request('/dashboard')).data.totals.analyses, 2);
  assert.equal((await request('/history')).data.totals.rewrite, 2);
  assert.equal((await request('/insights')).data.totalAnalyses, 2);
  assert.equal((await request(`/resume/${id}/rewrite`, { analysisId: a2._id, rewriteIds: [] })).status, 400);
  assert.equal((await request(`/resume/${id}/rewrite`, { analysisId: a2._id, rewriteIds: ['fake'] })).status, 400);
  assert.equal((await request(`/resume/${id}/rewrite`, {})).status, 400);
  assert.equal((await request(`/resume/${id}/versions/missing`)).status, 404);
  await request('/resume/analyze', { resumeId: id, versionId: 'v1' });
  assert.equal((await request(`/resume/${id}/rewrite`, body)).status, 409);
  await request(`/resume/${id}`, undefined, 'DELETE');
  assert.equal((await request(`/resume/${id}`)).status, 404);
  assert.equal((await request('/history')).data.totals.all, 0);
  assert.equal((await request('/resumes')).data.resumes.length, 0);
});
test('upload errors, missing configuration and provider errors return readable JSON', async t => {
  const request = await serve(t, { analyze: createGeminiAnalyzer({ apiKey: '' }) });
  assert.equal((await request('/resume/upload', new FormData())).status, 400);
  assert.equal((await upload(request, Buffer.from('invalid'))).status, 415);
  assert.equal((await upload(request, Buffer.from('%PDF-invalid'))).status, 422);
  assert.equal((await upload(request, Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413);
  const id = (await upload(request, await samplePdf())).data.resume._id;
  const missingKey = await request('/resume/analyze', { resumeId: id });
  assert.equal(missingKey.status, 503);
  assert.match(missingKey.data.message, /GEMINI_API_KEY/);
  assert.equal((await request('/resume/analyze', { resumeId: id, targetRole: {} })).status, 400);
  const other = await serve(t, { analyze: async () => { throw new AppError(429, 'Quota reached'); } });
  const otherId = (await upload(other, await samplePdf())).data.resume._id;
  assert.equal((await other('/resume/analyze', { resumeId: otherId })).status, 429);
});
test('concurrent analysis is rejected, and a fresh app has no previous session', async t => {
  let release;
  const request = await serve(t, { analyze: async ({ text }) => { await new Promise(resolve => { release = resolve; }); return normalizeAnalysis(sampleAnalysis(text), text); } });
  const id = (await upload(request, await samplePdf())).data.resume._id;
  const first = request('/resume/analyze', { resumeId: id });
  while (!release) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal((await request('/resume/analyze', { resumeId: id })).status, 409);
  release(); await first;
  const fresh = await serve(t);
  assert.equal((await fresh('/resumes')).data.resumes.length, 0);
});
