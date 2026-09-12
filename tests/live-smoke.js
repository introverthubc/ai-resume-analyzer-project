// Optional integration check; uses the running server and makes real Gemini calls.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { samplePdf } from './fixture.js';
const base = process.env.TEST_API_URL || 'http://127.0.0.1:5000/api';
async function request(path, body) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(135000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.message}`);
  return data;
}
try {
  const form = new FormData();
  form.append('resume', new Blob([await samplePdf()], { type: 'application/pdf' }), 'live-check.pdf');
  form.append('title', 'Live Gemini verification');
  const uploaded = await request('/resume/upload', form);
  const id = uploaded.resume._id;
  const original = uploaded.versions[0].text;
  const { analysis } = await request('/resume/analyze', { resumeId: id, versionId: 'v1', targetRole: 'Frontend Engineer' });
  assert.equal(analysis.atsScore, Object.values(analysis.scoreBreakdown).reduce((a, b) => a + b, 0));
  assert.ok(analysis.summary);
  assert.ok(analysis.bulletRewrites.length, 'Gemini returned no applicable rewrites for the sample.');
  const chosen = analysis.bulletRewrites[0];
  const { version } = await request(`/resume/${id}/rewrite`, { analysisId: analysis._id, rewriteIds: [chosen._id] });
  assert.equal(version._id, 'v2');
  assert.ok(version.text.includes(chosen.rewritten));
  assert.notEqual(version.text, original);
  assert.equal((await request(`/resume/${id}/versions/v1`)).version.text, original);
  const second = await request('/resume/analyze', { resumeId: id, versionId: 'v2', targetRole: 'Frontend Engineer' });
  assert.equal(second.analysis.versionId, 'v2');
  const detail = await request(`/resume/${id}`);
  assert.equal(detail.versions.length, 2);
  const report = { passed: true, resumeId: id, model: analysis.model, originalScore: analysis.atsScore, rewrittenScore: second.analysis.atsScore, suggestions: analysis.bulletRewrites.length, versions: detail.versions.length, checkedAt: new Date().toISOString() };
  await mkdir('validation', { recursive: true });
  await writeFile('validation/live-smoke.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) { console.error(error.message); process.exitCode = 1; }

