# 06c — Step 3 Integration Decision Record (Gate 3)

---

## Step 3 Integration Decision

| Item | Value |
|------|-------|
| Decision date | 2025-07-18 |
| Decision owner | Engineering |
| Selected option | **Option B — Mixed mode with temporary adapter layer** |
| Review date | End of Step 3 Phase 1 |

---

## Reason for Decision

Of the ~25 Step 3-required endpoint groups, only **2 are fully normalized** (capabilities, error responses via Handler). The catalog resource collections (products, categories, brands) are **partially normalized** — they use `{success, status, data}` wrappers but don't follow the exact `{success, message, data}` envelope from `ApiResponseTrait`. All remaining storefront-critical endpoints (auth, cart, checkout, payment, shipping, orders) use the **legacy `{result, message}` pattern**.

Requiring full backend normalization before Step 3 starts would block storefront delivery on 15+ endpoint migrations. Option B (mixed mode with strict adapter rules) allows frontend development to proceed while backend normalization catches up incrementally.

---

## Endpoint Classification for Step 3

### Fully Normalized (use directly)

| Endpoint | Controller | Envelope |
|----------|-----------|----------|
| `GET /api/v2/capabilities` | CapabilityController | `{success, message, data}` ✅ |
| All error responses (401, 404, 422, 429, 500) | Exception Handler | `{success, message, error: {code}}` ✅ |

### Partially Normalized (resource collections — minor adapter)

| Endpoint | Controller | Envelope | Gap |
|----------|-----------|----------|-----|
| `GET /api/v2/products/featured` | ProductController | `{success, status, data, links, meta}` | Uses `status` instead of `message`; pagination under `meta`+`links` not `data.meta` |
| `GET /api/v2/products/search` | ProductController | Same | Same |
| `GET /api/v2/products/{slug}` | ProductController | Same | Same |
| `GET /api/v2/products/category/{slug}` | ProductController | Same | Same |
| `GET /api/v2/products/brand/{slug}` | ProductController | Same | Same |
| `GET /api/v2/categories` | CategoryController | `{success, status, data}` | Same pattern |
| `GET /api/v2/categories/featured` | CategoryController | Same | Same |
| `GET /api/v2/category/info/{slug}` | CategoryController | Same | Same |
| `GET /api/v2/brands` | BrandController | `{success, status, data}` | Same pattern |
| `GET /api/v2/brands/top` | BrandController | Same | Same |

### Legacy (requires frontend adapter)

| Endpoint | Controller | Current Envelope | Step 3 Need |
|----------|-----------|------------------|-------------|
| `POST /api/v2/auth/login` | AuthController | `{result, message, access_token, token_type, user}` | Critical — login flow |
| `POST /api/v2/auth/signup` | AuthController | Same as login | Critical — registration |
| `GET /api/v2/auth/logout` | AuthController | `{result, message}` | Critical — logout |
| `GET /api/v2/auth/user` | AuthController | Raw user model | Critical — session check |
| `POST /api/v2/carts/add` | CartController | `{result, message, temp_user_id}` | Critical — cart add |
| `POST /api/v2/cart-summary` | CartController | `{sub_total, tax, shipping_cost, discount, grand_total, ...}` | Critical — cart display |
| `POST /api/v2/carts` | CartController | `{grand_total, data: [{name, owner_id, cart_items}]}` | Critical — cart list |
| `POST /api/v2/carts/change-quantity` | CartController | `{result, message}` | High — cart edit |
| `DELETE /api/v2/carts/{id}` | CartController | `{result, message}` | High — cart edit |
| `POST /api/v2/coupon-apply` | CheckoutController | `{result, message}` | Medium — checkout |
| `POST /api/v2/coupon-remove` | CheckoutController | `{result, message}` | Medium — checkout |
| `POST /api/v2/delivery-info` | ShippingController | Array of shop objects | High — checkout |
| `POST /api/v2/shipping_cost` | ShippingController | `{result, shipping_type, value, value_string}` | High — checkout |
| `POST /api/v2/order/store` | OrderController | `{combined_order_id, result, message}` | Critical — order placement |
| `POST /api/v2/payments/pay/cod` | PaymentController | Delegates to order/store | Critical — payment |
| `POST /api/v2/payments/pay/manual` | PaymentController | Delegates to order/store | Critical — payment |
| `GET /api/v2/payment-types` | PaymentTypesController | Raw array (no envelope) | High — payment selection |
| `GET /api/v2/online-pay/init` | OnlinePaymentController | Mixed | High — online payment |
| `GET /api/v2/sliders` | SliderController | Unknown legacy | Medium — home page |
| `GET /api/v2/banners-one` | SliderController | Unknown legacy | Medium — home page |

