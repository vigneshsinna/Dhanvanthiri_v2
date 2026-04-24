import { expect, test } from '@playwright/test';
import { adminPath, apiPath, e2eConfig, storefrontPath } from './support/env';
import { expectReactRoute } from './support/storefront';

test.describe('Phase 8 - Cache and deployment routing', () => {
  test('FRONTEND_URL/storefront URL resolves', async ({ page }) => {
    await page.goto(e2eConfig.storefrontUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('/api/* reaches Laravel APIs', async ({ request }) => {
    const response = await request.get(apiPath('/v2/capabilities'), {
      headers: { 'System-Key': e2eConfig.systemKey, Accept: 'application/json' },
    });
    expect(response.status()).not.toBe(404);
    expect(response.headers()['content-type'] || '').toContain('application/json');
  });

  test('/admin/* remains Laravel Blade admin', async ({ page }) => {
    await page.goto(adminPath('login'), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#root')).toHaveCount(0);
  });

  const refreshRoutes = [
    '/products',
    '/products/poondu-thokku',
    '/categories/thokku',
    '/brands/dhanvanthiri-foods',
    '/pages/about',
    '/cart',
    '/checkout',
    '/account/orders',
  ];

  for (const route of refreshRoutes) {
    test(`direct refresh works for React route ${route}`, async ({ page }) => {
      await page.goto(storefrontPath(route), { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Laravel|Symfony|Not Found\s*404/i);
      await expectReactRoute(page, route);
    });
  }
});
