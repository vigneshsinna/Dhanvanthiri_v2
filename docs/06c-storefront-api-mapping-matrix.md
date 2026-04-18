# 06c — Storefront API Mapping Matrix

## Document Purpose

This document maps storefront pages, layouts, shared components, and user actions to the headless commerce API surface currently exposed through the storefront SDK.

It is intended to be the execution bridge between:
- page specifications,
- frontend implementation,
- API dependency planning,
- QA coverage,
- rollout sequencing.

This matrix uses the current SDK modules located in:

- `storefront/src/api/auth.ts`
- `storefront/src/api/brands.ts`
- `storefront/src/api/cart.ts`
- `storefront/src/api/categories.ts`
- `storefront/src/api/checkout.ts`
- `storefront/src/api/content.ts`
- `storefront/src/api/customer.ts`
- `storefront/src/api/products.ts`
- `storefront/src/api/capabilities.ts`

---

## 1. Shared App-Level Calls

| Surface | Purpose | SDK Method | Backend Endpoint | Auth | Required for Initial Render | Notes |
|---|---|---|---|---|---|---|
| App boot | runtime feature flags | `getCapabilities()` | `GET /capabilities` | No | Recommended | Cache once per boot |
| Header | customer session display | `authApi.currentUser()` | `GET /auth/user` | Yes | No | Only when token exists |
| Header | cart badge | `cartApi.count()` | `POST /cart-count` | Contextual | No | Refresh after cart mutations |
| Global settings | settings/language/currency | `contentApi.businessSettings()`, `languages()`, `currencies()` | `GET /business-settings`, `GET /languages`, `GET /currencies` | No | Optional | Can be prefetched |

---

## 2. Route-to-API Matrix

## 2.1 Home Page (`/`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| categories strip | `categoryApi.home()` | `GET /categories/home` | No | No | hide section if unavailable |
| featured products | `productApi.featured()` | `GET /products/featured` | No | No | hide section with alert/log |
| best sellers | `productApi.bestSeller()` | `GET /products/best-seller` | No | No | hide section |
| today’s deals | `productApi.todaysDeal()` | `GET /products/todays-deal` | No | No | hide section |
| banners | `contentApi.banners()` | `GET /banners` | No | No | fallback to static hero |
| sliders | `contentApi.sliders()` | `GET /sliders` | No | No | omit carousel |
| capability flags | `getCapabilities()` | `GET /capabilities` | No | No | assume conservative defaults |

### Notes
- The home page should remain resilient when merchandising APIs fail.
- Initial load should not fail because one homepage module is unavailable.

---

## 2.2 Categories Directory (`/categories`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| category grid | `categoryApi.all()` | `GET /categories` | No | Yes | show error/empty state |

---

## 2.3 Category Listing (`/category/:slug`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Query Params | Fallback Strategy |
|---|---|---|---|---|---|---|
| category info | `categoryApi.info(slug)` | `GET /category/info/{slug}` | No | Recommended | none | use slug text if info fails |
| product grid | `productApi.byCategory(slug, params)` | `GET /products/category/{slug}` | No | Yes | `page`, `sort_by`, search params as supported | show empty grid / error state |
| optional sub-categories | `categoryApi.subCategories(id)` | `GET /sub-categories/{id}` | No | No | none | hide module |

### Frontend dependency note
`CategoryPage` must treat the listing API as the source of truth for products, even if category info is temporarily unavailable.

---

## 2.4 Brands Directory (`/brands`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| brand grid | `brandApi.all()` | `GET /brands` | No | Yes | show error/empty state |

---

## 2.5 Brand Listing (`/brand/:slug`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Query Params | Fallback Strategy |
|---|---|---|---|---|---|---|
| product grid | `productApi.byBrand(slug, params)` | `GET /products/brand/{slug}` | No | Yes | `page`, `sort_by` | show empty/error state |

---

## 2.6 Search (`/search`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Query Params | Fallback Strategy |
|---|---|---|---|---|---|---|
| search results | `productApi.search(params)` | `GET /products/search` | No | Yes | `name`, `page`, `sort_by`, supported params | show no-results state |
| search form in header | route state only | n/a | No | n/a | `q` or mapped query param | keep value in URL |

### Notes
- Search results pages should be treated as dynamic and generally noindex.
- The frontend should debounce header search suggestions when introduced.

---

