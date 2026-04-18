# Laravel ↔ React Wiring Audit

Project audited: `Dhanvathiri_v2_source_20260415.zip`

## Executive verdict

The project is **not fully wired end to end**.

There are two very different levels of completeness:

1. **React storefront → Laravel V2 API**: partly wired and usable for core customer flows.
2. **React admin → Laravel admin/API**: only partially wired; many screens call endpoints that do not exist.

The biggest risk is that the codebase currently mixes **three worlds**:
- old Laravel Blade/web storefront and Laravel admin
- new React storefront
- new React admin

Those worlds are not yet fully aligned in routing, auth, and API contracts.

---

## Overall status by area

| Area | Status | Audit result |
|---|---:|---|
| Storefront catalog | Partial | Core product/category endpoints exist, but filters/search are only partly backend-driven |
| Customer auth | Partial | Basic customer login/register exists, but refresh/session rehydration is weak |
| Customer cart | Good | Core cart endpoints are present and adapters are mostly aligned |
| Customer checkout (logged in) | Fair to Good | Checkout bridge exists and is one of the better-wired areas |
| Guest checkout | Weak | UI suggests support, but several required backend actions are auth-protected |
| Customer account/orders | Partial | History works better than tracking/detail lookup |
| Wishlist | Weak | Slug/id mismatch likely breaks add/remove |
| Profile/avatar | Weak | Frontend uploads multipart file, backend expects base64 image payload |
| CMS pages/blog/faqs | Fair | Public read side exists; admin CRUD partly exists |
| React admin dashboard & operations | Poor | Frontend calls ~146 admin endpoints; Laravel exposes only ~20 bridge endpoints |
| Deployment/routing ownership | High risk | `/admin/*` ownership conflicts between React admin and Laravel admin |

---

## High-priority findings

## 1) React admin and Laravel admin conflict on `/admin/*`

### What I found
- React router includes admin routes under `/admin`.
- Deployment guide says production should keep:
  - `/admin/* -> Laravel admin`
  - public customer routes -> React storefront
- Laravel still maps legacy admin routes through `routes/admin.php` via `RouteServiceProvider`.

### Why this matters
You currently have **two different admin UIs wanting the same URL space**.

### Impact
One of these will win in production and the other will break:
- React admin SPA
- Laravel admin panel

### Recommendation
Decide **one owner** for admin immediately:
- either keep Laravel admin on `/admin/*` and move React admin to `/app-admin/*` or `/console/*`
- or fully replace Laravel admin and let React admin own `/admin/*`

Do not proceed further before resolving this ownership.

---

## 2) React admin API surface is far larger than Laravel actually exposes

### What I found
Frontend admin file calls about **146** admin endpoints, including:
- dashboard summary
- orders, returns, shipments
- customers, inventory, analytics, exports
- notifications, activity logs, admin users
- categories, reviews, banners, media, settings, modules, alerts, popups, etc.

Laravel admin bridge in `routes/api.php` exposes only these:
- products CRUD + duplicate
- pages CRUD
- posts CRUD
- faqs CRUD
- payment-methods
- payment-methods/razorpay/health

### What is likely broken
Most React admin pages will hit **404 / 405 / missing contract** errors.

### Recommendation
Choose one of these approaches:

**Option A — Complete the React admin backend**
- build the missing `/api/admin/*` endpoints systematically
- use a formal API contract list from the frontend admin hooks

**Option B — Limit React admin scope**
- keep only the pages that are actually bridged today
- hide or remove all non-backed pages

---

## 3) Admin login is not actually wired for admin users

### What I found
React login page uses a single generic email/password login flow.

Frontend sends:
- `POST /api/v2/auth/login`
- `login_by: email`
- `identity_matrix: headless-storefront`

But backend login logic searches by user type:
- `delivery_boy` if explicitly requested
- `seller` if explicitly requested
- otherwise **customer only**

The frontend does **not** send `user_type: admin`.

### Impact
Admin users are very unlikely to log in successfully through the React login page.

### Recommendation
Add a dedicated admin auth flow, for example:
- separate admin login page
- send explicit `user_type: admin` or create dedicated admin login endpoint
- return a normalized admin payload with role/type consistently

---

## 4) Session rehydration can downgrade admin identity after reload

### What I found
`authAdapter.me()` calls `/api/v2/auth/user`.

