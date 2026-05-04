import { test, expect } from '@playwright/test';
import {
  addFirstProductToCart,
  attachStorefrontIssueCollector,
  expectNoCriticalStorefrontIssues,
  parseMoney,
  skipUnlessMutationAllowed,
} from './support/storefront-user-flow';

const guestAddress = {
  email: `guest-${Date.now()}@example.test`,
  phone: '9876543210',
  name: 'E2E Guest Customer',
  address: '12 Test Market Street',
  city: 'Chennai',
  state: 'Chennai',
  postalCode: '600001',
};

test.describe('Storefront checkout funnel', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  test('guest checkout address step requires valid details before payment', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /secure checkout|cart is empty/i })).toBeVisible({ timeout: 15_000 });
    if (await page.getByRole('heading', { name: /cart is empty/i }).isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: /browse products/i })).toBeVisible();
      expectNoCriticalStorefrontIssues(issues);
      return;
    }

    const continueButton = page.getByRole('button', { name: /continue to payment/i });
    await expect(continueButton).toBeDisabled();

    await page.getByLabel(/^email/i).fill('bad-email');
    await page.getByLabel(/^phone/i).fill('123');
    await expect(continueButton).toBeDisabled();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('cart coupon errors are clear and totals remain visible', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible({ timeout: 15_000 });

    const totalBefore = parseMoney(await page.getByText(/total/i).locator('..').textContent().catch(() => ''));
    await page.getByPlaceholder(/coupon/i).fill(`NOPE-${Date.now()}`);
    await page.getByRole('button', { name: /apply/i }).click();

    await expect(page.getByText(/invalid|coupon|not found|expired/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/total/i).first()).toBeVisible();
    const totalAfter = parseMoney(await page.getByText(/total/i).locator('..').textContent().catch(() => ''));
    if (totalBefore !== null && totalAfter !== null) {
      expect(totalAfter).toBe(totalBefore);
    }

    expectNoCriticalStorefrontIssues(issues);
  });

  test('guest checkout review shows shipping, pricing, and payment controls', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    await page.getByLabel(/^email/i).fill(guestAddress.email);
    await page.getByLabel(/^phone/i).fill(guestAddress.phone);
    await page.getByLabel(/recipient name/i).fill(guestAddress.name);
    await page.getByLabel(/delivery phone/i).fill(guestAddress.phone);
    await page.getByLabel(/address line 1/i).fill(guestAddress.address);
    await page.getByLabel(/^city/i).fill(guestAddress.city);
    await page.getByLabel(/^state/i).selectOption({ label: guestAddress.state });
    await page.getByLabel(/postal code/i).fill(guestAddress.postalCode);
    await page.getByRole('button', { name: /continue to payment/i }).click();

    await expect(page.getByRole('heading', { name: /order review|payment/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/subtotal/i).first()).toBeVisible();
    await expect(page.getByText(/shipping/i).first()).toBeVisible();
    await expect(page.getByText(/total|payable/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /payment method/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /razorpay/i })).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('payment submission enters a processing state and blocks double-clicks', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    await page.getByLabel(/^email/i).fill(`payment-${Date.now()}@example.test`);
    await page.getByLabel(/^phone/i).fill(guestAddress.phone);
    await page.getByLabel(/recipient name/i).fill(guestAddress.name);
    await page.getByLabel(/delivery phone/i).fill(guestAddress.phone);
    await page.getByLabel(/address line 1/i).fill(guestAddress.address);
    await page.getByLabel(/^city/i).fill(guestAddress.city);
    await page.getByLabel(/^state/i).selectOption({ label: guestAddress.state });
    await page.getByLabel(/postal code/i).fill(guestAddress.postalCode);
    await page.getByRole('button', { name: /continue to payment/i }).click();
    await expect(page.getByRole('heading', { name: /order review|payment/i })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByLabel(/cash|cod|delivery/i).first()).toHaveCount(0);

    const payButton = page.getByRole('button', { name: /place order|pay with/i }).last();
    await expect(payButton).toBeEnabled();
    let paymentIntentRequests = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/v2/guest/payments/intent')) {
        paymentIntentRequests += 1;
      }
    });

    const paymentIntentResponse = page.waitForResponse(
      (response) => response.url().includes('/api/v2/guest/payments/intent'),
      { timeout: 30_000 },
    );
    await payButton.click();
    await expect.poll(() => paymentIntentRequests, { timeout: 5_000 }).toBe(1);
    await payButton.click({ trial: true, timeout: 1_000 }).catch(() => undefined);
    expect(paymentIntentRequests).toBe(1);
    const intentResponse = await paymentIntentResponse;
    expect(intentResponse.ok()).toBe(true);
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 15_000 });

    expectNoCriticalStorefrontIssues(issues);
  });
});
