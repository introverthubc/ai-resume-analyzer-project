import { request } from './client';
export const dashboardApi = { get: () => request('/dashboard') };
