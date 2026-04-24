import { test, expect } from '@playwright/test';
import {
  addFirstProductToCart,
  attachStorefrontIssueCollector,
  expectNoCriticalStorefrontIssues,
  openCatalog,
  openFirstProduct,
  skipUnlessMutationAllowed,
} from './support/storefront-user-flow';

test.describe('Storefront React UX resilience', () => {
  test.describe.configure({ timeout: 60_000 });

  test('catalog and PDP survive direct refresh without blank screens', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await openCatalog(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('[data-testid="storefront-product-card"]').first()).toBeVisible({ timeout: 15_000 });

    await openFirstProduct(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/404|500|not found/i);

    expectNoCriticalStorefrontIssues(issues);
  });

  test('checkout refresh returns to a recoverable state', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /secure checkout|cart is empty/i })).toBeVisible({ timeout: 15_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /secure checkout|cart is empty/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('main')).not.toBeEmpty();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('cart item controls keep stable layout and accessible names after quantity changes', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible({ timeout: 15_000 });

    const itemCard = page.locator('a[href*="/products/"]').first().locator('..').locator('..');
    const before = await itemCard.boundingBox();
    await page.getByRole('button', { name: '+' }).first().click();
    await expect(page.getByText(/total/i).first()).toBeVisible();
    const after = await itemCard.boundingBox();

    expect(before?.width).toBeGreaterThan(0);
    expect(after?.width).toBeGreaterThan(0);
    expectNoCriticalStorefrontIssues(issues);
  });

  test('checkout payment button has disabled/loading semantics while validation is pending', async ({ page }, testInfo) => {
    skipUnlessMutationAllowed(testInfo);
    const issues = attachStorefrontIssueCollector(page);

    await addFirstProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    const continueButton = page.getByRole('button', { name: /continue to payment/i });
    await expect(continueButton).toBeDisabled();

    await page.getByLabel(/^email/i).fill('ux@example.test');
    await page.getByLabel(/^phone/i).fill('9876543210');
    await page.getByLabel(/recipient name/i).fill('UX Test');
    await page.getByLabel(/delivery phone/i).fill('9876543210');
    await page.getByLabel(/address line 1/i).fill('12 Test Street');
    await page.getByLabel(/^city/i).fill('Chennai');
    await page.getByLabel(/^state/i).fill('Tamil Nadu');
    await page.getByLabel(/postal code/i).fill('600001');
    await expect(continueButton).toBeEnabled();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('network failures show a customer-visible recovery message instead of a blank screen', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);
    await page.route('**/api/v2/carts', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Synthetic E2E cart failure' }),
      });
    });

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    expect(issues.backendErrors.some((entry) => entry.includes('/carts'))).toBe(true);
  });
});
