# Admin Module Automation Test Plan

## Objective

Automate Laravel Blade Admin verification with Playwright while protecting shared or production-like databases from writes.

## Required Environment Variables

```env
APP_URL=
FRONTEND_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
TEST_CUSTOMER_EMAIL=
TEST_CUSTOMER_PASSWORD=
E2E_ALLOW_MUTATION=false
E2E_DB_IS_DISPOSABLE=false
```

The repo also supports `LARAVEL_APP_URL`, `STOREFRONT_URL`, `ADMIN_BASE_URL`, `API_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_CUSTOMER_EMAIL`, and `E2E_CUSTOMER_PASSWORD`.

## Mutation Safety Rule

Mutating tests must be skipped unless:

```env
E2E_ALLOW_MUTATION=true
E2E_DB_IS_DISPOSABLE=true
```

`frontend/e2e/setup-mutation-db.mjs` refuses to reset or seed the database unless both are true.

## Priority Automation

| Priority | Coverage |
|---|---|
| P0 | Admin opens, products list loads, option actions are wired, orders load, reports load without SQL errors, marketing pages are not blank, business/payment/shipping settings load safely |
| P1 | Product/category/brand/order/CMS mutation flows on disposable DB, uploads, sidebar search |
| P2 | Accessibility, keyboard navigation, destructive confirmation consistency |

## Implemented Suites

| Suite | Scope |
|---|---|
| `admin-products.spec.ts` | Product AJAX table, option column edit/clone/delete/view controls |
| `admin-reports.spec.ts` | Report page health and `amount` SQL regression guard |
| `admin-marketing.spec.ts` | Coupons, flash deals, dynamic popup, newsletter, subscribers, email templates |
| `admin-cms-settings.spec.ts` | CMS and setup/configuration smoke coverage |
| `admin-shipping.spec.ts` | Shipping/logistics smoke coverage |
| `admin-permissions.spec.ts` | Staff/roles and restricted URL 5xx guard |
| `admin-uploads-utilities.spec.ts` | Uploads and utility pages |

## Final Report Expectations

Every Playwright run writes:

- passed/failed tests in the list reporter
- screenshots/video/traces for failures
- HTML report in `frontend/playwright-report`
- page diagnostics attachments for regression smoke pages

Failures should be copied into `admin-bug-report-template.md` with the module, route, suspected controller/view/JS area, and evidence.
