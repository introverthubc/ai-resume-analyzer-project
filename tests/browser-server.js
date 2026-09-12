// Isolated test process. Production server.js never imports this provider.
import { createApp } from '../server/app.js';
import { normalizeAnalysis, AppError } from '../server/analysis.js';
import { sampleAnalysis } from './fixture.js';
process.env.FRONTEND_ORIGIN = 'http://localhost:5174';
createApp({ analyze: async ({ text, targetRole }) => {
  if (targetRole === 'Test quota failure') throw new AppError(429, 'Gemini quota or rate limit reached. Wait and retry.');
  return { ...normalizeAnalysis(sampleAnalysis(text), text), model: 'test-provider' };
} }).listen(5001, '127.0.0.1');