Backend returns raw `request->user()`.

Frontend normalization expects:
- `type`
- or `role`

If backend only returns `user_type`, then frontend may normalize the user as customer.

### Impact
Even if admin login is forced to work once, page refresh or app bootstrapping may reclassify the user incorrectly.

### Recommendation
Return a dedicated normalized shape from `/auth/user`, matching login response exactly:
- `id`
- `name`
- `email`
- `type`
- `role`
- `avatar`

---

## 5) Token refresh flow is incomplete / nonfunctional

### What I found
There are two clients:

#### `/api` client
- tries `POST /auth/refresh`
- I did not find a matching backend route

#### `/api/v2` client
- has a placeholder refresh function
- but does not actually refresh anything
- on 401 it clears credentials immediately

### Impact
Users can get logged out unexpectedly after token expiry or stale session state.

### Recommendation
Choose one auth strategy and finish it:
- either real refresh tokens with a backend refresh endpoint
- or no refresh at all, but shorter-lived session assumptions and predictable forced re-login

Right now it is half-implemented in both places.

---

## 6) Profile avatar upload contract is mismatched

### What I found
Frontend uploads avatar as multipart form data:
- field: `avatar`

Backend `profile/update-image` expects:
- `image` as base64 string
- `filename`

### Impact
Avatar upload will fail or behave unpredictably.

### Recommendation
Pick one contract:
- easiest: change frontend to send base64 + filename
- cleaner long-term: change backend to accept real multipart uploads

---

## 7) Address create/update payloads do not match Laravel expectations

### What I found
Frontend address create/update sends values like:
- `name`
- `phone`
- `address`
- `city`
- `state`
- `postal_code`
- `country`

Backend address controller expects mostly IDs:
- `country_id`
- `state_id`
- `city_id`
- `area_id`
- `postal_code`
- `phone`
- `address`

### Impact
Address creation/update is likely incomplete or invalid, especially during checkout.

### Recommendation
Unify DTOs.

Best fix:
- frontend should fetch countries/states/cities and store selected IDs
- backend should accept only one validated schema

If you want human-readable fallback, then backend must explicitly translate `country/state/city` names to IDs.

---

## 8) Guest checkout is presented in UI but backend still protects key steps

### What I found
Frontend supports guest validation, guest summary, guest payment intent, and guest confirmation.

But backend routes for critical steps are protected by `auth:sanctum`, including:
- `order/store`
- `checkout/summary`
- `payments/intent`
- `payments/confirm`

There is a `guest-user-account-create` route, but the guest checkout adapter is not truly using a full compatible guest flow.

### Impact
Guest checkout is not end-to-end complete.

### Recommendation
Choose one:
- **real guest checkout**: expose guest-safe order/summary/payment routes
- **guest-to-account conversion**: create the guest account first, authenticate, then continue through normal checkout

Right now the UI suggests more support than the backend provides.

---

## 9) Guest order tracking endpoint is wrong for the API client

### What I found
Frontend guest tracking calls:
- `/api/v2/track-your-order`

I found this route only in Laravel `web.php`, not in `api.php`.

### Impact
The React API call will usually fail, and the page will likely show empty tracking or “not found”.

### Recommendation
Create a proper API endpoint such as:
- `GET /api/v2/orders/track?order_code=...`

Do not depend on a web route from an API adapter.

---

## 10) Order detail lookup mixes order number and numeric ID

### What I found
Order list page navigates using `order.order_number`.

Order detail adapter calls:
- `/purchase-history-details/${id}`

The backend route is numeric-id based.

### Impact
If the URL contains an order code like `ORD-12345`, the backend detail lookup can fail.

### Recommendation
Pick one consistent lookup pattern:
- route by numeric order ID only
- or add backend support to fetch by order code

---

## 11) Wishlist add/remove likely breaks because slug is required but ID is sent

### What I found
Backend wishlist routes use product slug:
- `wishlists-add-product/{product_slug}`
- `wishlists-remove-product/{product_slug}`

Frontend often falls back to numeric IDs instead of slug.
In product detail flow:
- add uses `product.id`
- remove uses wishlist row id

### Impact
Add/remove wishlist is likely unreliable.

### Recommendation
Always keep and pass the product slug in wishlist actions.

---

## 12) Product list/filter wiring is only partly backend-driven

### What I found
Frontend catalog sends filters like category, price range, sort, page, per_page, name.

