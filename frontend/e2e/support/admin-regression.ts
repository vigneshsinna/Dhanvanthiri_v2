import { expect, type Page, type TestInfo } from '@playwright/test';
import { adminPath, e2eConfig } from './env';

const backendErrorPattern = /SQLSTATE|Unknown column|QueryException|Exception|Whoops|Internal Server Error|Server Error|^\s*500\s*$/i;

export type PageDiagnostics = {
  consoleErrors: string[];
  failedRequests: string[];
  backendResponses: string[];
};

export function attachPageDiagnostics(page: Page): PageDiagnostics {
  const diagnostics: PageDiagnostics = {
    consoleErrors: [],
    failedRequests: [],
    backendResponses: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('requestfailed', (request) => {
    if (isAppUrl(request.url())) {
      diagnostics.failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`.trim());
    }
  });

  page.on('response', async (response) => {
    if (response.status() >= 500) {
      diagnostics.backendResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return diagnostics;
}

export async function expectHealthyAdminPage(
  page: Page,
  testInfo: TestInfo,
  path: string,
  visibleText: RegExp,
  diagnostics: PageDiagnostics,
) {
  const response = await page.goto(adminPath(path), { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${path} returned an HTTP error`).toBeLessThan(500);
  const content = (await page.locator('.aiz-main-content').count()) > 0
    ? page.locator('.aiz-main-content').first()
    : page.locator('body');
  await expect(content).toContainText(visibleText, { timeout: 15000 });
  await expect(content).not.toContainText(backendErrorPattern);

  const bodyText = (await content.innerText()).trim();
  expect(bodyText.length, `${path} rendered a blank or nearly blank admin body`).toBeGreaterThan(40);

  await testInfo.attach(`${slugify(path)}-diagnostics`, {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  });

  expect(diagnostics.backendResponses, `${path} triggered backend 5xx responses`).toEqual([]);
  expect(diagnostics.failedRequests, `${path} triggered failed network requests`).toEqual([]);
}

export async function expectTableOrEmptyState(page: Page) {
  const tableOrState = page
    .locator('table, .aiz-table, .empty-state, .card, .card-body, canvas, .alert, [data-testid$="-empty"]')
    .or(page.getByText(/no .*found|nothing found|empty/i));
  await expect
    .poll(async () => {
      const count = await tableOrState.count();
      for (let index = 0; index < count; index += 1) {
        if (await tableOrState.nth(index).isVisible().catch(() => false)) {
          return true;
        }
      }
      return false;
    }, { timeout: 15000 })
    .toBeTruthy();
}

function slugify(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'admin-page';
}

function isAppUrl(url: string) {
  return url.startsWith(e2eConfig.laravelUrl)
    || url.startsWith(e2eConfig.storefrontUrl)
    || url.startsWith(e2eConfig.apiBaseUrl)
    || url.startsWith(e2eConfig.adminBaseUrl);
}
