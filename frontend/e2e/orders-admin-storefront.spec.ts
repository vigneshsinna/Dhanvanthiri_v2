import { expect, test } from '@playwright/test';
import { adminPath, canMutateAdminData } from './support/env';
import { adminApi, expectBladePageTitle, getAdminApiToken, loginToBladeAdmin } from './support/admin';
import { getPublicApi } from './support/storefront';

test.describe('Phase 5 - Orders admin to React account/tracking', () => {
  test('admin order list and first detail view open', async ({ page }) => {
    await loginToBladeAdmin(page);
    await page.goto(adminPath('all_orders'));
    await expectBladePageTitle(page, /orders/i);

    const firstOrder = page.locator('a[href*="/orders/"][href*="/show"]').first();
    await expect(firstOrder).toBeVisible({ timeout: 15000 });
    await firstOrder.click();
    await expectBladePageTitle(page, /order|details/i);
    await expect(page.locator('#update_delivery_status, input[value*="pending" i], input[value*="delivered" i]').first()).toBeVisible();
  });

  test.describe('mutating order bridge checks', () => {
    test.skip(!canMutateAdminData(), 'Set E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true against a seeded testing database to run mutating order checks.');

    test('updates delivery status and tracking through admin API, then verifies storefront tracking API', async ({ request }) => {
      const token = await getAdminApiToken(request);
      const listResponse = await adminApi(request, 'get', 'orders?per_page=1', token);
      expect(listResponse.ok(), await listResponse.text()).toBeTruthy();
      const firstOrder = (await listResponse.json()).data?.data?.[0];
      test.skip(!firstOrder, 'No seeded order exists. Run DhanvathiriOrdersSeeder or create a test order first.');

      const statusResponse = await adminApi(request, 'put', `orders/${firstOrder.id}/status`, token, {
        status: 'shipped',
        notes: 'Updated by Playwright E2E',
      });
      expect(statusResponse.ok(), await statusResponse.text()).toBeTruthy();
      await expect(statusResponse.json()).resolves.toMatchObject({ data: { status: 'shipped' } });

      const trackingNumber = `E2E-${Date.now()}`;
      const shipmentResponse = await adminApi(request, 'post', `orders/${firstOrder.id}/shipment`, token, {
        carrier: 'E2E Courier',
        tracking_number: trackingNumber,
      });
      expect(shipmentResponse.ok(), await shipmentResponse.text()).toBeTruthy();
      expect(await shipmentResponse.text()).toContain(trackingNumber);

      const publicOrder = await getPublicApi(request, `orders/${firstOrder.code}`);
      expect(publicOrder.ok(), await publicOrder.text()).toBeTruthy();
      const publicText = await publicOrder.text();
      expect(publicText).toContain('shipped');
      expect(publicText).toContain(trackingNumber);
    });
  });
});
