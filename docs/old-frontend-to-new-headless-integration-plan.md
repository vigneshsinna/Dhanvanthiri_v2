# Old Frontend to New Headless E-commerce Integration Plan

## Purpose

This document explains how to connect the old e-commerce frontend to the new headless commerce backend with the least risk and the least rewrite.

## What the old stack is

### Old frontend
The old frontend is already modern and API-driven:
- React 18
- TypeScript
- Vite
- Redux Toolkit
- React Query
- React Router v6
- React Hook Form + Zod
- Tailwind CSS 3
- React Helmet Async

It is structured by feature modules:
- auth
- catalog
- cart
- checkout
- cms
- orders
- wishlist
- admin

### Old backend
The old backend is:
- Laravel 11
- JWT auth via `tymon/jwt-auth`
- modular route/controller structure
- REST API under `/api`

## What the new headless backend is

The new headless backend is a different commerce contract.
Its storefront API client is built around `/api/v2`, with different endpoint names and, in several places, different request/response shapes.

## Main conclusion

**Do not try to directly swap the old frontend from the old backend to the new backend in one shot.**

The old frontend can absolutely be reused, but it should be connected through an **adapter layer**.

This is the safest path because the UI architecture is already modular, but the API contracts are not one-to-one compatible.

---

## Why a direct swap is risky

### Contract differences already visible

#### Auth
Old frontend expects endpoints like:
- `/auth/register`
- `/auth/login`
- `/auth/refresh`
- `/auth/me`

New headless storefront currently uses endpoints like:
- `/auth/login`
- `/auth/signup`
- `/auth/user`
- different token storage assumptions

#### Catalog
Old frontend expects:
- `/products`
- `/products/:slug`
- `/products/:id/reviews`
- `/categories`

New headless storefront currently uses:
- `/products`
- `/products/:slug/:userId`
- `/reviews/product/:id`
- category and listing helpers with different shapes

#### Cart
Old frontend expects REST-like cart flows:
- `GET /cart`
- `POST /cart/items`
- `PUT /cart/items/:id`
- `DELETE /cart/items/:id`
- coupon on `/cart/coupon`

New headless storefront currently uses:
- `POST /carts`
- `POST /carts/add`
- `POST /carts/change-quantity`
- `DELETE /carts/:id`
- coupon endpoints on different paths

#### Checkout / payment
Old frontend expects:
- `/checkout/validate`
- `/checkout/summary`
- `/payments/intent`
- `/payments/confirm`
- guest checkout/payment endpoints

New headless storefront currently uses:
- `/delivery-info`
- `/shipping_cost`
- `/order/store`
- `/payment-types`
- gateway-specific pay endpoints

#### Account / addresses / wishlist
Old frontend expects:
- `/addresses`
- `/wishlist`
- `/orders`

New headless storefront currently uses:
- `/user/shipping/address`
- `/wishlists`
- `/purchase-history`

Because of these differences, a direct baseURL swap will break many pages.

---

## Recommended integration strategy

## Best option: Keep old UI, replace only the data layer with an adapter

The old frontend is already nicely separated by feature API files.
That is the key advantage.

You should keep:
- pages
- layouts
- components
- route structure
- form UX
- most Redux and React Query usage

You should replace or wrap:
- `src/lib/api/client.ts`
- feature `api.ts` modules
- selected auth/cart/checkout state handling

### Why this is best
Because your old frontend already isolates API calls into files like:
- `features/auth/api.ts`
- `features/catalog/api.ts`
- `features/cart/api.ts`
- `features/checkout/api.ts`
- `features/orders/api.ts`
- `features/wishlist/api.ts`
- `features/cms/api.ts`

That means the migration can happen at the API integration layer instead of page-by-page UI rewrite.

---

## Two practical ways to wire it

## Option A — Frontend adapter layer inside the old frontend

Create a new adapter folder such as:
- `frontend/src/lib/headless/`

Example modules:
- `authAdapter.ts`
- `catalogAdapter.ts`
- `cartAdapter.ts`
- `checkoutAdapter.ts`
- `accountAdapter.ts`
- `cmsAdapter.ts`

These adapters will:
1. call the new headless endpoints
2. transform the response into the old frontend's expected shape
3. keep page components unchanged

### Example
Old UI expects `GET /cart` result in a certain shape.
The adapter can call:
- `POST /api/v2/carts`
- `POST /api/v2/cart-summary`

Then compose that into the old cart view model.

### Pros
- fastest migration
- minimum UI rewrite
- easy incremental rollout

### Cons
- some temporary duplication in mapping logic
- old frontend keeps old assumptions until cleaned up later

## Option B — Compatibility gateway/BFF on the backend side

Build a compatibility layer that exposes the **old frontend contract** but proxies to the new headless backend.

