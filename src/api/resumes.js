import { request } from './client';
import { diffLines, diffWordsWithSpace } from 'diff';
const path = id => `/resume/${encodeURIComponent(id)}`;
export const resumesApi = {
  list: () => request('/resumes'),
  get: id => request(path(id)),
  getVersion: (id, versionId) => request(`${path(id)}/versions/${encodeURIComponent(versionId)}`),
  upload: (file, title) => {
    const body = new FormData();
    body.append('resume', file);
    if (title) body.append('title', title);
    return request('/resume/upload', { method: 'POST', body });
  },
  remove: id => request(path(id), { method: 'DELETE' }),
  analyze: (id, body = {}) => request('/resume/analyze', { method: 'POST', body: { ...body, resumeId: id } }),
  analyses: id => request(`${path(id)}/analyses`),
  analysisForVersion: (id, versionId) => request(`${path(id)}/versions/${encodeURIComponent(versionId)}/analysis`),
  rewrite: (id, body) => request(`${path(id)}/rewrite`, { method: 'POST', body }),
  diff: async (id, from, to, mode = 'words') => {
    const [a, b] = await Promise.all([resumesApi.getVersion(id, from), resumesApi.getVersion(id, to)]);
    const parts = (mode === 'lines' ? diffLines : diffWordsWithSpace)(a.version.text, b.version.text);
    return { parts, stats: { added: parts.filter(p => p.added).reduce((n, p) => n + p.value.length, 0), removed: parts.filter(p => p.removed).reduce((n, p) => n + p.value.length, 0) } };
  },
};
