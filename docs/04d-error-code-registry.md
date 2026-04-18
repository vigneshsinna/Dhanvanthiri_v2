# 04d — Error Code Registry

> Step 2 · Sprint 2B · Headless API Contract Stabilization

## Purpose
Complete registry of machine-readable error codes. Storefronts use these to determine next actions (show toast, redirect, retry) without parsing message strings.

---

## Implementation

**PHP Enum**: `app/Enums/ApiErrorCode.php`  
**TypeScript Mirror**: `storefront/src/api/types.ts` → `API_ERROR_CODES`  
**Exception Handler**: `app/Exceptions/Handler.php` → `renderApiException()`  
**Business Exception**: `app/Exceptions/ApiBusinessException.php`

---

## Error Code Reference

### Authentication & Authorization

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token | Redirect to login |
| `FORBIDDEN` | 403 | Valid token, insufficient permissions | Show "access denied" |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password | Show "invalid credentials" on login form |
| `AUTH_ACCOUNT_BANNED` | 403 | Account suspended | Show ban message, disable login |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not yet verified | Show verify email prompt |
| `AUTH_TOKEN_EXPIRED` | 401 | Token TTL exceeded | Clear token, redirect to login |
| `AUTH_SOCIAL_LOGIN_FAILED` | 401 | OAuth flow failed | Show "social login failed" |

### Validation

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `VALIDATION_ERROR` | 422 | Request body fails validation | Display field-level errors from `error.fields` |

### Catalog

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `PRODUCT_NOT_FOUND` | 404 | Product ID/slug doesn't exist | Show 404 page |
| `CATEGORY_NOT_FOUND` | 404 | Category ID/slug doesn't exist | Show 404 page |
| `BRAND_NOT_FOUND` | 404 | Brand ID/slug doesn't exist | Show 404 page |

### Cart

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `CART_EMPTY` | 409 | Trying to checkout with empty cart | Show "cart is empty" |
| `CART_ITEM_NOT_FOUND` | 404 | Cart item ID doesn't exist | Refresh cart |
| `CART_OUT_OF_STOCK` | 409 | Product stock is 0 | Show out-of-stock badge, disable add |
| `CART_QUANTITY_EXCEEDED` | 409 | Requested qty > available stock | Show max available qty |
| `CART_MIN_QUANTITY` | 409 | Requested qty < minimum order qty | Show minimum qty message |
| `CART_AUCTION_CONFLICT` | 409 | Mixing auction + regular in cart | Show "remove auction item first" |
| `CART_DIGITAL_DUPLICATE` | 409 | Digital product already in cart | Show "already in cart" |

### Coupon

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `COUPON_NOT_FOUND` | 404 | Coupon code doesn't exist | Show "invalid coupon" |
| `COUPON_EXPIRED` | 409 | Coupon past end date | Show "coupon expired" |
| `COUPON_NOT_APPLICABLE` | 409 | Cart doesn't qualify | Show "not applicable to your cart" |
| `COUPON_ALREADY_APPLIED` | 409 | User already used this coupon | Show "already used" |
| `COUPON_MIN_ORDER` | 409 | Order total below minimum | Show minimum order amount |

### Checkout

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `CHECKOUT_EXPIRED` | 409 | Checkout session timed out | Restart checkout flow |
| `CHECKOUT_INVALID_ADDRESS` | 409 | Address validation failed | Highlight address form errors |
| `CHECKOUT_SHIPPING_UNAVAILABLE` | 409 | No shipping to selected address | Show "shipping unavailable" |
| `CHECKOUT_VALIDATION_FAILED` | 409 | Generic checkout validation | Show specific message |

### Payment

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `PAYMENT_FAILED` | 409 | Payment processing failed | Show "payment failed, try again" |
| `PAYMENT_CANCELLED` | 409 | User cancelled payment flow | Return to checkout |
| `PAYMENT_GATEWAY_ERROR` | 502 | Gateway timeout/error | Show "try again later" |
| `PAYMENT_METHOD_UNAVAILABLE` | 409 | Selected method disabled | Refresh payment methods |
| `PAYMENT_DUPLICATE` | 409 | Duplicate payment attempt | Show "already paid" |
| `PAYMENT_AMOUNT_MISMATCH` | 409 | Amount changed since init | Restart checkout |

### Order

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `ORDER_NOT_FOUND` | 404 | Order ID doesn't exist for user | Show 404 |
| `ORDER_CANCEL_NOT_ALLOWED` | 409 | Order not in cancellable state | Show "cannot cancel" |
| `ORDER_ALREADY_CANCELLED` | 409 | Order already cancelled | Refresh order status |

### Account

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `ACCOUNT_NOT_FOUND` | 404 | User account not found | Redirect to login |
| `ADDRESS_NOT_FOUND` | 404 | Address ID doesn't exist | Refresh address list |
| `WISHLIST_ALREADY_EXISTS` | 409 | Product already in wishlist | Toggle UI state |

### System

| Code | HTTP Status | When | Storefront Action |
|------|-------------|------|-------------------|
| `NOT_FOUND` | 404 | Generic resource not found | Show 404 |
| `RATE_LIMITED` | 429 | Too many requests | Show "please wait, try again" |
| `INTERNAL_ERROR` | 500 | Unhandled server error | Show "something went wrong" |

---

## Usage Examples

### PHP — Throwing business errors
```php
use App\Enums\ApiErrorCode;
use App\Exceptions\ApiBusinessException;

throw new ApiBusinessException(
    ApiErrorCode::CART_OUT_OF_STOCK,
    'This product is out of stock',
    ['product_id' => 123, 'available_qty' => 0],
    409
);
```

### TypeScript — Handling errors
```typescript
import { getApiErrorCode, API_ERROR_CODES } from '@/api';

try {
  await cartApi.addToCart(productId, qty);
} catch (error) {
  const code = getApiErrorCode(error);
  
  switch (code) {
    case API_ERROR_CODES.CART_OUT_OF_STOCK:
      toast.error('This product is out of stock');
      break;
    case API_ERROR_CODES.CART_QUANTITY_EXCEEDED:
      toast.error('Requested quantity not available');
      break;
    default:
      toast.error(getApiErrorMessage(error));
  }
}
```
