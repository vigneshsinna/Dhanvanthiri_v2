import { expect, test } from '@playwright/test';
import { adminPath, canMutateAdminData, storefrontPath } from './support/env';
import { adminApi, expectDestructiveActionRequiresConfirmation, getAdminApiToken, loginToBladeAdmin } from './support/admin';
import { getPublicApi, uniqueSlug, waitForStorefrontRefresh } from './support/storefront';

test.describe('Phase 3 - Product admin to React storefront', () => {
  test('View on Storefront opens /products/{slug} on React', async ({ page, context }) => {
    await loginToBladeAdmin(page);
    await page.goto(adminPath('products/all'));

    const firstRow = page.getByTestId('admin-product-row').first().or(page.locator('tr.data-row').first());
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.locator('[data-toggle="dropdown"], button').last().click();

    const viewLink = (await page.getByTestId('admin-product-view-storefront').count()) > 0
      ? page.getByTestId('admin-product-view-storefront').first()
      : page.getByRole('link', { name: /view on storefront/i }).first();
    await expect(viewLink).toHaveAttribute('href', /\/products\/[^/]+$/);

    const [storefrontPage] = await Promise.all([
      context.waitForEvent('page'),
      viewLink.click(),
    ]);
    await storefrontPage.waitForLoadState('domcontentloaded');
    await expect(storefrontPage).toHaveURL(/\/products\/[^/]+$/);
    await expect(storefrontPage.locator('#root')).toBeVisible();
  });

  test('single and bulk delete actions require confirmation', async ({ page }) => {
    await loginToBladeAdmin(page);
    await page.goto(adminPath('products/all'));
    const firstRow = page.getByTestId('admin-product-row').first().or(page.locator('tr.data-row').first());
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    await firstRow.locator('[data-toggle="dropdown"], button').last().click();
    await expectDestructiveActionRequiresConfirmation(page, async () => {
      const deleteAction = (await page.getByTestId('admin-product-delete').count()) > 0
        ? page.getByTestId('admin-product-delete').first()
        : page.getByRole('link', { name: /delete/i }).first();
      await deleteAction.click();
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal.show, [role="dialog"]').first()).toBeHidden({ timeout: 5000 });

    await page.locator('.check-one').first().evaluate((checkbox) => {
      const input = checkbox as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expectDestructiveActionRequiresConfirmation(page, async () => {
      await page.getByRole('button', { name: /bulk action/i }).click();
      await page.locator('.dropdown-menu a[onclick="bulkDelete()"]').click({ force: true });
    });
  });

  test.describe('mutating product bridge checks', () => {
    test.skip(!canMutateAdminData(), 'Set E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true against a seeded testing database to run mutating admin/storefront checks.');

    test('creates, publishes, edits, unpublishes, and deletes product through admin-managed data bridge', async ({ page, request }) => {
      const token = await getAdminApiToken(request);
      const slug = uniqueSlug('e2e-product');
      const createdName = `E2E Product ${slug}`;
      const updatedName = `${createdName} Updated`;

      const createResponse = await adminApi(request, 'post', 'products', token, {
        name: createdName,
        slug,
        sku: `E2E-${Date.now()}`,
        price: 321,
        cost_price: 200,
        description: 'Created by Playwright E2E.',
        status: 'active',
        stock_quantity: 9,
        meta_title: `${createdName} SEO`,
        meta_description: 'E2E product meta description',
      });
      expect(createResponse.ok(), await createResponse.text()).toBeTruthy();
      const created = (await createResponse.json()).data;

      await expect
        .poll(async () => (await getPublicApi(request, `products/${slug}/0`)).ok(), { timeout: 60_000 })
        .toBeTruthy();

      await waitForStorefrontRefresh(page, '/products', createdName);
      await page.getByRole('link', { name: new RegExp(createdName, 'i') }).first().click();
      await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
      await expect(page.getByRole('heading', { name: new RegExp(createdName, 'i') })).toBeVisible();
      await expect(page.getByText(/321/).first()).toBeVisible();

      const updateResponse = await adminApi(request, 'put', `products/${created.id}`, token, {
        name: updatedName,
        slug,
        sku: `E2E-UPD-${Date.now()}`,
        price: 432,
        description: 'Updated by Playwright E2E.',
        status: 'active',
        stock_quantity: 4,
        meta_title: `${updatedName} SEO`,
        meta_description: 'Updated E2E product meta description',
      });
      expect(updateResponse.ok(), await updateResponse.text()).toBeTruthy();

      await waitForStorefrontRefresh(page, `/products/${slug}`, updatedName);
      await expect(page.getByText(/432/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();

      const archiveResponse = await adminApi(request, 'put', `products/${created.id}`, token, { status: 'archived' });
      expect(archiveResponse.ok(), await archiveResponse.text()).toBeTruthy();
      await expect
        .poll(async () => (await getPublicApi(request, `products/${slug}/0`)).status(), { timeout: 60_000 })
        .not.toBe(200);

      const deleteResponse = await adminApi(request, 'delete', `products/${created.id}`, token);
      expect(deleteResponse.ok(), await deleteResponse.text()).toBeTruthy();

      await page.goto(storefrontPath(`/products/${slug}`));
      await expect(page.getByText(/not found|browse products/i).first()).toBeVisible({ timeout: 15000 });
    });
  });
});
