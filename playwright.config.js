import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.js', workers: 1, timeout: 180000,
  expect: { timeout: 20000 },
  use: { baseURL: 'http://localhost:5174', channel: 'msedge', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node tests/browser-server.js', url: 'http://127.0.0.1:5001/api/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js --config vite.test.config.js --port 5174 --strictPort', url: 'http://localhost:5174', env: { VITE_API_URL: 'http://127.0.0.1:5001/api' }, reuseExistingServer: false },
  ],
});
