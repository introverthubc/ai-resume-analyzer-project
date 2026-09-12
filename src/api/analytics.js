import { request } from './client';
export const analyticsApi = {
  insights: () => request('/insights'),
  versions: () => request('/versions'),
  history: () => request('/history'),
};
