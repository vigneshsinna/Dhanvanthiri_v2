import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { adminPath, apiPath, e2eConfig } from './env';

export async function loginToBladeAdmin(page: Page) {
  await page.goto(adminPath('login'));
  await page.locator('#email, input[name="email"]').first().fill(e2eConfig.adminEmail);
  await page.locator('#password, input[name="password"]').first().fill(e2eConfig.adminPassword);
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForLoadState('domcontentloaded');

  if (/\/admin\/login/.test(page.url())) {
    const errorText = await page.locator('.invalid-feedback, .alert, .text-danger').first().innerText().catch(() => '');
    throw new Error(`Blade admin login did not leave /admin/login. ${errorText || 'Check E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD and seeded admin user.'}`);
  }

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.locator('body')).toContainText(/dashboard/i, { timeout: 20000 });
}

export async function getAdminApiToken(request: APIRequestContext, credentials = {
  email: e2eConfig.adminEmail,
  password: e2eConfig.adminPassword,
}) {
  const response = await request.post(apiPath('/v2/auth/login'), {
    headers: {
      Accept: 'application/json',
      'System-Key': e2eConfig.systemKey,
    },
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  expect(response.ok(), `admin API login failed with ${response.status()}`).toBeTruthy();
  const payload = await response.json();
  const token = payload.access_token || payload.data?.access_token || payload.token;
  expect(token, 'admin API login did not return an access token').toBeTruthy();
  return String(token);
}

export async function adminApi(request: APIRequestContext, method: 'get' | 'post' | 'put' | 'delete', path: string, token: string, data?: unknown) {
  const options = {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data,
  };

  return request[method](apiPath(`/admin/${path.replace(/^\/+/, '')}`), options);
}

export async function expectBladePageTitle(page: Page, pattern: RegExp) {
  await expect(page.locator('.page-title, .aiz-titlebar h1, .aiz-titlebar h2, h1, h2').filter({ hasText: pattern }).first()).toBeVisible({ timeout: 15000 });
}

export async function expectDestructiveActionRequiresConfirmation(page: Page, trigger: () => Promise<void>) {
  let dialogSeen = false;
  page.once('dialog', async (dialog) => {
    dialogSeen = true;
    expect(dialog.type()).toMatch(/confirm|alert/);
    await dialog.dismiss();
  });

  await trigger();
  await page.waitForTimeout(500);

  const modal = page.locator('.modal.show, .swal2-popup, #delete-modal.show, [role="dialog"]').first();
  const modalVisible = await modal.isVisible().catch(() => false);
  expect(dialogSeen || modalVisible).toBeTruthy();
}
