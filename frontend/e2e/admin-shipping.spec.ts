import { test } from '@playwright/test';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const shippingPages = [
  { path: 'countries', title: /countr/i },
  { path: 'states', title: /state/i },
  { path: 'cities', title: /cit/i },
  { path: 'areas', title: /area/i },
  { path: 'zones', title: /zone/i },
  { path: 'carriers', title: /carrier/i },
  { path: 'pick_up_points', title: /pickup|pick up/i },
];

test.describe('Admin shipping and logistics regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const pageCase of shippingPages) {
    test(`${pageCase.path} loads safely`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, pageCase.path, pageCase.title, diagnostics);
      await expectTableOrEmptyState(page);
    });
  }
});
