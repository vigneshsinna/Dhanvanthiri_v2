# 11 — Old Frontend to New Headless Endpoint Mapping Matrix

## Purpose

This document maps the **old Dhanvanthiri storefront frontend** to the **new headless commerce backend** so the old UI can be reused without a full rewrite.

The goal is to keep the old frontend's:
- page structure
- components
- forms
- route layout
- Redux / React Query patterns

and replace only the **API integration layer** with adapters that call the new headless backend.

---

## Executive recommendation

Use an **adapter-first migration**.

**Do not** point the old frontend pages directly at the new backend one endpoint at a time without normalization. The contracts differ in:
- base URL and versioning
- auth payloads
- response shapes
- cart identity model
- checkout / payment lifecycle
- wishlist and address routes
- CMS capabilities

Recommended shape:

```text
Old React Frontend
  -> integration adapter layer
  -> New Headless API (/api/v2)
  -> New Laravel commerce backend
```

This keeps the UI stable while the data contract is translated in one place.

---

## Scope

### In scope
- customer storefront frontend integration
- auth
- catalog
- CMS/content
- wishlist
- addresses
- cart
- checkout
- orders

### Out of scope for this document
- old admin frontend -> new admin/panel migration
- old backend admin endpoints
- seller panel migration
- OMS/admin analytics migration

Those should remain on the old system or be handled separately after **Step 4** is truly complete.

---

## Current compatibility summary

| Area | Status | Notes |
|---|---|---|
| Catalog browsing | High compatibility | Mostly adapter + response normalization |
| Product detail | High compatibility | Variant pricing and detail route differ |
| Auth | Medium compatibility | Login/register/profile payloads differ |
| Wishlist | Medium compatibility | Route style differs, but behavior is available |
| Addresses | Medium compatibility | Route names and field shapes differ |
| Cart | Medium compatibility | New backend uses grouped cart process flow |
| Checkout | Low/Medium compatibility | Must remap from payment-intent model to order/store + payment flow |
| Orders | Medium compatibility | Purchase history is available, but tracking/cancel flow differs |
| CMS/content | Medium/Low compatibility | Blog/banners/policies exist; menus/pages/faqs/alerts/popups are gaps |
| Admin integration | Do not migrate now | New Step 4 is not fully closed |

---

## Global integration differences

## 1. Base URL

### Old frontend
```ts
baseURL: '/api'
```

### New headless frontend
```ts
baseURL: '/api/v2'
```

### Recommendation
Create a new adapter client in the old frontend:

```ts
// src/lib/api/headlessClient.ts
baseURL: import.meta.env.VITE_HEADLESS_API_BASE_URL || '/api/v2'
```

Do not overwrite the old client until each module is migrated.

---

## 2. Auth model

### Old frontend
- bearer token in Redux
- refresh flow via `/auth/refresh`
- attaches `Authorization: Bearer <token>`
- sends `Accept-Language`
- sends `X-Cart-Token` for cart/guest/checkout/payments

### New headless backend
- bearer token in localStorage in current storefront implementation
- no refresh endpoint in the verified storefront API layer
- sends `App-Language`
- guest cart is handled by temp user / existing cart model, not old `X-Cart-Token` contract

### Recommendation
Create a compatibility auth adapter that:
- stores the new backend token into the old Redux auth slice
- removes dependency on `/auth/refresh`
- maps locale header from `Accept-Language` to `App-Language`
- replaces `X-Cart-Token` assumptions with new cart bootstrap / owner flow

---

## 3. Response envelope differences

The old frontend is used to mixed payloads such as:
- `res.data`
- `res.data.data`
- `collection.data`

The new headless backend uses a mix of:
- `{ result, message, data }`
- direct user object for `/auth/user`
- paginated collections for catalog endpoints

### Recommendation
Every migrated module should normalize responses into the old frontend's domain types before reaching pages/components.

---

## 4. Recommended migration mode

### Use this sequence
1. catalog + content
2. auth + profile basics
3. wishlist + addresses
4. cart
5. checkout + payment
6. orders + post-purchase

### Avoid this sequence
- migrating checkout before cart
- mixing old backend checkout with new backend cart
- moving admin APIs along with storefront APIs

