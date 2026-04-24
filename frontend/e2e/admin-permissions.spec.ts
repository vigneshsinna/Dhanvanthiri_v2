import { expect, test } from '@playwright/test';
import { adminPath } from './support/env';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const permissionPages = [
  { path: 'staffs', title: /staff/i },
  { path: 'roles', title: /role|permission/i },
];

test.describe('Admin staff and permissions regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const pageCase of permissionPages) {
    test(`${pageCase.path} loads safely`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, pageCase.path, pageCase.title, diagnostics);
      await expectTableOrEmptyState(page);
    });
  }

  test('direct restricted-looking admin URL never falls through to a 500', async ({ page }) => {
    const response = await page.goto(adminPath('admin-permissions'), { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
  });
});
