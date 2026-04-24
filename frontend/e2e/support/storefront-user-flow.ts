import { expect, type Page, type TestInfo } from '@playwright/test';
import { canMutateAdminData, e2eConfig } from './env';

const criticalConsolePattern = /(uncaught|typeerror|referenceerror|syntaxerror|failed to fetch|networkerror)/i;
const ignoredConsolePattern = /(favicon|devtools|download the react devtools|hydration)/i;

export type StorefrontIssueCollector = {
  consoleErrors: string[];
  backendErrors: string[];
};

export function attachStorefrontIssueCollector(page: Page): StorefrontIssueCollector {
  const issues: StorefrontIssueCollector = {
    consoleErrors: [],
    backendErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const text = message.text();
    if (!ignoredConsolePattern.test(text) && criticalConsolePattern.test(text)) {
      issues.consoleErrors.push(text);
    }
  });

  page.on('pageerror', (error) => {
    issues.consoleErrors.push(error.message);
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 500) {
      issues.backendErrors.push(`${status} ${response.url()}`);
    }
  });

  return issues;
}

export function expectNoCriticalStorefrontIssues(issues: StorefrontIssueCollector) {
  expect(issues.consoleErrors, 'critical browser console/page errors').toEqual([]);
  expect(issues.backendErrors, 'backend 5xx responses during storefront flow').toEqual([]);
}

export function skipUnlessMutationAllowed(testInfo: TestInfo) {
  if (!canMutateAdminData()) {
    testInfo.skip(true, 'Mutating storefront E2E tests require E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true.');
  }
}

export function skipUnlessCustomerCredentials(testInfo: TestInfo) {
  if (!e2eConfig.customerEmail || !e2eConfig.customerPassword) {
    testInfo.skip(true, 'Customer flows require E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD.');
  }
}

export async function openCatalog(page: Page) {
  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-testid="storefront-product-card"]').first()).toBeVisible({ timeout: 15_000 });
}

export async function openFirstProduct(page: Page) {
  await openCatalog(page);
  const firstProduct = page.locator('a[href*="/products/"]').first();
  const productName = (await firstProduct.textContent())?.trim() ?? '';
  await firstProduct.click();
  await expect(page).toHaveURL(/\/products\/[^/]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
  return { productName };
}

export async function addFirstProductToCart(page: Page) {
  await openCatalog(page);
  const addButton = page.locator('[data-testid="storefront-add-to-cart"]').first();
  await expect(addButton).toBeVisible({ timeout: 15_000 });
  await addButton.click();
  await expect.poll(async () => {
    const cartLinkText = await page.getByRole('link', { name: /cart/i }).first().textContent().catch(() => '');
    return cartLinkText ?? '';
  }, { timeout: 10_000 }).toMatch(/\d+/);
}

export async function loginAsCustomer(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(e2eConfig.customerEmail);
  await page.getByLabel(/password/i).fill(e2eConfig.customerPassword);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/products|\/profile|\/checkout|\/account/, { timeout: 15_000 });
}

export function parseMoney(text: string | null | undefined): number | null {
  if (!text) {
    return null;
  }
  const normalized = text.replace(/,/g, '').match(/(?:Rs|₹)?\s*([0-9]+(?:\.[0-9]+)?)/i);
  return normalized ? Number(normalized[1]) : null;
}

export async function visibleMoneyValues(page: Page) {
  const values = await page.locator('text=/₹|Rs\\s*[0-9]/i').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent ?? '')
  );
  return values.map(parseMoney).filter((value): value is number => value !== null);
}