---

## Adapter layer structure

Create these files in the old frontend:

```text
frontend/src/integrations/headless/
  client.ts
  mappers/
    auth.mapper.ts
    catalog.mapper.ts
    cart.mapper.ts
    checkout.mapper.ts
    content.mapper.ts
    orders.mapper.ts
  adapters/
    auth.adapter.ts
    catalog.adapter.ts
    cart.adapter.ts
    checkout.adapter.ts
    orders.adapter.ts
    wishlist.adapter.ts
    content.adapter.ts
```

Rule:
- **pages/components never call raw `/api/v2` endpoints directly**
- they call adapter functions that return old frontend-friendly models

---

# Endpoint mapping matrix

## A. Authentication and profile

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /auth/me` | current user | `GET /auth/user` | Adapt | Normalize direct user object into old `me` shape | P1 |
| `POST /auth/login` | customer login | `POST /auth/login` | Adapt | Map payload `{ email, password }` -> `{ email, password, login_by: 'email' }` | P1 |
| `POST /auth/register` | register | `POST /auth/signup` | Adapt | Map `{ email }` -> `{ email_or_phone, register_by: 'email' }` | P1 |
| `POST /auth/logout` | logout | `GET /auth/logout` | Adapt | Keep old mutation API, call GET under adapter | P1 |
| `POST /auth/forgot-password` | forgot password | `POST /auth/password/forget_request` | Adapt | Map `{ email }` -> `{ email_or_phone: email, send_code_by: 'email' }` | P1 |
| `POST /auth/reset-password` | reset password | `POST /auth/password/confirm_reset` | Adapt | Map token to verification code if backend uses code flow; otherwise needs UX change | P2 |
| `PUT /profile` | update profile | `POST /profile/update` | Adapt | Convert PUT style to POST and normalize response | P1 |
| `PUT /profile/password` | change password | `POST /profile/update` | Partial / Gap | New backend supports password on profile update, but not `current_password` validation in same contract | P2 |
| `POST /profile/avatar` | avatar upload | `POST /profile/update-image` | Adapt | Use multipart upload and normalize returned user/avatar fields | P2 |
| `POST /auth/refresh` | token refresh | **No verified equivalent** | Gap | Remove refresh dependency or implement BFF-issued refresh/session bridge | P0 decision |

### Auth implementation note
The old frontend should stop assuming refresh-token flow unless you explicitly build it. The simplest path is:
- login -> save bearer token
- 401 -> clear auth state -> redirect to login

---

## B. Catalog and discovery

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /products` | PLP / search listing | `GET /products` | Adapt | Map filters and pagination fields | P1 |
| `GET /products/${slug}` | PDP | `GET /products/${slug}/{userId}` | Adapt | Pass `0` for guest or current user ID for logged-in user | P1 |
| `GET /categories` | category list | `GET /categories` | Direct-ish | Normalize collection format | P1 |
| `GET /products/featured` | home featured | `GET /products/featured` | Direct-ish | Normalize payload | P1 |
| `GET /products/recommendations` | recommendations | **No verified direct equivalent** | Gap | Derive using `best-seller`, `todays-deal`, category peers, or custom backend endpoint | P2 |
| `GET /products/${productId}/reviews` | review list | `GET /reviews/product/{id}` | Adapt | Rename route and normalize review collection | P1 |
| `POST /products/${productId}/reviews` | submit review | `POST /reviews/submit` | Adapt | Convert product-specific route into payload-based submit contract | P2 |
| `GET /products/${productId}/queries` | product questions | **No verified equivalent** | Gap | Keep old backend temporarily or implement new endpoint | P3 |
| `POST /products/${productId}/queries` | ask question | **No verified equivalent** | Gap | Same as above | P3 |
| `GET /products/${productId}/cross-sells` | related/cross-sell | **No verified equivalent in storefront API layer** | Gap | Derive client-side or add backend endpoint | P2 |
| `GET /products/search` | explicit search | `GET /products/search` | Adapt | Prefer this over filtering generic `/products` when search term exists | P1 |
| category-based listing | PLP by category | `GET /products/category/{slug}` | New better route | Use slug-driven route adapter | P1 |
| brand-based listing | PLP by brand | `GET /products/brand/{slug}` | New better route | Use slug-driven route adapter | P1 |
| seller-based listing | seller storefront | `GET /products/seller/{id}` or shop product endpoints | New route | For seller pages only | P3 |
| variant price resolution | product options | `POST /products/variant/price` | New route | Add variant pricing adapter before add-to-cart | P1 |

