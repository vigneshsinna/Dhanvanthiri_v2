# Blade Admin to React Storefront E2E QA

This suite uses Playwright from `frontend/` because the repository already had Playwright installed there.

## What It Covers

- Blade admin login, dashboard, topbar storefront link, sidebar search, and admin page titles.
- Admin-managed product, category, brand, order, CMS page, banner, and settings data flowing to React/public APIs.
- Destructive-action confirmation, keyboard reachability, icon-button labels, and basic axe checks.
- Deployment routing for `/api/*`, `/admin/*`, and React public routes.

Mutating checks are guarded by `E2E_ALLOW_MUTATION=true` so they do not alter production or shared data accidentally.

## Required Environment

Copy `.env.testing.example` and set:

- `LARAVEL_APP_URL`: Laravel app origin, for example `http://127.0.0.1:8000`.
- `STOREFRONT_URL` or `FRONTEND_URL`: React storefront origin, for example `http://localhost:5173`.
- `ADMIN_BASE_URL`: usually `${LARAVEL_APP_URL}/admin`.
- `API_BASE_URL`: usually `${LARAVEL_APP_URL}/api`.
- `E2E_SYSTEM_KEY`: API system key used by `/api/v2`.
- `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`: seeded test admin credentials.
- `E2E_CUSTOMER_EMAIL` and `E2E_CUSTOMER_PASSWORD`: required for authenticated account checks.
- `E2E_ALLOW_MUTATION=true`: only for disposable test databases.
- `E2E_DB_IS_DISPOSABLE=true`: required with `E2E_ALLOW_MUTATION=true` before any create/update/delete flow runs.
- `E2E_SUPER_ADMIN_EMAIL` and `E2E_SUPER_ADMIN_PASSWORD`: required for business settings write checks.

The documented local admin seed is `admin@animazon.local` / `Admin@123`. Do not use production secrets.

## Suggested Local Startup

From the repository root:

```bash
php artisan migrate --env=testing
php artisan db:seed --class=CreateAdminUserSeeder --env=testing
php artisan db:seed --class=DhanvathiriProductsSeeder --env=testing
php artisan db:seed --class=DhanvathiriOrdersSeeder --env=testing
php artisan serve --host=127.0.0.1 --port=8000
```

In another terminal:

```bash
cd frontend
npm install
npm run test:e2e
```

Use `npm run test:e2e:headed` to watch the browser and `npm run test:e2e:report` to open the HTML report.

For the disposable mutation suite, use a testing database only:

```bash
cd frontend
E2E_ALLOW_MUTATION=true E2E_DB_IS_DISPOSABLE=true npm run test:e2e:mutation
```

`test:e2e:mutation` runs `frontend/e2e/setup-mutation-db.mjs`, which refuses to continue unless
`E2E_ALLOW_MUTATION=true` and `E2E_DB_IS_DISPOSABLE=true`, creates `database/testing.sqlite` when needed,
runs `composer dump-autoload`, and resets the testing database with `Database\Seeders\E2eMutationSeeder`.

## Reports And Artifacts

Playwright writes:

- HTML report: `frontend/playwright-report`
- Failure screenshots/videos/traces: `frontend/test-results`

## Stable Selectors Added

- `data-testid="admin-browse-website"`
- `data-testid="admin-product-row"`
- `data-testid="admin-product-price-quick-edit"`
- `data-testid="admin-product-stock-quick-edit"`
- `data-testid="admin-product-view-storefront"`
- `data-testid="admin-product-delete"`
- `data-testid="storefront-header"`
- `data-testid="storefront-footer"`
- `data-testid="storefront-home-hero"`
- `data-testid="storefront-home-banner"`
- `data-testid="storefront-product-card"`
- `data-testid="storefront-product-title"`
- `data-testid="storefront-product-price"`
- `data-testid="storefront-add-to-cart"`
