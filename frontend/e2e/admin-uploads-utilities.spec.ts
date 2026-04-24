import { test } from '@playwright/test';
import { loginToBladeAdmin } from './support/admin';
import { attachPageDiagnostics, expectHealthyAdminPage, expectTableOrEmptyState } from './support/admin-regression';

const utilityPages = [
  { path: 'uploaded-files', title: /uploaded|files/i },
  { path: 'system/sitemap-generator', title: /sitemap/i },
  { path: 'system/server-status', title: /server|status/i },
  { path: 'system/update', title: /update|system/i },
];

test.describe('Admin uploads and utility regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginToBladeAdmin(page);
  });

  for (const pageCase of utilityPages) {
    test(`${pageCase.path} loads safely`, async ({ page }, testInfo) => {
      const diagnostics = attachPageDiagnostics(page);
      await expectHealthyAdminPage(page, testInfo, pageCase.path, pageCase.title, diagnostics);
      await expectTableOrEmptyState(page);
    });
  }
});
