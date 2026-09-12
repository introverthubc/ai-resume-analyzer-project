// Read-only browser verification of the sample created by test:live.
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
const report = JSON.parse(await readFile('validation/live-smoke.json', 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:5173/login');
  await page.locator('input[type=email]').fill('local-check@example.com');
  await page.locator('input[type=password]').fill('demo-only-password');
  await page.getByRole('button', { name: /^Sign in/ }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto(`http://localhost:5173/resumes/${report.resumeId}`);
  await expect(page.getByText('Resume text (V2)')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(report.model, { exact: true })).toBeVisible();
  await expect(page.getByText('Score Breakdown', { exact: true })).toBeVisible();
  await expect(page.getByText(String(report.rewrittenScore), { exact: true })).toBeVisible();
  await mkdir('validation', { recursive: true });
  await page.screenshot({ path: 'validation/live-gemini-v2.png', fullPage: true });
  await page.getByRole('button', { name: 'V1', exact: true }).click();
  await expect(page.getByText('Resume text (V1)')).toBeVisible();
  await page.getByRole('button', { name: 'Rewrites', exact: true }).click();
  await expect(page.getByText('Suggested Rewrites', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  console.log('Live frontend verified: real Gemini results, V1/V2 switching, rewrite suggestions, no uncaught browser errors.');
} finally { await browser.close(); }
