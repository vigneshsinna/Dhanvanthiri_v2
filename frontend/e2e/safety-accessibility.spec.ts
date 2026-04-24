import { expect, test } from '@playwright/test';
import { adminPath } from './support/env';
import { expectNoCriticalA11yViolations } from './support/a11y';
import { expectDestructiveActionRequiresConfirmation, loginToBladeAdmin } from './support/admin';

test.describe('Phase 7 - Safety and accessibility', () => {
  test('admin login required fields and validation are visible', async ({ page }) => {
    await page.goto(adminPath('login'));
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.locator('#email, input[name="email"]').first()).toBeVisible();
    await expect(page.locator('#password, input[name="password"]').first()).toBeVisible();
    await expectNoCriticalA11yViolations(page);
  });

  test('icon-only admin topbar actions have accessible labels or tooltips', async ({ page }) => {
    await loginToBladeAdmin(page);
    const iconButtons = page.locator('.aiz-topbar a.btn-icon, .aiz-topbar button.btn-icon');
    const count = Math.min(await iconButtons.count(), 12);

    for (let index = 0; index < count; index += 1) {
      const control = iconButtons.nth(index);
      const label = await control.getAttribute('aria-label');
      const title = await control.getAttribute('title');
      const dataTitle = await control.getAttribute('data-title');
      const text = (await control.innerText().catch(() => '')).trim();
      expect(Boolean(label || title || dataTitle || text), `icon control ${index} needs aria-label/title/data-title/text`).toBeTruthy();
    }
  });

  test('keyboard tabbing reaches admin shell, filters, row actions, and form controls', async ({ page }) => {
    await loginToBladeAdmin(page);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await page.goto(adminPath('products/all'));
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(page.locator(':focus')).toBeVisible();

    await page.goto(adminPath('products/create'));
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('destructive product actions require confirmation and visible feedback surface exists', async ({ page }) => {
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
    await expect(page.locator('.alert, .aiz-notify, .swal2-container, #delete-modal, [role="dialog"]').first()).toBeAttached();
  });

  test('laptop-width admin product table controls do not clip horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await loginToBladeAdmin(page);
    await page.goto(adminPath('products/all'));
    const tableOrCard = page.locator('.card, .table-responsive, #aiz-data-table').first();
    await expect(tableOrCard).toBeVisible({ timeout: 15000 });

    const box = await tableOrCard.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1367);
  });
});