### Catalog adapter notes
1. Convert old category-id filter logic into slug-based route handling where possible.
2. Keep a `normalizeProduct()` mapper to flatten differences in image, price, stock, and review count fields.
3. Introduce `getRecommendedProducts()` as a composite adapter if the new backend does not expose direct recommendations.

---

## C. CMS and content

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /posts` | blog list | `GET /blog-list` | Adapt | Normalize to old post card model | P2 |
| `GET /posts/${slug}` | blog detail | `GET /blog-details/{slug}` | Adapt | Normalize body/seo fields | P2 |
| `GET /banners` | homepage banners | `GET /banners` | Direct-ish | Keep optional position filtering in adapter if needed | P1 |
| `GET /settings/website` | site settings | `GET /business-settings` | Adapt | Map selected business settings into old `website settings` shape | P2 |
| `GET /pages/${slug}` | static page | `GET /policies/{type}` for policy pages only | Partial / Gap | Only policy-type pages map directly | P2 |
| `GET /faqs` | FAQ page | **No verified equivalent** | Gap | Build static content in frontend or add backend FAQ endpoint | P3 |
| `GET /menus/${location}` | header/footer menus | **No verified equivalent** | Gap | Build menu config in frontend or expose new menu endpoint | P0 decision |
| `GET /marketing/alerts` | top bar alerts | **No verified equivalent** | Gap | Use feature flags/settings or build new CMS endpoint | P3 |
| `GET /marketing/popups` | popups | **No verified equivalent** | Gap | Same as above | P3 |
| locale list | language selector | `GET /languages` | New route | Add adapter | P2 |
| currency list | currency selector | `GET /currencies` | New route | Add adapter | P2 |
| homepage sliders | hero carousel | `GET /sliders` | New route | Add adapter | P1 |
| flash deals | campaign content | `GET /flash-deals`, `/flash-deals/info/{slug}`, `/flash-deal-products/{id}` | New route | Add as enhanced storefront capability | P2 |

### CMS decision note
If the old site depends heavily on dynamic menus, custom pages, FAQ, alerts, or popups, you must decide one of these **before full cutover**:
- rebuild them as frontend-managed content
- add missing endpoints to the new backend
- keep those pages on the old backend temporarily

---

## D. Wishlist and customer addresses

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /wishlist` | wishlist list | `GET /wishlists` | Adapt | Normalize item shape | P1 |
| `POST /wishlist` | add to wishlist | `GET /wishlists-add-product/{slug}` | Adapt | Convert old payload-driven call into slug-based action | P1 |
| `DELETE /wishlist/${id}` | remove wishlist item | `GET /wishlists-remove-product/{slug}` | Adapt | Requires slug lookup or store slug on client item model | P1 |
| wishlist membership check | button state | `GET /wishlists-check-product/{slug}` | New route | Add adapter for PDP/list cards | P1 |
| `GET /addresses` | address list | `GET /user/shipping/address` | Adapt | Normalize address fields | P1 |
| `POST /addresses` | create address | `POST /user/shipping/create` | Adapt | Map field names and default flag | P1 |
| update address | edit address | `POST /user/shipping/update` | Adapt | Include `id` in payload | P1 |
| make default address | primary address | `POST /user/shipping/make_default` | New route | Add adapter | P1 |
| delete address | remove address | `GET /user/shipping/delete/{id}` | Adapt | Wrap GET delete into mutation | P1 |

### Address field note
Your old frontend uses fields like:
- `recipient_name`
- `line1`
- `line2`
- `postal_code`
- `country_code`

Verify the new backend's exact shipping-address DTO and normalize both directions in one mapper.

---