Backend `products` index appears much simpler and does not fully honor those filters.
There is also a separate search endpoint.

### Impact
Catalog can look functional, but may actually rely on client-side filtering or inconsistent result handling.

### Recommendation
Define one product discovery contract:
- `GET /products` with full supported filters
- or split clearly between `/products`, `/products/search`, `/products/category/{slug}`

Then align the frontend to that exact contract.

---

## 13) Deployment documentation is more optimistic than the actual implementation

### What I found
Deployment guide marks many modules as complete or near-complete.
Actual code shows several mismatches in auth, guest flow, wishlist, tracking, and especially admin coverage.

It also references middleware name inconsistently (`SystemKeyMiddleware` vs actual `EnsureSystemKey`).

### Recommendation
Update documentation after code truth is fixed. Right now the docs overstate readiness.

---

## What appears to be wired reasonably well

These areas look comparatively stronger:

### A) Public storefront bridge layer
The V2 adapter pattern exists and is coherent in principle:
- auth adapter
- catalog adapter
- cart adapter
- checkout adapter
- cms adapter
- account adapter

### B) Logged-in checkout bridge
The Laravel V2 storefront bridge exposes a real checkout layer, including:
- `checkout/shipping-rates`
- `checkout/validate`
- `checkout/summary`
- `payments/intent`
- `payments/confirm`

This is one of the better-connected parts of the system.

### C) CMS admin bridge for some entities
These admin sections have backend bridge support:
- products
- pages
- posts
- faqs
- payment method visibility / Razorpay health

So the React admin is **not empty** — it is just far from fully backed.

---

## Root cause themes

The issues are not random. They follow a few patterns:

1. **Old contract vs new contract mismatch**
   - frontend adapters try to imitate an older API shape
   - backend V2 endpoints return a different shape

2. **UI promises more than backend supports**
   - guest checkout
   - guest tracking
   - broad admin pages

3. **Route ownership is undecided**
   - Laravel admin and React admin overlap

4. **Auth strategy is unfinished**
   - customer vs admin user types
   - missing refresh completion
   - inconsistent `/auth/user` shape

5. **Some adapters are “best effort shims” rather than final contracts**
   - wishlist
   - order tracking
   - profile upload
   - address handling

---

## Priority fix plan

## Phase 1 — Architecture decisions first
1. Decide who owns `/admin/*`.
2. Decide whether React admin is production-ready now, or only a future replacement.
3. Decide whether guest checkout is truly required.

## Phase 2 — Must-fix contract issues
4. Fix admin login flow.
5. Normalize `/auth/user` response.
6. Implement a real refresh strategy or remove fake refresh logic.
7. Fix avatar upload contract.
8. Fix address DTO contract.
9. Fix order detail lookup by order number vs ID.
10. Fix wishlist slug handling.
11. Add real API order tracking endpoint.

## Phase 3 — Admin completion or scope reduction
12. Generate a full frontend admin endpoint list.
13. Mark each endpoint as:
   - exists
   - partially exists
   - missing
14. Either implement the missing ones or hide the unsupported screens.

## Phase 4 — Catalog and UX hardening
15. Unify product list/search/filter API behavior.
16. Remove fallback assumptions inside adapters where possible.
17. Update deployment docs only after code is aligned.

---

## Immediate top 10 blockers

If you want the shortest possible truth, these are the top blockers:

1. `/admin/*` routing ownership conflict
2. React admin backend coverage is mostly missing
3. Admin login is not correctly wired
4. `/auth/user` shape is not normalized
5. refresh token/session strategy is incomplete
6. guest checkout is not end-to-end wired
7. guest order tracking hits wrong route type
8. address payload contract mismatch
9. avatar upload contract mismatch
10. wishlist and order detail lookup identifiers are inconsistent

---

## Final conclusion

Your intuition is correct: **the wiring is incomplete**.

The project is not in a state where you can confidently say “React frontend is fully wired to Laravel backend” across the whole application.

### Best summary
- **Customer storefront:** partially integrated, with several contract mismatches but salvageable.
- **React admin:** only partially implemented on backend and not ready as a full replacement.
- **Deployment shape:** still architecturally undecided in the admin area.

If you treat this as a staged migration, the next right step is:
1. lock architecture ownership,
2. fix auth/contracts,
3. then finish or reduce React admin scope.

