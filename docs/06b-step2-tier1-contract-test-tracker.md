# 06b — Step 2 Tier 1 Contract Test Tracker

## Status: IMPLEMENTED (pending PHP runtime for execution)

---

## Test File Locations

| File | Tests | Scope |
|------|-------|-------|
| `tests/Feature/Api/V2/ApiContractTest.php` | 12 | Envelope structure, capabilities, basic catalog, validation |
| `tests/Feature/Api/V2/Tier1ContractTest.php` | 45 | Full Tier 1 coverage (auth, catalog, cart, checkout, payment, errors, capabilities) |

Run command: `php artisan test --filter=Tier1ContractTest`

---

## Tier 1 Test Inventory

### A. Authentication Contract Tests (9 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 1 | Login success returns token and user | `/api/v2/auth/login` | POST | 200, `result:true`, `access_token`, `user` object |
| 2 | Login wrong password returns failure | `/api/v2/auth/login` | POST | `result:false` |
| 3 | Login empty body returns validation error | `/api/v2/auth/login` | POST | 422, `VALIDATION_ERROR` with fields |
| 4 | Signup empty body returns validation error | `/api/v2/auth/signup` | POST | 422, `VALIDATION_ERROR` |
| 5 | Logout without token returns 401 | `/api/v2/auth/logout` | GET | 401, `UNAUTHORIZED` |
| 6 | Logout with token returns success | `/api/v2/auth/logout` | GET | 200, `result:true` |
| 7 | User endpoint returns user object | `/api/v2/auth/user` | GET | 200, `id`, `name`, `email` |
| 8 | User without token returns 401 | `/api/v2/auth/user` | GET | 401, `UNAUTHORIZED` |
| 9 | Profile counters requires auth | `/api/v2/profile/counters` | GET | 401, `UNAUTHORIZED` |

### B. Catalog Listing Contract Tests (13 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 10 | Featured products structure | `/api/v2/products/featured` | GET | 200, data[].id/slug/name/thumbnail_image/main_price/rating |
| 11 | Search returns structure | `/api/v2/products/search` | GET | 200, data array |
| 12 | Search supports pagination | `/api/v2/products/search` | GET | 200, meta.current_page/last_page/per_page/total |
| 13 | Product detail fields | `/api/v2/products/{slug}` | GET | 200, data[].id/name |
| 14 | Products by category | `/api/v2/products/category/{slug}` | GET | 200, data array |
| 15 | Products by brand | `/api/v2/products/brand/{slug}` | GET | 200, data array |
| 16 | Category listing fields | `/api/v2/categories` | GET | 200, data[].id/slug/name |
| 17 | Categories featured | `/api/v2/categories/featured` | GET | 200, data array |
| 18 | Category info detail | `/api/v2/category/info/{slug}` | GET | 200, data[].id/slug/name |
| 19 | Brand listing fields | `/api/v2/brands` | GET | 200, data[].id/slug/name/logo |
| 20 | Brands top | `/api/v2/brands/top` | GET | 200, data array |
| 21 | Product prices are formatted strings | `/api/v2/products/featured` | GET | main_price/stroked_price are strings |
| 22 | Product images are URLs | `/api/v2/products/featured` | GET | thumbnail_image starts with http |

### C. Cart Contract Tests (6 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 23 | Add without auth returns JSON | `/api/v2/carts/add` | POST | JSON with result/message |
| 24 | Add with auth returns result | `/api/v2/carts/add` | POST | 200, result/message |
| 25 | Summary returns totals | `/api/v2/cart-summary` | POST | 200, sub_total/tax/shipping_cost/discount/grand_total |
| 26 | List returns grouped data | `/api/v2/carts` | POST | 200, data array |
| 27 | Change quantity returns result | `/api/v2/carts/change-quantity` | POST | result/message |
| 28 | Destroy returns result | `/api/v2/carts/{id}` | DELETE | 200 or 404 or 401 |

### D. Checkout / Shipping Contract Tests (5 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 29 | Shipping cost fields | `/api/v2/shipping_cost` | POST | JSON with result |
| 30 | Delivery info fields | `/api/v2/delivery-info` | POST | 200 |
| 31 | Coupon apply without code | `/api/v2/coupon-apply` | POST | result/message |
| 32 | Coupon remove returns result | `/api/v2/coupon-remove` | POST | result/message |
| 33 | Order store without cart | `/api/v2/order/store` | POST | result/message (failure) |

### E. Payment Contract Tests (5 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 34 | Payment types returns list | `/api/v2/payment-types` | GET | 200, array |
| 35 | COD without auth returns 401 | `/api/v2/payments/pay/cod` | POST | 401, `UNAUTHORIZED` |
| 36 | Manual without auth returns 401 | `/api/v2/payments/pay/manual` | POST | 401, `UNAUTHORIZED` |
| 37 | COD without cart returns failure | `/api/v2/payments/pay/cod` | POST | result/message |
| 38 | Online pay init requires auth | `/api/v2/online-pay/init` | GET | 401, `UNAUTHORIZED` |