## E. Cart

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /cart` | current cart | `POST /carts` + `POST /cart-summary` | Adapt | Build one adapter that combines groups + summary into old cart model | P1 |
| `POST /cart/items` | add item | `POST /carts/add` | Adapt | Map `{ product_id, variant_id, quantity }` -> `{ id, variant, quantity, color }` | P1 |
| `PUT /cart/items/${itemId}` | update quantity | `POST /carts/change-quantity` | Adapt | Convert route-based item update into body-based action | P1 |
| `DELETE /cart/items/${itemId}` | remove item | `DELETE /carts/{id}` | Adapt | Direct route rename | P1 |
| `DELETE /cart` | clear cart | **No verified single clear endpoint** | Gap | Remove all items one by one or add backend clear-cart endpoint | P2 |
| `POST /cart/coupon` | apply coupon | `POST /coupon-apply` | Adapt | Map `{ code }` -> `{ coupon_code }` | P1 |
| `DELETE /cart/coupon` | remove coupon | `POST /coupon-remove` | Adapt | Wrap POST remove in old mutation signature | P1 |
| `GET /cart/shipping-rates` | shipping rates | `POST /delivery-info` + `POST /shipping_cost` | Adapt | Replace rate-query model with owner/address-based quote process | P2 |
| cart count | header badge | `POST /cart-count` | New route | Add adapter for compact header updates | P1 |
| cart process | multi-owner checkout prep | `POST /carts/process` | New route | Use only if marketplace owner grouping is needed | P2 |

### Cart migration note
The old frontend assumes a single cart document with item CRUD. The new backend exposes **cart groups + summary + owner processing**. This is the biggest reason to keep a dedicated `cart.mapper.ts`.

---

## F. Checkout and payment

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /payment-methods` | available gateways | `GET /payment-types` | Adapt | Normalize names/codes for old checkout UI | P1 |
| `POST /checkout/summary` | review totals | `POST /delivery-info` + `POST /shipping_cost` + `POST /cart-summary` | Adapt | Compose summary in adapter | P1 |
| `POST /checkout/validate` | validation pre-submit | **No verified exact equivalent** | Gap / composite | Use client validation + backend order/store failure handling or add validate endpoint | P2 |
| `POST /payments/intent` | create payment intent | `POST /order/store` then payment method flow | Major adapt | Rewrite old intent flow to new order-first flow | P0 |
| `POST /payments/confirm` | confirm payment result | payment gateway callback / COD / wallet specific routes | Major adapt | Replace confirm endpoint logic with gateway-specific success handling | P0 |
| `GET /payments/${orderId}` | payment status | **No verified generic status endpoint** | Gap | Use order details / payment callback result or add new endpoint | P2 |
| `POST /guest/checkout/validate` | guest validation | No verified exact equivalent | Gap | Treat guest as temp-user flow or build explicit guest validation | P2 |
| `POST /guest/checkout/summary` | guest summary | same as authenticated summary with guest/temp user cart | Adapt | Requires temp user strategy | P2 |
| `POST /guest/payments/intent` | guest payment intent | `POST /order/store` guest-compatible flow if available, else backend enhancement | Major adapt | Validate first in backend | P0 |
| `POST /guest/payments/confirm` | guest payment confirm | gateway-specific success handling | Major adapt | Same as above | P0 |
| wallet payment | pay with wallet | `POST /payments/pay/wallet` | New route | Add if storefront uses wallet | P3 |
| cash on delivery | COD finalize | `POST /payments/pay/cod` | New route | Add if storefront supports COD | P2 |

### Checkout architecture decision
This is the most important integration choice.

### Recommended
Refactor the old frontend checkout to the new model:
1. choose address
2. choose shipping / owner delivery info
3. create order via `/order/store`
4. launch payment method flow
5. finalize via order success screen and purchase history

### Not recommended
Keep the old payment-intent abstraction unchanged and try to force the new backend into it. That will create a brittle bridge.

---

## G. Orders and post-purchase

