import React from 'react';
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer';
export const original = 'Built a dashboard using React.';
export const rewritten = 'Developed an interactive dashboard using React.';
export const second = 'Worked on API integration.';
export const secondRewrite = 'Implemented API integration.';
export function sampleAnalysis(text) {
  return {
    scoreBreakdown: { keywords: 18, formatting: 20, impact: 16, clarity: 21 },
    strengths: [{ title: 'Relevant development experience', evidence: 'React dashboard project' }],
    issues: [{ title: 'Add evidence of impact', severity: 'medium', explanation: 'The project has no outcomes.', fix: 'Add verified results when available.' }],
    keywordsPresent: ['React'], keywordsMissing: ['Testing'], summary: 'Clear resume with relevant projects; add evidence of impact.',
    bulletRewrites: [
      ...(text.includes(original) ? [{ original, rewritten, section: 'Projects', rationale: 'Use a clearer action verb without inventing results.' }] : []),
      ...(text.includes(second) ? [{ original: second, rewritten: secondRewrite, section: 'Experience', rationale: 'Use a direct action verb.' }] : []),
    ],
  };
}
export async function samplePdf() {
  return renderToBuffer(React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: { padding: 40 } },
      ...['Alex Example', 'alex@example.com', 'Experience', second, 'Projects', original, 'Skills: React, JavaScript', 'Education: BSc Computer Science'].map((line, i) => React.createElement(Text, { key: i, style: { fontSize: 12, marginBottom: 10 } }, line)))));
}
