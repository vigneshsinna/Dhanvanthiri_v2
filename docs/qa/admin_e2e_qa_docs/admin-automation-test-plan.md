# Admin Module Automation Test Plan

## Objective

Create automated tests to verify that all Laravel Blade Admin modules are functional and that admin-managed data reflects in the React storefront where applicable.

## Recommended Test Framework

Use Playwright for browser E2E testing.

## Test Suites

| Suite | Scope |
|---|---|
| `admin-navigation.spec.ts` | Admin login, dashboard, sidebar, breadcrumbs |
| `admin-products.spec.ts` | Product list, option column, create/edit/clone/delete, storefront reflection |
| `admin-orders.spec.ts` | Order list/detail/status/invoice/tracking |
| `admin-marketing.spec.ts` | Coupons, flash deals, popup, newsletter, subscribers |
| `admin-reports.spec.ts` | Sale, stock, wishlist, search, commission, earning reports |
| `admin-cms-settings.spec.ts` | Pages, banners, header/footer, business settings |
| `admin-shipping.spec.ts` | Countries, states, cities, zones, carriers, pickup points |
| `admin-permissions.spec.ts` | Staff, roles, access control |
| `admin-uploads-utilities.spec.ts` | Uploads, cache, sitemap, server status |

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

## Mutation Safety Rule

Tests that create, edit, clone, delete, or update records must only run when:

```env
E2E_ALLOW_MUTATION=true
E2E_DB_IS_DISPOSABLE=true
```

If these are not enabled, tests should run in read-only verification mode.

## Automation Coverage Priorities

### P0 Automation
- Admin opens
- Products list loads and option column actions work
- Order list/detail loads
- Reports load without SQL errors
- Marketing pages load
- Business settings load
- Storefront reflection for product/category/banner/page/settings
- Payment/shipping settings pages load safely

### P1 Automation
- Create/edit product
- Create/edit category/brand
- Update order status
- Create coupon/flash deal
- Update CMS/legal page
- Upload image
- Sidebar search

### P2 Automation
- Accessibility checks
- Keyboard navigation
- Responsive admin layouts
- Tooltip and confirmation consistency

## Specific Regression Tests for Known Issues

### All Products option column

- Open All Products
- Wait for AJAX table to load
- For first product row:
  - click edit
  - verify edit page opens
  - go back
  - click clone
  - verify clone action/page works
  - go back
  - click delete
  - verify confirmation appears

### Reports SQL error

- Open each report page
- Assert no `SQLSTATE`
- Assert no `Unknown column`
- Assert HTTP status is not 500
- Assert report table or empty state is visible

### Marketing blank pages

- Open Flash Deals
- Open Dynamic Popup
- Open Email Templates
- Assert page title is visible
- Assert list/table/form or empty state is visible
- Assert no 404/500/blank content area

### Product AJAX spinner

- Open All Products
- Assert spinner disappears within timeout
- Assert table rows or empty state appear
- If AJAX fails, capture response body

## Final Report Expected

Every automation run should output:

- passed tests
- failed tests
- failed module
- screenshot/video
- console errors
- network errors
- backend 500/SQL errors
- suspected route/controller/view