| Old frontend endpoint | Old use | New headless endpoint | Mapping type | Adapter action | Priority |
|---|---|---|---|---|---|
| `GET /orders` | order list | `GET /purchase-history` | Adapt | Normalize collection to old order-card model | P1 |
| `GET /orders/${orderNumber}` | order detail | `GET /purchase-history-details/{id}` + `GET /purchase-history-items/{id}` | Adapt | Switch from order-number route to ID-based detail route | P1 |
| `GET /orders/${orderId}/tracking` | tracking timeline | **No verified equivalent** | Gap | Keep old service temporarily or add backend tracking endpoint | P2 |
| `POST /orders/${orderId}/cancel` | cancel order | `GET /order/cancel/{id}` | Adapt | Wrap GET cancel in mutation adapter | P2 |
| `POST /orders/${orderId}/returns` | returns | **No verified equivalent** | Gap | Keep old backend or add return-request endpoint in new backend | P3 |
| `POST /orders/track` | guest order tracking | **No verified equivalent** | Gap | Add public tracking endpoint in new backend | P2 |
| reorder | buy again | `GET /re-order/{id}` | New route | Add adapter | P2 |
| invoice download | invoice PDF | `GET /invoice/download/{id}` | New route | Add blob download adapter | P2 |

---

## H. Admin APIs

**Do not wire the old admin frontend to the new headless backend yet.**

Reason:
- the new storefront/backend work is ready for customer-facing integration
- Step 4 panel modernization is still not fully closed
- admin pages and some seller behaviors are still partially implemented or mocked in the new platform audit

Recommendation:
- keep old admin frontend + old backend together temporarily
- migrate admin separately after Step 4 closure

---

# Gaps that need a decision before full cutover

## P0 — must decide first
1. **No `/auth/refresh` equivalent**
2. **No direct menu endpoint** for old header/footer menu model
3. **Checkout contract is different** — old payment-intent flow vs new order-first flow
4. **Guest checkout strategy** must be confirmed

## P1 — strongly recommended before broad rollout
1. response normalization library
2. catalog product mapper
3. cart aggregate mapper
4. address mapper
5. auth token/session adapter

## P2 — can be staged after initial launch
1. recommendations strategy
2. invoice adapter
3. order cancel adapter
4. policy/static page mapping
5. language/currency support

## P3 — later or optional
1. FAQ API
2. alerts/popups CMS
3. product queries/questions
4. returns API
5. seller-enhanced storefront pages

---

# Recommended execution plan

## Wave 1 — Safe read-only integration
- products
- categories
- brands
- search
- banners/sliders
- blog list/detail

### Output
Old frontend home, PLP, PDP, and blog pages run on the new backend.

---

## Wave 2 — Account basics
- login
- register
- me/profile
- forgot password
- logout
- addresses
- wishlist

### Output
Authenticated customer experience works on new backend.

---

## Wave 3 — Cart
- cart list
- add/remove/change quantity
- coupon apply/remove
- cart count

### Output
Header/cart/PDP interactions are fully on new backend.

---

## Wave 4 — Checkout rewrite
- payment types
- delivery info
- shipping cost
- order creation
- gateway integration
- order success

### Output
Old frontend checkout is reworked to the new headless contract.

---

## Wave 5 — Orders and post-purchase
- purchase history
- order detail
- invoice download
- reorder
- cancel if supported

---

# Recommended adapter ownership

| Adapter | Owner |
|---|---|
| auth.adapter.ts | frontend integration engineer |
| catalog.adapter.ts | frontend engineer |
| content.adapter.ts | frontend engineer |
| wishlist.adapter.ts | frontend engineer |
| cart.adapter.ts | senior frontend engineer |
| checkout.adapter.ts | frontend + backend integration owner |
| orders.adapter.ts | frontend engineer |

---

# Acceptance criteria

The old storefront can be considered successfully wired to the new headless backend when:

1. Home, category, product detail, search, and blog pages load from `/api/v2`
2. Login, register, logout, wishlist, and addresses work without calling the old backend
3. Cart uses only the new backend
4. Checkout no longer depends on old `/payments/intent` or `/payments/confirm`
5. Orders and invoice download come from the new backend
6. The old backend is no longer needed for customer-facing journeys
7. Admin flows remain isolated until separate migration

---

# Final recommendation

For your project, the best path is:

- **Reuse the old frontend UI**
- **Replace only the data layer with adapters**
- **Treat checkout as a controlled rewrite**
- **Do not migrate admin at the same time**

This gives you the fastest path to using the new headless commerce backend while preserving the visual/frontend investment already made in the old website.