## 2.7 Product Detail (`/product/:slug`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| product detail | `productApi.detail(slug, userId)` | `GET /products/{slug}/{userId}` | No | Yes | show not-found state |
| reviews | `productApi.reviews(productId)` | `GET /reviews/product/{productId}` | No | No | hide review list or show empty |
| variant pricing | `productApi.variantPrice(data)` | `POST /products/variant/price` | No | On interaction | keep existing price until recalculated |
| wishlist status | `wishlistApi.check(slug)` | `GET /wishlists-check-product/{slug}` | Yes | No | hide state for guests |
| add wishlist | `wishlistApi.add(slug)` | `GET /wishlists-add-product/{slug}` | Yes | On interaction | route to login if required |
| add to cart | `cartApi.add(data)` | `POST /carts/add` | Contextual | On interaction | show inline error |

### Notes
- PDP is the most critical route for contract quality.
- Variant selection, stock, price, and cart mutation must all be verified together.

---

## 2.8 Cart (`/cart`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| grouped cart items | `cartApi.list()` | `POST /carts` | Contextual | Yes | empty/error cart state |
| summary panel | `cartApi.summary()` | `POST /cart-summary` | Contextual | Yes | retry / inline summary error |
| count badge sync | `cartApi.count()` | `POST /cart-count` | Contextual | No | allow stale badge temporarily |
| quantity change | `cartApi.changeQuantity(data)` | `POST /carts/change-quantity` | Contextual | On interaction | revert optimistic UI or refetch |
| remove item | `cartApi.remove(id)` | `DELETE /carts/{id}` | Contextual | On interaction | keep row until mutation result returns |
| process seller group | `cartApi.process(data)` | `POST /carts/process` | Contextual | During checkout prep | block progression if seller processing fails |

---

## 2.9 Login (`/login`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Fallback Strategy |
|---|---|---|---|---|---|
| credential login | `authApi.login(data)` | `POST /auth/login` | No | Yes | show inline field/form error |
| current session hydrate | `authApi.currentUser()` | `GET /auth/user` | Yes | No | clear invalid token and continue |
| forgot password (future) | `authApi.forgotPassword(data)` | `POST /auth/password/forget_request` | No | On interaction | show status state |
| reset password (future) | `authApi.resetPassword(data)` | `POST /auth/password/confirm_reset` | No | On interaction | show success/error message |

---

## 3. Planned Route Mapping

## 3.1 Register (`/register`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| account registration | `authApi.signup(data)` | `POST /auth/signup` | No | Yes |

---

## 3.2 Wishlist (`/wishlist`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| wishlist list | `wishlistApi.list()` | `GET /wishlists` | Yes | Yes |
| remove item | `wishlistApi.remove(slug)` | `GET /wishlists-remove-product/{slug}` | Yes | On interaction |
| check state | `wishlistApi.check(slug)` | `GET /wishlists-check-product/{slug}` | Yes | No |

---

## 3.3 Checkout (`/checkout`)

| UI Module | SDK Method | Endpoint | Auth | Blocking | Notes |
|---|---|---|---|---|---|
| address list | `addressApi.list()` | `GET /user/shipping/address` | Yes | Usually | guest mode requires alternative flow if supported |
| address create | `addressApi.create(data)` | `POST /user/shipping/create` | Yes | On interaction | modal or inline form |
| address update | `addressApi.update(data)` | `POST /user/shipping/update` | Yes | On interaction | edit existing address |
| default address | `addressApi.makeDefault(data)` | `POST /user/shipping/make_default` | Yes | No | updates shipping context |
| address delete | `addressApi.delete(id)` | `GET /user/shipping/delete/{id}` | Yes | No | confirm first |
| delivery info | `checkoutApi.deliveryInfo(data)` | `POST /delivery-info` | Contextual | Yes | typically per seller group |
| shipping cost | `checkoutApi.shippingCost(data)` | `POST /shipping_cost` | Contextual | Yes | must refresh totals |
| coupon apply | `checkoutApi.applyCoupon(data)` | `POST /coupon-apply` | Contextual | No | refresh summary on success |
| coupon remove | `checkoutApi.removeCoupon()` | `POST /coupon-remove` | Contextual | No | refresh summary |
| coupon list | `checkoutApi.couponList()` | `GET /coupon-list` | Contextual | No | optional discovery helper |
| payment types | `checkoutApi.paymentTypes()` | `GET /payment-types` | Contextual | Yes | gates payment UI |
| create order | `checkoutApi.createOrder(data)` | `POST /order/store` | Contextual | Yes | most critical mutation |
| pay with wallet | `checkoutApi.payWithWallet(data)` | `POST /payments/pay/wallet` | Contextual | Conditional | depends on available method |
| pay with COD | `checkoutApi.payWithCOD(data)` | `POST /payments/pay/cod` | Contextual | Conditional | depends on available method |

