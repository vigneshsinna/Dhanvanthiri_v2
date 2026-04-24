# Admin Panel End-to-End Verification Pack

## Purpose

This pack verifies the Laravel Blade Admin end to end and confirms admin-managed data reaches the React storefront or public APIs where applicable.

Use it after major admin, backend, API, or storefront wiring changes.

## Architecture Assumption

- Laravel Blade Admin remains the production admin.
- React storefront owns customer-facing pages.
- Laravel backend/API connects admin-managed data to the storefront.
- Admin verification must cover internal admin workflow correctness and storefront/API reflection.

## Automated Coverage Added

Playwright tests live in `frontend/e2e/` because Playwright is installed in the React workspace.

| Suite | Scope |
|---|---|
| `blade-admin-navigation.spec.ts` | Login, dashboard, sidebar search, breadcrumbs |
| `admin-products.spec.ts` | All Products table loading, option actions, clone guard |
| `product-admin-storefront.spec.ts` | Product admin-to-storefront reflection |
| `orders-admin-storefront.spec.ts` | Order admin-to-account/tracking reflection |
| `admin-marketing.spec.ts` | Coupons, flash deals, popup, newsletter, subscribers, email templates |
| `admin-reports.spec.ts` | Sale, stock, wishlist, search, commission, earning/payout reports |
| `admin-cms-settings.spec.ts` | Pages, banners/header/footer, business settings, language, currency, tax |
| `admin-shipping.spec.ts` | Countries, states, cities, areas, zones, carriers, pickup points |
| `admin-permissions.spec.ts` | Staff, roles, restricted admin URL 5xx guard |
| `admin-uploads-utilities.spec.ts` | Uploaded files, sitemap, server status, update page |
| `categories-brands-admin-storefront.spec.ts` | Category/brand storefront reflection |
| `cms-banners-settings.spec.ts` | CMS/banner/settings storefront reflection |
| `safety-accessibility.spec.ts` | Destructive confirmations, keyboard/a11y safety |

## Safety Rule

Create, edit, clone, delete, and status-update checks must only run when both flags are true:

```env
E2E_ALLOW_MUTATION=true
E2E_DB_IS_DISPOSABLE=true
```

Read-only smoke and regression tests run without those flags.

## Known Regression Targets

| Area | Verification |
|---|---|
| All Products option actions | Edit/view/clone/delete controls exist; delete requires confirmation; clone only runs on disposable DBs |
| Reports SQL error | Report pages assert no `SQLSTATE`, no `Unknown column`, and no backend 5xx responses |
| Marketing blank pages | Flash Deals, Dynamic Popup, Email Templates, and related marketing pages must render visible content |
| Product AJAX spinner | All Products waits for spinner removal and table/empty state |
| Sidebar search | Existing navigation suite searches Products, Orders, Categories, Brands, CMS Pages, Business Settings, Uploaded Files, Coupons, and Reports |

## Run

```bash
cd frontend
npm run test:e2e
```

Mutation suite:

```bash
cd frontend
E2E_ALLOW_MUTATION=true E2E_DB_IS_DISPOSABLE=true npm run test:e2e:mutation
```
