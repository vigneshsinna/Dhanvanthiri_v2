import { test, expect } from '@playwright/test';
import {
  attachStorefrontIssueCollector,
  expectNoCriticalStorefrontIssues,
  loginAsCustomer,
  skipUnlessCustomerCredentials,
} from './support/storefront-user-flow';

test.describe('Storefront post-purchase flows', () => {
  test.describe.configure({ timeout: 60_000 });

  test('order confirmation page provides recovery links after refresh', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/checkout/confirmation', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /track order|orders/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /continue shopping/i })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
    expectNoCriticalStorefrontIssues(issues);
  });

  test('guest tracking validates required email or phone before lookup', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/track-order', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/order number/i).fill('DV-NOT-A-REAL-ORDER');
    await page.getByRole('button', { name: /track order/i }).click();

    await expect(page.getByText(/please enter either your email or phone/i).first()).toBeVisible();
    expectNoCriticalStorefrontIssues(issues);
  });

  test('guest tracking shows a clear not-found state for invalid order details', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/track-order', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/order number/i).fill(`DV-${Date.now()}`);
    await page.getByLabel(/email/i).fill('guest-not-found@example.test');
    await page.getByRole('button', { name: /track order/i }).click();

    await expect(page.getByText(/not found|check your order/i).first()).toBeVisible({ timeout: 15_000 });
    expectNoCriticalStorefrontIssues(issues);
  });

  test('authenticated customer can open order history and tracking surface', async ({ page }, testInfo) => {
    skipUnlessCustomerCredentials(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await loginAsCustomer(page);
    await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /orders|order history/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/order|status|empty|no orders/i).first()).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('support/contact page exposes a customer message path', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /contact|support/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/john doe|john@example|write your message/i).first()).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('email/SMS log assertions can read a configured test notification sink', async ({ request }, testInfo) => {
    const sinkUrl = process.env.E2E_MAIL_LOG_URL || process.env.E2E_SMS_LOG_URL;
    testInfo.skip(!sinkUrl, 'Set E2E_MAIL_LOG_URL or E2E_SMS_LOG_URL to verify notification sink output.');

    const response = await request.get(sinkUrl!);
    expect(response.ok(), `Notification sink should be reachable at ${sinkUrl}`).toBeTruthy();
  });

  test('post-purchase review submission is hidden for ineligible orders', async ({ page }) => {
    await mockOrderDetail(page, { delivery_status: 'processing' });

    await page.goto('/order/123', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/E2E Review Product/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /review product/i })).toHaveCount(0);
  });
});

test.describe('Storefront post-purchase reviews', () => {
  test('eligible delivered order can submit a product review', async ({ page }) => {
    await mockOrderDetail(page, { delivery_status: 'delivered' });
    await page.route('**/api/v2/reviews/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: true, message: 'Review submitted successfully' }),
      });
    });

    await page.goto('/order/123', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /review product/i }).click();
    await page.getByLabel(/rating/i).selectOption('5');
    await page.getByLabel(/review comment/i).fill('Fresh, well packed, and exactly as described.');
    await page.getByRole('button', { name: /submit review/i }).click();

    await expect(page.getByText(/review submitted successfully/i)).toBeVisible();
  });

  test('post-purchase review form shows validation errors', async ({ page }) => {
    await mockOrderDetail(page, { delivery_status: 'delivered' });

    await page.goto('/order/123', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /review product/i }).click();
    await page.getByRole('button', { name: /submit review/i }).click();

    await expect(page.getByText(/review comment is required/i)).toBeVisible();
  });
});

async function mockOrderDetail(page: import('@playwright/test').Page, overrides: Record<string, unknown> = {}) {
  const order = {
    id: 123,
    code: 'DV-E2E-123',
    delivery_status: 'delivered',
    payment_status: 'paid',
    payment_type: 'razorpay',
    grand_total: '180',
    subtotal: '180',
    tax: '0',
    shipping_cost: '0',
    coupon_discount: '0',
    date: new Date('2026-04-01T10:00:00Z').toISOString(),
    shipping_address: {
      recipient_name: 'E2E Customer',
      line_1: '1 Test Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600001',
      phone: '9999999999',
    },
    order_details: [{
      id: 456,
      product_id: 789,
      product_name: 'E2E Review Product',
      quantity: 1,
      price: '180',
      variation: '250g',
      sku: 'E2E-REVIEW',
      product: {
        id: 789,
        name: 'E2E Review Product',
        thumbnail_image: '/images/placeholder-product.png',
      },
    }],
    ...overrides,
  };

  await page.route('**/api/v2/purchase-history-details/123', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: order }),
    });
  });
}