---

## Adapter Architecture

All legacy endpoint consumption must go through `storefront/src/api/adapters/`. The existing SDK (`storefront/src/api/`) already has typed wrapper functions — the adapter layer will normalize legacy responses into the canonical frontend types defined in `storefront/src/api/types.ts`.

### Adapter directory structure

```
storefront/src/api/adapters/
├── auth.adapter.ts        # login/signup/logout/user → AuthSession
├── cart.adapter.ts        # add/summary/list/quantity/remove → CartSummaryNormalized
├── checkout.adapter.ts    # coupon/shipping/delivery → CheckoutSession
├── payment.adapter.ts     # payment-types/cod/manual/online → PaymentInitiation
├── catalog.adapter.ts     # product/category/brand response normalization (minor)
└── index.ts               # barrel export
```

### Adapter rules

1. **No raw legacy responses inside pages/components** — all mapping happens in `src/api/adapters/`
2. **Pages, hooks, store slices, and UI components consume only canonical types** from `src/api/types.ts`
3. **Each adapter file documents**: source endpoint, target type, migration owner, planned removal

### Adapter ownership

| Adapter | Source Domain | Target Type | Removal Target |
|---------|--------------|-------------|----------------|
| `auth.adapter.ts` | Auth endpoints | `AuthSession`, `UserProfile` | Step 4 (backend auth normalization) |
| `cart.adapter.ts` | Cart endpoints | `CartSummaryNormalized`, `CartItemNormalized` | Step 4 |
| `checkout.adapter.ts` | Checkout/shipping endpoints | `CheckoutSession`, `ShippingOption` | Step 4 |
| `payment.adapter.ts` | Payment endpoints | `PaymentMethod`, `PaymentInitiation` | Step 4 |
| `catalog.adapter.ts` | Product/category/brand responses | `ProductSummary`, `CategoryInfo` | When resource collections adopt `ApiResponseTrait` |

---

## Mandatory Constraints (per Gate 3 spec)

### 1. No raw legacy responses inside pages/components

Legacy response mapping happens only in:
- `src/api/adapters/`
- Service-layer transformers

Pages, hooks, store slices, and UI components must consume normalized frontend-safe types only.

### 2. Every adapter has an owner

Each adapter specifies: source endpoint, normalized target type, migration owner, planned removal milestone. See adapter ownership table above.

### 3. Adapters are temporary

Each adapter will be removed when the corresponding backend endpoint is migrated to use `ApiResponseTrait`. Target: Step 4 or earlier if backend migration is opportunistic.

### 4. Type definitions remain canonical

Canonical frontend types live in `storefront/src/api/types.ts`. Legacy response shapes are NOT added to this file — they exist only as intermediate types inside adapter files.

### 5. Contract-test parity remains visible

The test tracker ([06b-step2-tier1-contract-test-tracker.md](06b-step2-tier1-contract-test-tracker.md)) documents which endpoints are normalized vs legacy. As backend endpoints are migrated, the corresponding adapter is removed and the test is updated to assert the new envelope.

---

## Risks Accepted

| Risk | Mitigation |
|------|------------|
| Adapter layer becomes permanent | Each adapter has explicit removal target; reviewed at Step 4 planning |
| Adapter bugs mask API issues | Contract tests validate actual response shapes independently of adapters |
| Type duplication between adapter intermediate types and canonical types | Intermediate types live only inside adapter files, never exported |
| Team ignores adapter rules and uses legacy shapes directly | Code review checks enforce adapter usage; no direct legacy response access in components |

---

## Summary Statistics

| Category | Count | % |
|----------|-------|---|
| Fully normalized | 2 endpoint groups | ~8% |
| Partially normalized (resource collections) | 10 endpoints | ~40% |
| Legacy (needs adapter) | 13+ endpoints | ~52% |

This confirms Option B is the correct choice. Only ~8% of Step 3 endpoints are fully normalized.

---

## Gate 3 Acceptance Checklist

- [x] Written decision approved (Option B — mixed mode with adapters)
- [x] All Step 3 required endpoints classified as normalized or legacy
- [x] Adapter rules and removal targets documented
- [x] Frontend team has one clear rule for all new development
- [x] Endpoint classification list complete

**Gate 3: COMPLETE**
