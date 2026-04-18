# 04i — Contract Test Checklist

> Step 2 · Sprint 2E · Headless API Contract Stabilization

## Purpose
Comprehensive checklist of contract tests that must pass before any API release. Tests verify the response envelope, error codes, status codes, and data shapes remain stable.

---

## Test Implementation

**File**: `tests/Feature/Api/V2/ApiContractTest.php`  
**Run**: `php artisan test --filter=ApiContractTest`

---

## Test Matrix

### 1. Envelope Structure Tests

| # | Test | Status |
|---|------|--------|
| 1.1 | ✅ Success response has `{success: true, message, data}` | Implemented |
| 1.2 | ✅ 404 returns `{success: false, error: {code: "NOT_FOUND"}}` | Implemented |
| 1.3 | ✅ 401 returns `{success: false, error: {code: "UNAUTHORIZED"}}` | Implemented |
| 1.4 | ✅ 422 returns `{success: false, error: {code: "VALIDATION_ERROR", fields: {}}}` | Implemented |
| 1.5 | ⬜ 429 returns `{success: false, error: {code: "RATE_LIMITED"}}` | Requires rate limit trigger |
| 1.6 | ⬜ 500 returns `{success: false, error: {code: "INTERNAL_ERROR"}}` | Requires mock exception |

### 2. Capability Flags Tests

| # | Test | Status |
|---|------|--------|
| 2.1 | ✅ `/capabilities` returns all required flags | Implemented |
| 2.2 | ✅ `payment_methods` is an array | Implemented |
| 2.3 | ⬜ All boolean flags are actually booleans | TODO |
| 2.4 | ⬜ `currency_code` is 3 characters | TODO |

### 3. Product Catalog Tests

| # | Test | Status |
|---|------|--------|
| 3.1 | ✅ Featured products have required fields | Implemented |
| 3.2 | ⬜ Product detail has all DTO fields | TODO (needs test product) |
| 3.3 | ⬜ Search returns paginated results | TODO |
| 3.4 | ⬜ Category products are paginated | TODO |
| 3.5 | ✅ Category list has required fields | Implemented |
| 3.6 | ✅ Brand list has required fields | Implemented |

### 4. Cart Tests

| # | Test | Status |
|---|------|--------|
| 4.1 | ✅ Add to cart without auth returns proper error | Implemented |
| 4.2 | ⬜ Add to cart with auth returns cart item | TODO (needs auth) |
| 4.3 | ⬜ Cart summary returns totals shape | TODO |
| 4.4 | ⬜ Cart count returns `{data: {count}}` | TODO |
| 4.5 | ⬜ Remove from cart returns success envelope | TODO |

### 5. Authentication Tests

| # | Test | Status |
|---|------|--------|
| 5.1 | ✅ Login with empty body returns 422 with field errors | Implemented |
| 5.2 | ✅ Signup with empty body returns 422 | Implemented |
| 5.3 | ⬜ Login with wrong credentials returns AUTH_INVALID_CREDENTIALS | TODO |
| 5.4 | ⬜ Successful login returns token in data | TODO |
| 5.5 | ⬜ Protected endpoint without token returns 401 | Part of 1.3 |

### 6. Checkout & Order Tests

| # | Test | Status |
|---|------|--------|
| 6.1 | ⬜ Order creation with empty cart returns CART_EMPTY | TODO |
| 6.2 | ⬜ Coupon apply with invalid code returns COUPON_NOT_FOUND | TODO |
| 6.3 | ⬜ Coupon apply with expired coupon returns COUPON_EXPIRED | TODO |
| 6.4 | ⬜ Purchase history returns order summary shape | TODO |
| 6.5 | ⬜ Order cancel on non-cancellable returns ORDER_CANCEL_NOT_ALLOWED | TODO |

### 7. Error Code Coverage

| # | Test | Status |
|---|------|--------|
| 7.1 | ⬜ Every ApiErrorCode constant is documented in 04d | Manual check |
| 7.2 | ⬜ Every ApiErrorCode has a matching TypeScript constant | Manual check |
| 7.3 | ⬜ ApiBusinessException renders correctly | TODO |
| 7.4 | ⬜ ModelNotFoundException maps to NOT_FOUND | Covered by Handler |
| 7.5 | ⬜ ValidationException maps to VALIDATION_ERROR | Covered by 5.1 |

---

## Test Coverage Summary

| Category | Implemented | TODO | Total |
|----------|------------|------|-------|
| Envelope | 4 | 2 | 6 |
| Capabilities | 2 | 2 | 4 |
| Products | 3 | 3 | 6 |
| Cart | 1 | 4 | 5 |
| Auth | 2 | 3 | 5 |
| Checkout/Orders | 0 | 5 | 5 |
| Error Codes | 0 | 5 | 5 |
| **Total** | **12** | **24** | **36** |

---

## Running Tests

```bash
# All contract tests
php artisan test --filter=ApiContractTest

# Specific category
php artisan test --filter=ApiContractTest::success_response_has_correct_envelope

# With coverage
php artisan test --filter=ApiContractTest --coverage
```
