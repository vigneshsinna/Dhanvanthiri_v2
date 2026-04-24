import { test } from '@playwright/test';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const cmsAndSettingsPages = [
  { path: 'website/custom-pages', title: /custom|pages|website/i },
  { path: 'website/header', title: /header|website/i },
  { path: 'website/footer', title: /footer|website/i },
  { path: 'website/top-bar-list', title: /banner|top bar|website/i },
  { path: 'business-settings', title: /business|settings/i },
  { path: 'languages', title: /language/i },
  { path: 'currency', title: /currenc/i },
  { path: 'tax', title: /tax/i },
];

test.describe('Admin CMS and setup regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const pageCase of cmsAndSettingsPages) {
    test(`${pageCase.path} loads safely`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, pageCase.path, pageCase.title, diagnostics);
      await expectTableOrEmptyState(page);
    });
  }
});
