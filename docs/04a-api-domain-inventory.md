# 04a — API Domain Inventory

> Step 2 · Sprint 2A · Headless API Contract Stabilization

## Purpose
Canonical list of every V2 API endpoint, grouped by business domain, with auth requirements and response pattern classification.

---

## Domain: Authentication (`/api/v2/auth/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| POST | `/auth/login` | None | A (`result/message`) | Returns `access_token` on success |
| POST | `/auth/signup` | None | A | Creates user, returns token |
| POST | `/auth/social-login` | None | A | Google/Facebook/Apple |
| GET | `/auth/logout` | Bearer | A | Revokes token |
| GET | `/auth/user` | Bearer | Custom | Returns user object directly |
| POST | `/auth/info` | Bearer | Custom | Returns user info by token |
| GET | `/auth/account-deletion` | Bearer | A | Soft delete |
| GET | `/auth/resend_code` | Bearer | A | Email verification code |
| POST | `/auth/confirm_code` | Bearer | A | Verify email code |
| POST | `/auth/password/forget_request` | None | A | Send reset code |
| POST | `/auth/password/confirm_reset` | None | A | Reset with code |
| POST | `/auth/password/resend_code` | None | A | Resend reset code |

## Domain: Products (`/api/v2/products/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/products/category/{id}` | None | B (ResourceCollection) | Paginated |
| GET | `/products/brand/{id}` | None | B | Paginated |
| GET | `/products/seller/{id}/{slug}` | None | B | Paginated |
| GET | `/products/featured` | None | B | List |
| GET | `/products/best-seller` | None | B | List |
| GET | `/products/new-arrival` | None | B | List |
| GET | `/products/todays-deal` | None | B | List |
| GET | `/products/top-from-seller/{id}` | None | B | List |
| GET | `/products/related/{id}` | None | B | List |
| GET | `/products/digital` | None | B | List |
| GET | `/products/search` | None | B (SearchProductCollection) | `?name=` param |
| GET | `/products/variant/price` | None | Custom JSON | Price lookup |
| GET | `/products/{slug}` | None | B (ProductDetailCollection) | Single |
| GET | `/products` | None | B | Paginated |

## Domain: Categories (`/api/v2/categories/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/categories` | None | B | Full list |
| GET | `/categories/home` | None | B | Home page selection |
| GET | `/categories/top` | None | B | Top categories |
| GET | `/categories/info/{id}` | None | B | Single |
| GET | `/sub-categories/{id}` | None | B | Children |

## Domain: Brands (`/api/v2/brands/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/brands` | None | B | Full list |
| GET | `/brands/top` | None | B | Top brands |

## Domain: Cart (`/api/v2/carts/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| POST | `/carts/add` | Optional | A variant | `{result, temp_user_id, message}` |
| POST | `/carts` | Optional | Custom | `{grand_total, data: [shops]}` |
| POST | `/carts/change-quantity` | Optional | A | Quantity update |
| DELETE | `/carts/{id}` | Optional | A | Remove item |
| POST | `/carts/process` | Optional | A | Process cart |
| POST | `/cart-summary` | Optional | Custom | Flat JSON totals |
| POST | `/cart-count` | Optional | Custom | `{count, status}` |
| POST | `/updateCartStatus` | Optional | A | Status update |
| POST | `/guest-customer-info-check` | None | A | Guest validation |

## Domain: Checkout (`/api/v2/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| POST | `/coupon-apply` | Optional | A | Apply coupon |
| POST | `/coupon-remove` | Optional | A | Remove coupon |
| POST | `/delivery-info` | Optional | Custom | Shipping options |
| POST | `/shipping_cost` | Optional | Custom | Cost calculation |
| POST | `/carriers` | Optional | B | Carrier list |

## Domain: Orders (`/api/v2/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| POST | `/order/store` | Bearer | Custom | `{combined_order_id, result, message}` |
| GET | `/order/cancel/{id}` | Bearer | A | Cancel order |
| GET | `/purchase-history` | Bearer | B | Paginated |
| GET | `/purchase-history/{id}` | Bearer | B | Detail |
| GET | `/purchase-history-items/{id}` | Bearer | B | Line items |
| GET | `/digital-purchased-list` | Bearer | Custom | Digital products |
| POST | `/re-order/{id}` | Bearer | Custom | `{success_msgs, failed_msgs}` |

## Domain: Payment (`/api/v2/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/payment-types` | Bearer | Custom | Available methods |
| POST | `/payments/pay/stripe` | Bearer | Custom | Gateway-specific |
| POST | `/payments/pay/paypal` | Bearer | Custom | Gateway-specific |
| POST | `/payments/pay/razorpay` | Bearer | Custom | Gateway-specific |
| *...17 more gateways...* | *...varies...* | Bearer | Custom | All different shapes |

## Domain: Customer Account (`/api/v2/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/wishlists` | Bearer | B | List |
| POST | `/wishlists` | Bearer | A | Add |
| DELETE | `/wishlists/{id}` | Bearer | A | Remove |
| POST | `/wishlists/check-product` | Bearer | Custom | `{is_in_wishlist, product_id, wishlist_id}` |
| GET | `/user/shipping/address` | Bearer | B | List |
| POST | `/user/shipping/address` | Bearer | A | Create |
| PUT | `/user/shipping/address/{id}` | Bearer | A | Update |
| DELETE | `/user/shipping/address/{id}` | Bearer | A | Delete |
| POST | `/profile/update` | Bearer | A | Update profile |
| POST | `/profile/image-upload` | Bearer | A | Avatar |
| GET | `/profile/counters` | Bearer | Custom | Dashboard stats |

## Domain: Content / Settings (`/api/v2/*`)

| Method | Endpoint | Auth | Legacy Pattern | Notes |
|--------|----------|------|---------------|-------|
| GET | `/sliders` | None | B | Homepage sliders |
| GET | `/banners/one` | None | B | Banner set 1 |
| GET | `/banners/two` | None | B | Banner set 2 |
| GET | `/banners/three` | None | B | Banner set 3 |
| GET | `/flash-deals` | None | B | Active deals |
| GET | `/flash-deal-products/{id}` | None | B | Deal products |
| GET | `/shops` | None | B | Shop list |
| GET | `/shops/details/{id}` | None | B | Shop detail |
| GET | `/business-settings` | None | B | Site settings |
| GET | `/general-settings` | None | B | General config |
| GET | `/policies` | None | B | Legal pages |

---

## Response Pattern Legend

| Pattern | Shape | Count | Status |
|---------|-------|-------|--------|
| **A** | `{result: bool, message: string}` | ~20 endpoints | Legacy — migrate to envelope |
| **B** | ResourceCollection + `{success: true, status: 200}` | ~50 endpoints | Legacy — resources stay, `with()` changes |
| **Custom** | Varies per endpoint | ~15 endpoints | Priority migration targets |

---

## Total: ~85+ customer-facing endpoints across 10 domains
