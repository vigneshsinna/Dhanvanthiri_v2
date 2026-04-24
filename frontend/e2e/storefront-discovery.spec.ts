import { test, expect } from '@playwright/test';
import {
  attachStorefrontIssueCollector,
  expectNoCriticalStorefrontIssues,
  openCatalog,
  openFirstProduct,
  visibleMoneyValues,
} from './support/storefront-user-flow';

test.describe('Storefront discovery and evaluation', () => {
  test.describe.configure({ timeout: 60_000 });

  test('category browsing, filters, and sorting render stable product results', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await openCatalog(page);

    await expect(page.getByRole('button', { name: /all products/i })).toBeVisible();
    await page.getByRole('button', { name: /thokku/i }).click();
    await expect(page.locator('[data-testid="storefront-product-card"]').first()).toBeVisible();

    const sort = page.locator('#sort-select');
    await expect(sort).toBeVisible();
    await sort.selectOption('price_asc');

    const prices = (await visibleMoneyValues(page)).slice(0, 8);
    expect(prices.length, 'catalog should expose product prices after sorting').toBeGreaterThan(0);
    expectNoCriticalStorefrontIssues(issues);
  });

  test('product detail page exposes image, description, reviews, variants, and cart CTA', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await openFirstProduct(page);

    await expect(page.getByRole('img').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
    await expect(page.getByText(/description|ingredients|pair|review|rating|customer/i).first()).toBeVisible();

    const variantControl = page.getByRole('button', { name: /g|kg|ml|size|variant|pack/i }).first()
      .or(page.locator('select').first())
      .or(page.locator('input[type="radio"]').first());
    await expect(variantControl).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoCriticalStorefrontIssues(issues);
  });

  test('wishlist requires a clear login path for guests', async ({ page }) => {
    const issues = attachStorefrontIssueCollector(page);

    await page.goto('/wishlist', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login|wishlist/);
    await expect(page.getByText(/sign in|log in|account/i).first()).toBeVisible();

    expectNoCriticalStorefrontIssues(issues);
  });

  test('basic search submits query and shows matching products', async ({ page }) => {
    await page.route('**/api/v2/products/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            id: 9001,
            name: 'Poondu Thokku',
            slug: 'poondu-thokku-e2e',
            thumbnail_image: '/images/placeholder-product.png',
            has_discount: false,
            discount: '',
            stroked_price: '₹180',
            main_price: '₹180',
            rating: 4.7,
            review_count: 12,
            sales: 20,
            is_wholesale: false,
            links: { details: '/products/poondu-thokku-e2e' },
          }],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('searchbox', { name: /search products/i }).fill('poondu');
    await page.getByRole('button', { name: /^search$/i }).click();

    await expect(page).toHaveURL(/\/products\?search=poondu/);
    await expect(page.getByText(/search results for "poondu"/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /poondu thokku/i }).first()).toBeVisible();
  });

  test('basic search shows a clear no-results state', async ({ page }) => {
    await page.route('**/api/v2/products/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        }),
      });
    });

    await page.goto('/products?search=definitely-not-real-e2e', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/search results for "definitely-not-real-e2e"/i)).toBeVisible();
    await expect(page.getByText(/no products found|no results/i).first()).toBeVisible();
  });
});
