import { expect, test } from '@playwright/test';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const reportPages = [
  { path: 'in_house_sale_report', title: /sale report|in house/i },
  { path: 'seller_sale_report', title: /seller.*(sale|selling)|sale report/i },
  { path: 'stock_report', title: /stock report|stock/i },
  { path: 'wish_report', title: /wish/i },
  { path: 'user_search_report', title: /search report|user search/i },
  { path: 'commission-log', title: /commission/i },
  { path: 'reports/earning-payout-report', title: /earning|payout|sales/i },
];

test.describe('Admin reports regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const reportPage of reportPages) {
    test(`${reportPage.path} loads without SQL or 500 errors`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, reportPage.path, reportPage.title, diagnostics);
      await expect(page.locator('body')).not.toContainText(/Unknown column ['"`]?amount|SQLSTATE\[42S22\]/i);
      await expectTableOrEmptyState(page);
    });
  }
});
