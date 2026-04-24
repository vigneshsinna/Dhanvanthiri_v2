import { expect, test } from '@playwright/test';
import { adminPath, e2eConfig } from './support/env';
import { expectBladePageTitle, loginToBladeAdmin } from './support/admin';

test.describe('Phase 2 - Blade admin navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  test('/admin opens the Laravel Blade dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.locator('body')).not.toContainText(/@vite\/client|id="root"/i);
    await expect(page.locator('body')).toContainText(/dashboard/i);
  });

  test('topbar Browse Website opens FRONTEND_URL', async ({ page, context }) => {
    const browseWebsite = page
      .getByTestId('admin-browse-website')
      .or(page.locator('[data-title="Browse Website"], [title="Browse Website"]').first());

    await expect(browseWebsite).toBeVisible();
    await expect(browseWebsite).toHaveAttribute('href', new RegExp(`^${escapeRegExp(e2eConfig.storefrontUrl)}`));

    const [storefrontPage] = await Promise.all([
      context.waitForEvent('page'),
      browseWebsite.click(),
    ]);
    await storefrontPage.waitForLoadState('domcontentloaded');
    expect(storefrontPage.url()).toContain(e2eConfig.storefrontUrl);
  });

  for (const item of ['Products', 'Orders', 'Categories', 'Brands', 'CMS Pages', 'Business Settings', 'Uploaded Files', 'Coupons', 'Reports']) {
    test(`sidebar search finds ${item}`, async ({ page }) => {
      await page.locator('#menu-search').fill('');
      await page.locator('#menu-search').pressSequentially(item);
      const menuText = `${await page.locator('#search-menu').innerText()} ${await page.locator('#main-menu').innerText()}`;
      expect(menuText).toMatch(new RegExp(item.replace(/\s+/g, '\\s+'), 'i'));
    });
  }

  const titledPages = [
    { path: 'products/all', title: /products/i },
    { path: 'categories', title: /categor/i },
    { path: 'brands', title: /brand/i },
    { path: 'all_orders', title: /orders/i },
    { path: 'website/custom-pages', title: /pages|custom/i },
    { path: 'website/header', title: /header|website/i },
    { path: 'coupon', title: /coupon/i },
    { path: 'business-settings', title: /business|settings/i },
  ];

  for (const pageCase of titledPages) {
    test(`${pageCase.path} shows expected title or breadcrumb`, async ({ page }) => {
      await page.goto(adminPath(pageCase.path));
      await expectBladePageTitle(page, pageCase.title);
      await expect(page.locator('.breadcrumb, [aria-label="breadcrumb"], .aiz-titlebar').first()).toBeVisible();
    });
  }
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
