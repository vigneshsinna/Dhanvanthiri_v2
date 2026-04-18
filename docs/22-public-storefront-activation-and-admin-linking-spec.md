# Public Storefront Activation and Admin Linking Specification

## Objective

Make the **React storefront** the live public website while keeping Laravel as:
- commerce engine,
- admin backend,
- API provider,
- payment/callback coordinator.

## Current issue

Today the admin still assumes:

**website = Laravel `route('home')`**

In the headless architecture, that must become:

**website = configured storefront URL**

## Required changes

### 1. Introduce `FRONTEND_URL`

Add a backend configuration value such as:

```env
FRONTEND_URL=https://your-public-store.com
```

Use it for:
- admin “Browse Website” button,
- seller “Browse Website” button,
- any backend-generated public-site links,
- payment success/failure redirect targets where appropriate.

### 2. Replace legacy `route('home')` assumptions in admin entry points

Priority locations already confirmed in the current codebase:
- `resources/views/backend/inc/admin_nav.blade.php`
- `resources/views/seller/inc/seller_nav.blade.php`
- homepage/page editor views that render “View” or “Browse Website” controls

These should open `config('app.frontend_url')` or a dedicated config helper, not `route('home')`.

### 3. Make React the public root

Target production routing:
- `/` → React storefront
- `/api/*` → Laravel
- `/admin/*` → Laravel admin
- `/seller/*` → Laravel seller area if still retained
- `/storage/*` → Laravel/public assets as needed

### 4. Add SPA fallback rules

For the public storefront deployment:
- if request path is not `/api/*`, `/admin/*`, `/seller/*`, `/storage/*`, and not a real file,
- return `frontend/dist/index.html`

This is required for routes such as:
- `/product/:slug`
- `/category/:slug`
- `/brand/:slug`
- `/blog/:slug`
- `/policy/:type`
- `/account/*`
- `/checkout/*`

### 5. Keep legacy Blade storefront only as temporary fallback

During rollout:
- keep Blade storefront code in place,
- but stop treating it as the public site,
- use it only as rollback fallback until React cutover is validated.

## Payment/callback implications

Many backend payment controllers still redirect to `route('home')` or Blade-oriented routes.

For public-site cutover, each payment callback must end in one of these patterns:
- React success page, e.g. `/checkout/success?order=...`
- React failure page, e.g. `/checkout/failure?...`
- React order/account page when appropriate

## Acceptance criteria

- Admin “Browse Website” opens the React storefront URL
- Seller “Browse Website” opens the React storefront URL
- Public root `/` serves React storefront, not Blade home
- Direct refresh of React routes works without 404
- Payment success/failure lands on React routes
- Legacy Blade storefront is no longer the customer entry point

## Implementation order

1. Add `FRONTEND_URL`
2. Update admin/seller browse links
3. Deploy React storefront to public domain/root
4. Add reverse-proxy / web server route rules
5. Update payment callback redirect strategy
6. Validate all public deep links
7. Keep rollback path for one release cycle