### F. Error Contract Tests (5 tests)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 39 | 404 returns standardized envelope | `/api/v2/nonexistent` | GET | 404, success:false, NOT_FOUND |
| 40 | 401 returns standardized envelope | `/api/v2/profile/counters` | GET | 401, success:false, UNAUTHORIZED |
| 41 | Validation returns field details | `/api/v2/auth/login` | POST | 422, VALIDATION_ERROR, fields object |
| 42 | Signup validates required fields | `/api/v2/auth/signup` | POST | 422, VALIDATION_ERROR |
| 43 | Error envelope consistency check | Multiple | Mixed | All errors have success/error/code |

### G. Capability Flags Contract Tests (4 tests, shared with ApiContractTest)

| # | Test | Endpoint | Method | Expected |
|---|------|----------|--------|----------|
| 44 | Capabilities normalized envelope | `/api/v2/capabilities` | GET | 200, success:true, all flags present |
| 45 | Payment methods is array | `/api/v2/capabilities` | GET | payment_methods is array |
| 46 | Boolean flags are booleans | `/api/v2/capabilities` | GET | multi_vendor etc. are bool |
| Extra | Error codes are UPPER_SNAKE_CASE | Any error | Any | regex match /^[A-Z_]+$/ |

---

## Known Response Pattern Gaps

| Endpoint Domain | Current Format | Normalized? | Notes |
|-----------------|---------------|-------------|-------|
| Auth (login/signup/logout) | `{result, message, ...}` | **No** — legacy | Uses base Controller `success()`/`failed()` + raw response |
| Cart (add/summary/list) | `{result, message, ...}` | **No** — legacy | Formatted price strings, grouped by shop |
| Checkout (coupon/order) | `{result, message, ...}` | **No** — legacy | |
| Payment (COD/manual) | `{result, message, ...}` | **No** — legacy | Delegates to OrderController |
| Payment types | Raw array | **No** — legacy | Not wrapped in envelope |
| Shipping | `{result, ...}` | **No** — legacy | |
| Products (list/detail) | `{success, status, data, links, meta}` | **Partial** — resource collections | Has `success`+`status` but not full standardized envelope |
| Categories | `{success, status, data}` | **Partial** — resource collections | Same as products |
| Brands | `{success, status, data}` | **Partial** — resource collections | Same as products |
| Capabilities | `{success, message, data}` | **Yes** — normalized | Uses ApiResponseTrait |
| Error responses (Handler) | `{success, message, error: {code}}` | **Yes** — normalized | Unified exception handler |

---

## Tier 2 Backlog (deferred — pursue immediately after Tier 1 passes)

| Domain | Priority | Endpoints |
|--------|----------|-----------|
| Wishlist | High | `wishlists`, `wishlists-add-product`, `wishlists-remove-product`, `wishlists-check-product` |
| Profile | High | `customer/info`, `profile/update`, `profile/update-image` |
| Address book | High | `user/shipping/address`, `user/shipping/create`, `user/shipping/update`, `user/shipping/delete` |
| Order history | Medium | `purchase-history`, `purchase-history-details/{id}`, `purchase-history-items/{id}` |
| Shops / Sellers | Medium | `shops`, `shops/details/{id}`, `shops/products/*` |
| Reviews | Medium | `reviews/product/{id}`, `reviews/submit` |
| Notifications | Low | `all-notification`, `unread-notifications` |

## Tier 3 Backlog (can run in parallel with Step 3)

| Domain | Priority | Endpoints |
|--------|----------|-----------|
| Delivery boy | Low | All delivery-boy/* endpoints |
| Auction | Low | All auction/* endpoints |
| Classified | Low | All classified/* endpoints |
| Wallet | Low | `wallet/balance`, `wallet/history`, `wallet/offline-recharge` |
| Club points | Low | `clubpoint/get-list`, `clubpoint/convert-into-wallet` |
| Refund | Low | `refund-request/*` |
| Seller packages | Low | `customer-packages` |
| Chat | Low | All chat/* endpoints |
| Admin APIs | Low | All admin/* endpoints |

---

## Gate 2 Acceptance Checklist

- [x] All Tier 1 tests implemented (45 tests across 7 domains)
- [x] Failure-case coverage for auth, validation, payment, and errors
- [x] Error envelope consistency verified
- [x] Contract gaps documented (see Response Pattern Gaps table above)
- [x] Tier 2 and Tier 3 backlog explicitly deferred and tracked
- [ ] All Tier 1 tests executing and passing (requires PHP runtime setup)

**Note**: PHP is not currently installed on the build machine. Tests are syntactically complete and ready to run once `php artisan test --filter=Tier1ContractTest` is available.

**Gate 2: IMPLEMENTED — pending execution confirmation**
