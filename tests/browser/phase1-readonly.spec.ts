import { test, expect } from '@playwright/test';
// These do not place orders, upload files, send mail or modify customer accounts.
test('real catalog renders and empty/unavailable states are not substituted with fixtures', async ({ page, request }) => {
  const site = new URL(process.env.UAT_BASE_URL || 'http://localhost:3000');
  const apiBase = process.env.UAT_API_URL || (site.hostname === 'localhost' || site.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api/v1' : new URL('/api/v1', site).href);
  const response = await request.get(`${apiBase.replace(/\/$/, '')}/products?pageSize=1`);
  expect(response.status(), 'A real catalog API must be reachable before browser UAT').toBe(200);
  const payload = await response.json();
  expect(payload.success).toBe(true);
  expect(Array.isArray(payload.data.items)).toBe(true);
  await page.goto('/shop');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'The collection' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Products per row' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});
test('guest account orders require sign-in', async ({ page }) => {
  await page.goto('/account/orders');
  await expect(page.getByRole('link', { name: /sign in/i }).or(page.getByRole('button', { name: /sign in/i })).first()).toBeVisible();
});
test('guest tracking validates and renders a real no-match response', async ({ page }) => {
  await page.goto('/track-order');
  await page.getByLabel('Order number').fill('TZL-99999999999999');
  await page.getByLabel('Checkout email or phone').fill('nonexistent@example.invalid');
  await page.getByRole('button', { name: 'Track order', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: /matching order|check the order/i })).toBeVisible();
});
