# 04b — Endpoint Canonicalization Matrix

> Step 2 · Sprint 2A · Headless API Contract Stabilization

## Purpose
Maps every legacy endpoint to its canonicalized replacement, defining the migration path from the three incompatible response patterns to the unified envelope.

---

## Migration Strategy

All endpoints migrate to the unified envelope:
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "meta": { "page": 1, "per_page": 10, "total": 42, "has_more": true },
  "error": { "code": "ERROR_CODE", "fields": {}, "details": {} }
}
```

### Migration Approach
- **Phase 1 (Non-breaking)**: New `ApiResponseTrait` + storefront DTOs added alongside legacy endpoints
- **Phase 2 (Parallel)**: New `/api/v2/storefront/*` routes using normalized DTOs
- **Phase 3 (Deprecation)**: Legacy endpoints emit `X-Deprecated: true` header
- **Phase 4 (Removal)**: After storefront fully migrated, legacy removed

---

## Domain: Authentication

| Legacy Endpoint | Canonical Endpoint | Change Required |
|----------------|-------------------|-----------------|
| `POST /auth/login` → `{result, message, access_token}` | Same route | Wrap in envelope: `{success, message, data: {access_token, user}}` |
| `POST /auth/signup` → `{result, message, access_token}` | Same route | Wrap in envelope |
| `GET /auth/user` → flat user object | Same route | Wrap: `{success, data: {user}}` |

## Domain: Products

| Legacy Endpoint | Canonical Endpoint | Change Required |
|----------------|-------------------|-----------------|
| `GET /products/featured` → ResourceCollection + `with()` | Same route | Use `ProductSummaryResource` in envelope |
| `GET /products/{slug}` → ProductDetailCollection + `with()` | Same route | Use `ProductDetailResource` in envelope |
| `GET /products/search?name=x` → SearchProductCollection | Same route | Use `ProductSummaryResource` + pagination meta |

## Domain: Cart

| Legacy Endpoint | Canonical Endpoint | Change Required |
|----------------|-------------------|-----------------|
| `POST /carts/add` → `{result, temp_user_id, message}` | Same route | `{success, message, data: {cart_item, temp_user_id}}` |
| `POST /carts` (getList) → `{grand_total, data: [shops]}` | `POST /carts` | Use `CartSummaryResource` in envelope |
| `POST /cart-summary` → flat totals | `POST /cart-summary` | Embed in `CartSummaryResource` |
| `POST /cart-count` → `{count, status}` | `POST /cart-count` | `{success, data: {count}}` |

## Domain: Checkout & Orders

| Legacy Endpoint | Canonical Endpoint | Change Required |
|----------------|-------------------|-----------------|
| `POST /order/store` → `{combined_order_id, result, message}` | Same route | `{success, data: {combined_order_id, order_codes[]}}` |
| `GET /purchase-history` → PurchaseHistoryMiniCollection | Same route | Use `OrderSummaryResource` in envelope |
| `GET /purchase-history/{id}` → PurchaseHistoryCollection | Same route | Use `OrderDetailResource` in envelope |
| `POST /coupon-apply` → `{result, message}` | Same route | `{success, message, data: {discount_amount, coupon_code}}` |

## Domain: Payment

| Legacy Endpoint | Canonical Endpoint | Change Required |
|----------------|-------------------|-----------------|
| 19 gateway-specific routes | Normalize to common shape | All return `{success, data: {payment_status, redirect_url?, order_id}}` |

---

## Priority Order

| Priority | Domain | Endpoints | Reason |
|----------|--------|-----------|--------|
| P0 | Cart | 6 | Storefront checkout flow depends on it |
| P0 | Checkout | 3 | Order placement |
| P1 | Products | 14 | All pages need these |
| P1 | Auth | 12 | Login/signup flow |
| P2 | Orders | 6 | Purchase history |
| P2 | Account | 11 | Profile features |
| P3 | Payment | 19+ | Gateway normalization |
| P3 | Content | 11 | Settings/banners |
