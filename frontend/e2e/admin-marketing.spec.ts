import { test } from '@playwright/test';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const marketingPages = [
  { path: 'coupon', title: /coupon/i },
  { path: 'flash_deals', title: /flash/i },
  { path: 'dynamic-popups', title: /dynamic|popup/i },
  { path: 'newsletter', title: /newsletter/i },
  { path: 'subscribers', title: /subscriber/i },
  { path: 'email-template/admin', title: /email|template/i },
];

test.describe('Admin marketing regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const marketingPage of marketingPages) {
    test(`${marketingPage.path} is not blank and has usable content`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, marketingPage.path, marketingPage.title, diagnostics);
      await expectTableOrEmptyState(page);
    });
  }
});
