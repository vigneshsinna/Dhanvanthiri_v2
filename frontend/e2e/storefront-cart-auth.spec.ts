import { test, expect } from '@playwright/test';
import {
  addFirstProductToCart,
  attachStorefrontIssueCollector,
  expectNoCriticalStorefrontIssues,
  loginAsCustomer,
  skipUnlessCustomerCredentials,
  skipUnlessMutationAllowed,
} from './support/storefront-user-flow';

test.describe('Storefront cart and authentication', () => {
  test.describe.configure({ timeout: 60_000 });

  test('cart page renders an empty-state recovery path', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.route('**/api/v2/carts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
    await page.route('**/api/v2/cart-summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub_total: '0',
          tax: '0',
          shipping_cost: '0',
          discount: '0',
          grand_total: '0',
          grand_total_value: 0,
          coupon_code: '',
          coupon_applied: false,
        }),
      });
    });

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toContainText(/cart/i, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: /continue shopping|browse products/i }).first()).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('login form rejects invalid credentials with a clear error', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.route('**/api/v2/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Login failed. Please try again.' }),
      });
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill('not-a-real-customer@example.test');
    await page.getByLabel(/password/i).fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await expect(page.getByText(/login failed|invalid|credential|try again/i).first()).toBeVisible({ timeout: 20_000 });
    expectNoCriticalStorefrontIssues(issues);
  });

  test('signup validation blocks incomplete account creation client-side', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/required|invalid|at least|email/i).first()).toBeVisible();
    expectNoCriticalStorefrontIssues(issues);
  });

  test('forgot password exposes reset request success or clear failure messaging', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(`reset-${Date.now()}@example.test`);
    await page.getByRole('button', { name: /send reset/i }).click();

    await expect(page.getByText(/sent|reset link|could not|check your email/i).first()).toBeVisible({ timeout: 15_000 });
    expectNoCriticalStorefrontIssues(issues);
  });

  test('guest add-to-cart persists through cart refresh', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible({ timeout: 15_000 });
    expectNoCriticalStorefrontIssues(issues);
  });

  test('customer login restores authenticated account navigation', async ({ page }, testInfo) => {
    skipUnlessCustomerCredentials(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await loginAsCustomer(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /orders|profile|wishlist/i }).first()).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('social login provider buttons stay hidden when providers are not configured', async ({ page }) => {
    await page.route('**/api/v2/activated-social-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { type: 'google_login', value: '0' },
          { type: 'facebook_login', value: '0' },
          { type: 'twitter_login', value: '0' },
        ]),
      });
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /continue with google|google/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /continue with facebook|facebook/i })).toHaveCount(0);
  });

  test('social login provider entry point is available when configured', async ({ page }) => {
    await page.route('**/api/v2/activated-social-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { type: 'google_login', value: '1' },
          { type: 'facebook_login', value: '0' },
          { type: 'twitter_login', value: '0' },
        ]),
      });
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const google = page.getByRole('link', { name: /continue with google/i });
    await expect(google).toBeVisible();
    await expect(google).toHaveAttribute('href', /\/social-login\/redirect\/google$/);
    await expect(page.getByRole('link', { name: /continue with facebook/i })).toHaveCount(0);
  });
});
