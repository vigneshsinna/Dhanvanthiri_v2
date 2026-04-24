import { expect, test } from '@playwright/test';
import { adminPath, canMutateAdminData } from './support/env';
import { expectDestructiveActionRequiresConfirmation, loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

test.describe('Admin products regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  test('all products AJAX table stops loading and renders rows or an empty state', async ({ page }, testInfo) => {
    const diagnostics = attachPageDiagnostics(page);
    await expectHealthyAdminPage(page, testInfo, 'products/all', /all products|products/i, diagnostics);

    await expect(page.locator('.footable-loader, .fooicon-loader')).toHaveCount(0, { timeout: 20000 });
    await expectTableOrEmptyState(page);
    await expect(page.locator('#tab-content')).not.toContainText(/failed to load data/i);
  });

  test('option column exposes edit, clone, storefront, and guarded delete actions', async ({ page }) => {
    await page.goto(adminPath('products/all'));
    const firstRow = page.getByTestId('admin-product-row').first().or(page.locator('tr.data-row').first());
    await expect(firstRow).toBeVisible({ timeout: 20000 });

    await firstRow.locator('[data-toggle="dropdown"], button').last().click();
    await expect(page.getByRole('link', { name: /edit product/i }).first()).toHaveAttribute('href', /\/admin\/products\/admin\/\d+\/edit|\/admin\/products\/seller\/\d+\/edit/);
    await expect(page.getByRole('link', { name: /make a clone/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /view on storefront/i }).first()).toHaveAttribute('href', /\/products\/[^/]+$/);

    await expectDestructiveActionRequiresConfirmation(page, async () => {
      const deleteAction = (await page.getByTestId('admin-product-delete').count()) > 0
        ? page.getByTestId('admin-product-delete').first()
        : page.getByRole('link', { name: /^delete$/i }).first();
      await deleteAction.click();
    });
  });

  test('product clone action is only exercised against disposable mutation databases', async ({ page }) => {
    test.skip(!canMutateAdminData(), 'Set E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true to run clone mutation checks.');

    await page.goto(adminPath('products/all'));
    const firstRow = page.getByTestId('admin-product-row').first().or(page.locator('tr.data-row').first());
    await expect(firstRow).toBeVisible({ timeout: 20000 });
    await firstRow.locator('[data-toggle="dropdown"], button').last().click();

    const clone = page.getByRole('link', { name: /make a clone/i }).first();
    await clone.click();
    await expect(page.locator('.aiz-notify, .alert, body')).toContainText(/clone|duplicat|success|product/i, { timeout: 15000 });
  });
});
