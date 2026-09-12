import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { AppError, createGeminiAnalyzer, locateOriginal } from './analysis.js';
import { dashboardData, insightsData, versionData, historyData } from './statistics.js';

const now = () => new Date().toISOString();
const check = (condition, status, message) => { if (!condition) throw new AppError(status, message); };

export async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/^--\s*\d+ of \d+\s*--\s*$/gm, '').trim();
  } catch { throw new AppError(422, 'Could not read this PDF. Upload an unencrypted PDF with selectable text.'); }
  finally { await parser.destroy().catch(() => {}); }
}

// Keep the full extracted text as the authoritative export/preview source.
// Lossy guesses about resume section structure must not drop user content.
function versionOf(text, number, sourceType, extra = {}) {
  return { _id: `v${number}`, label: `V${number}`, number, text, rawText: text, sourceType, createdAt: now(), ...extra };
}

export function createApp({ analyze = createGeminiAnalyzer(), parsePdf = extractPdf } = {}) {
  const app = express();
  const resumes = new Map();
  const events = [];
  const pending = new Set();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2 } });
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const getResume = (id) => { const r = resumes.get(id); check(r, 404, 'Resume not found. The session may have ended; upload the PDF again.'); return r; };
  const getVersion = (r, id = r.currentVersionId) => { const v = r.versions.find(v => v._id === id); check(v, 404, 'Version not found.'); return v; };
  const summarize = (r) => ({ _id: r._id, title: r.title, fileName: r.fileName, fileType: r.fileType, fileSize: r.fileSize, createdAt: r.createdAt, uploadedAt: r.createdAt, updatedAt: r.updatedAt, currentVersionId: r.currentVersionId, latestVersionNumber: r.versions.length, latestScore: r.analyses.findLast(a => a.versionId === r.currentVersionId)?.atsScore ?? null });
  const detail = (r) => ({ resume: summarize(r), versions: r.versions });
  const record = (r, type, title, subtitle, label) => events.unshift({ id: randomUUID(), resumeId: r._id, type, title, subtitle, label, at: now() });

  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'memory' }));
  app.get('/api/resumes', (_req, res) => res.json({ resumes: [...resumes.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(summarize) }));
  app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
    check(req.file, 400, 'Choose a PDF to upload.');
    check(req.file.mimetype === 'application/pdf' && req.file.buffer.subarray(0, 5).toString() === '%PDF-', 415, 'Only valid PDF files are supported.');
    check(req.body.title === undefined || (typeof req.body.title === 'string' && req.body.title.length <= 200), 400, 'Title must be at most 200 characters.');
    const text = await parsePdf(req.file.buffer);
    check(text.trim().length >= 20, 422, 'No usable text found. Scanned PDFs need OCR first; upload a PDF with selectable text.');
    check(text.length <= 80000, 413, 'This PDF contains too much text. Upload a shorter resume.');
    const r = { _id: randomUUID(), title: req.body.title?.trim() || req.file.originalname, fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size, createdAt: now(), updatedAt: now(), currentVersionId: 'v1', versions: [versionOf(text, 1, 'upload')], analyses: [] };
    resumes.set(r._id, r);
    record(r, 'upload', `Uploaded ${r.title}`, 'PDF text extracted', 'V1');
    res.status(201).json({ ...detail(r), resumeId: r._id });
  });
  app.get('/api/resume/:id', (req, res) => res.json(detail(getResume(req.params.id))));
  app.delete('/api/resume/:id', (req, res) => {
    const r = getResume(req.params.id);
    resumes.delete(r._id);
    for (let i = events.length - 1; i >= 0; i--) if (events[i].resumeId === r._id) events.splice(i, 1);
    res.json({ ok: true });
  });
  app.get('/api/resume/:id/versions/:versionId', (req, res) => res.json({ version: getVersion(getResume(req.params.id), req.params.versionId) }));
  app.get('/api/resume/:id/analyses', (req, res) => res.json({ analyses: getResume(req.params.id).analyses }));
  app.get('/api/resume/:id/versions/:versionId/analysis', (req, res) => {
    const r = getResume(req.params.id), v = getVersion(r, req.params.versionId);
    res.json({ analysis: r.analyses.findLast(a => a.versionId === v._id) || null });
  });
  app.post('/api/resume/analyze', async (req, res) => {
    const { resumeId, versionId, targetRole } = req.body || {};
    check(typeof resumeId === 'string', 400, 'resumeId is required.');
    check(targetRole === undefined || (typeof targetRole === 'string' && targetRole.length <= 200), 400, 'Target role must be at most 200 characters.');
    const r = getResume(resumeId), v = getVersion(r, versionId);
    const lock = `${r._id}:${v._id}`;
    check(!pending.has(lock), 409, 'This version is already being analyzed. Please wait.');
    pending.add(lock);
    try {
      const result = await analyze({ text: v.text, targetRole: targetRole?.trim() });
      check(resumes.has(r._id), 404, 'Resume was deleted during analysis.');
      const analysis = { ...result, _id: randomUUID(), resumeId: r._id, versionId: v._id, targetRole: targetRole?.trim() || null, createdAt: now() };
      r.analyses.push(analysis);
      r.updatedAt = now();
      record(r, 'analyze', `Analyzed ${v.label} of ${r.title}`, `ATS score ${analysis.atsScore} / 100`, v.label);
      res.json({ analysis });
    } finally { pending.delete(lock); }
  });
  app.post('/api/resume/:id/rewrite', (req, res) => {
    const r = getResume(req.params.id);
    const { analysisId, rewriteIds } = req.body || {};
    check(typeof analysisId === 'string', 400, 'Select an analysis before applying rewrites.');
    const analysis = r.analyses.find(a => a._id === analysisId);
    check(analysis, 404, 'Analysis not found for this resume.');
    const parent = getVersion(r, analysis.versionId);
    check(r.analyses.findLast(a => a.versionId === parent._id)?._id === analysisId, 409, 'Analysis has changed. Refresh and select the latest suggestions.');
    check(rewriteIds === undefined || (Array.isArray(rewriteIds) && rewriteIds.every(id => typeof id === 'string')), 400, 'rewriteIds must be an array of IDs.');
    const ids = rewriteIds === undefined ? analysis.bulletRewrites.map(b => b._id) : [...new Set(rewriteIds)];
    check(ids.length > 0, 400, 'Select at least one rewrite.');
    const selected = ids.map(id => analysis.bulletRewrites.find(b => b._id === id));
    check(selected.every(Boolean), 400, 'One or more selected rewrites do not belong to this analysis.');
    const signature = JSON.stringify([analysisId, [...ids].sort()]);
    const existing = r.versions.find(v => v.rewriteSignature === signature);
    if (existing) return res.json({ version: existing, appliedCount: selected.length });
    const edits = selected.map(b => ({ ...b, span: locateOriginal(parent.text, b.original) }));
    check(edits.every(b => b.span), 409, 'A suggested original is missing or ambiguous. Analyze this version again.');
    edits.sort((a, b) => a.span.start - b.span.start);
    check(edits.every((b, i) => i === 0 || edits[i - 1].span.end <= b.span.start), 409, 'Selected rewrites overlap. Select one of the overlapping suggestions.');
    let text = parent.text;
    for (const b of [...edits].reverse()) text = text.slice(0, b.span.start) + b.rewritten + text.slice(b.span.end);
    check(text !== parent.text, 400, 'The selected rewrites would not change this version.');
    const version = versionOf(text, r.versions.length + 1, 'rewrite', { parentVersionId: parent._id, analysisId, appliedRewrites: selected, rewriteSignature: signature });
    r.versions.push(version);
    r.currentVersionId = version._id;
    r.updatedAt = now();
    record(r, 'rewrite', `Applied ${selected.length} rewrites — created ${version.label}`, r.title, version.label);
    res.status(201).json({ version, appliedCount: selected.length });
  });
  app.get('/api/dashboard', (_req, res) => res.json(dashboardData([...resumes.values()], events)));
  app.get('/api/versions', (_req, res) => res.json(versionData([...resumes.values()])));
  app.get('/api/history', (_req, res) => res.json(historyData(events)));
  app.get('/api/insights', (_req, res) => res.json(insightsData([...resumes.values()])));
  app.use('/api', (_req, _res, next) => next(new AppError(404, 'API route not found.')));
  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'PDF must be 5 MB or smaller.' : 'Upload one PDF using the resume field.' });
    const status = error.status || (error.type === 'entity.parse.failed' ? 400 : 500);
    res.status(status).json({ message: error instanceof AppError ? error.message : status === 400 ? 'Invalid JSON request.' : status === 413 ? 'Request is too large.' : 'The server could not complete the request. Please try again.' });
  });
  return app;
}
