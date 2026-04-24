import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiPath, e2eConfig, storefrontPath } from './env';

export async function waitForStorefrontRefresh(page: Page, path: string, expectedText?: RegExp | string, timeout = 60_000) {
  await expect
    .poll(async () => {
      await page.goto(storefrontPath(path), { waitUntil: 'domcontentloaded' });
      if (!expectedText) {
        return true;
      }
      return page.getByText(expectedText).first().isVisible().catch(() => false);
    }, { timeout, intervals: [1000, 2500, 5000] })
    .toBeTruthy();
}

export async function getPublicApi(request: APIRequestContext, path: string) {
  return request.get(apiPath(`/v2/${path.replace(/^\/+/, '')}`), {
    headers: {
      Accept: 'application/json',
      'System-Key': e2eConfig.systemKey,
    },
  });
}

export async function expectReactRoute(page: Page, path: string) {
  await page.goto(storefrontPath(path), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Laravel|Symfony|Not Found\s*404/i);
}

export function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