Example:
- old frontend keeps calling `/api/cart`
- compatibility controller translates that to `/api/v2/carts` and `/api/v2/cart-summary`

### Pros
- frontend changes are smaller
- easier if multiple older clients must be supported

### Cons
- backend gets temporary legacy maintenance burden
- can become technical debt if not sunset clearly

## My recommendation

For your case, choose **Option A first**.

Reason:
- the old frontend is already modular and well-organized
- you likely want to move old clients gradually
- keeping the adapter in frontend lets you evolve screen-by-screen without polluting the new backend contract

Use Option B only if you need to support multiple old clients at once.

---

## Target migration architecture

### Final desired shape
- New headless backend remains the source of truth
- Old frontend becomes a temporary client of the new backend
- Adapter maps old UI expectations to new backend responses
- Old backend is gradually retired from customer-facing use

### Recommended connection path
Old React frontend
-> adapter modules
-> new headless API client
-> new headless backend

Not:
Old React frontend
-> old backend
-> sync
-> new backend

Avoid double-backend dependency.

---

## Exact implementation plan

## Phase 1 — Freeze old UI contract
Document the data shape each old page expects.

Priority modules:
1. auth
2. catalog
3. cart
4. checkout
5. orders
6. wishlist
7. CMS pages

Deliverable:
- `frontend-contract-map.md`

## Phase 2 — Introduce new headless base client
Create a second HTTP client for the new backend.

Example:
- keep existing `api` client for fallback
- add `headlessApi` client with new base URL like `/api/v2`

This client should handle:
- bearer token injection
- locale headers
- standardized error mapping
- auth failure handling

## Phase 3 — Build adapters module by module

### 3.1 Catalog adapter
Map old frontend queries to new product/category endpoints.

Needed transformations:
- product list shape
- product detail shape
- review list shape
- featured/recommendation sections

### 3.2 Auth adapter
Map:
- login
- register/signup
- current user
- logout
- forgot/reset password

Also decide token strategy:
- keep old access token handling in Redux if stable
- or align to the new frontend token pattern if easier

### 3.3 Cart adapter
This is the first place where mapping matters a lot.

Old frontend expects cart item CRUD by item ID.
New headless cart uses a different command style.

Adapter responsibilities:
- fetch cart groups + summary
- map item structures to old cart state
- preserve or replace cart token behavior carefully

### 3.4 Checkout adapter
This is the most sensitive area.

You must map:
- checkout validation
- checkout summary
- payment method list
- payment initiation
- payment confirmation
- guest checkout flow if still needed

This should be done only after catalog and cart are stable.

### 3.5 Account adapter
Map:
- addresses
- orders
- order details
- tracking
- profile updates
- wishlist

## Phase 4 — Route-by-route migration
Enable screens in this order:
1. Home / catalog / product detail
2. Cart
3. Login / register
4. Wishlist
5. Account dashboard / orders / addresses
6. Checkout and payment
7. Admin pages only if they must consume the new backend too

---

## Concrete mapping guidance

## High-confidence low-risk first wave
These are the easiest screens to rewire first:
- home page
- category/catalog page
- product detail page
- blog/content pages

Reason:
- mostly read-only
- fewer auth dependencies
- low payment risk

## Medium complexity wave
- login/register
- wishlist
- account orders
- addresses

## High-risk wave
- cart
- checkout
- payment confirmation
- guest checkout

These should be migrated last because contract mismatch is highest there.

---

## What should be changed in the old frontend codebase

## Files that should change first
- `src/lib/api/client.ts`
- `src/features/catalog/api.ts`
- `src/features/auth/api.ts`
- `src/features/cart/api.ts`
- `src/features/checkout/api.ts`
- `src/features/orders/api.ts`
- `src/features/wishlist/api.ts`
- `src/features/cms/api.ts`

## Files that should ideally remain unchanged initially
- route definitions
- page components
- layout components
- reusable UI components

This keeps migration safe and incremental.

---

## Decision on old backend

### Recommended
Do not keep the old backend in the customer flow once a module is migrated.

Use the old backend only temporarily for:
- admin functions not yet supported in the new backend
- verification reference during migration
- fallback during cutover if absolutely necessary

### Avoid
- calling both backends from the same customer page in production
- syncing cart/order state between old and new backends
- splitting checkout across old and new backend

Checkout must belong to one backend only.

---

## Acceptance criteria for successful wiring

The old frontend can be considered successfully wired to the new headless backend when:
- catalog pages use only the new backend
- product detail pages use only the new backend
- login and current-user flows work against the new backend
- cart is fully created/read/updated against the new backend
- checkout and payment use only the new backend
- order history/account pages use only the new backend
- old backend is no longer required for customer-facing flows

---

## Recommended next artifact
Create:
- `11-old-frontend-endpoint-mapping-matrix.md`

That should contain exact old endpoint -> new endpoint -> adapter transform rules for each module.