---

## 3.4 Orders (`/account/orders`, `/account/orders/:id`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| order history | `orderApi.purchaseHistory()` | `GET /purchase-history` | Yes | Yes |
| order detail | `orderApi.details(id)` | `GET /purchase-history-details/{id}` | Yes | Yes |
| order items | `orderApi.items(id)` | `GET /purchase-history-items/{id}` | Yes | Recommended |
| reorder | `orderApi.reorder(id)` | `GET /re-order/{id}` | Yes | On interaction |
| invoice download | `orderApi.downloadInvoice(id)` | `GET /invoice/download/{id}` | Yes | On interaction |
| cancel order | `checkoutApi.cancelOrder(id)` | `GET /order/cancel/{id}` | Yes | Conditional |

---

## 3.5 Blog (`/blog`, `/blog/:slug`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| blog list | `contentApi.blogList()` | `GET /blog-list` | No | Yes |
| blog detail | `contentApi.blogDetails(slug)` | `GET /blog-details/{slug}` | No | Yes |

---

## 3.6 Flash Deals (`/flash-deals`, `/flash-deals/:slug`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| flash deal list | `contentApi.flashDeals()` | `GET /flash-deals` | No | Yes |
| flash deal info | `contentApi.flashDealInfo(slug)` | `GET /flash-deals/info/{slug}` | No | Yes |
| flash deal products | `contentApi.flashDealProducts(id)` | `GET /flash-deal-products/{id}` | No | Yes |

---

## 3.7 Policies (`/policies/:type`)

| UI Module | SDK Method | Endpoint | Auth | Blocking |
|---|---|---|---|---|
| policy content | `contentApi.policies(type)` | `GET /policies/{type}` | No | Yes |

---

## 4. Component-to-API Dependencies

## Header

| Component Concern | SDK Method | Notes |
|---|---|---|
| categories quick nav (optional) | `categoryApi.top()` or `home()` | use cached catalog data when possible |
| cart badge | `cartApi.count()` | refresh after cart mutations |
| customer name/avatar | `authApi.currentUser()` | only when token exists |
| search submission | `productApi.search()` via search route | route-driven, not inline result list yet |

## ProductCard

| Concern | Data Source | Notes |
|---|---|---|
| image, price, discount, rating | product list payload | card should avoid additional API calls |
| wishlist toggle (future) | wishlist APIs | defer to page-level state if needed |

## Footer

| Concern | Data Source | Notes |
|---|---|---|
| policies | content settings / static config / policies route | may be static links at first |
| language/currency | content APIs | only if customer-facing switchers are enabled |

---

## 5. Auth Posture Matrix

| Route Group | Guest Access | Auth Required | Token Failure Behavior |
|---|---|---|---|
| Home / Categories / Brands / Search / PDP | Yes | No | continue as guest |
| Cart | Usually yes | Depends on backend policy | clear invalid token, continue as guest if allowed |
| Checkout | Depends on capabilities | Often yes or hybrid | redirect to login if required |
| Wishlist | No | Yes | send to login |
| Account | No | Yes | send to login |
| Orders / Addresses / Profile | No | Yes | send to login |

---

## 6. Contract Mode Guidance for Step 3

## Preferred mode
Use **normalized contract first** whenever the endpoint has already been wrapped or standardized in Step 2.

## Allowed temporary mode
Use a **mixed adapter layer** only when:
- the page is blocked by an unnormalized endpoint;
- Step 3 would otherwise stall;
- the response is normalized in the SDK layer before reaching page components.

## Forbidden mode
Page components must not directly encode legacy backend assumptions throughout the UI tree.

That means:
- pages should consume typed SDK methods;
- response-shape translation belongs in `src/api/` or dedicated mappers;
- UI components should remain stable even when backend normalization is still incremental.

---

## 7. QA Focus Areas

The following page/API pairs are highest priority:
1. PDP ↔ product detail / variant price / add to cart
2. Cart ↔ list / summary / quantity / remove
3. Checkout ↔ address / shipping / create order / payment types
4. Orders ↔ history / detail / invoice / reorder
5. Login / session ↔ login / auth user / token invalidation

---

## 8. Definition of Done

This matrix is considered execution-ready when:
- every route in the inventory has named APIs;
- auth posture is clear;
- blocking vs non-blocking dependencies are documented;
- fallback behavior is agreed;
- mixed-mode adapter usage is explicitly flagged where required;
- QA can derive test cases from the mapping.
