# 04k — Storefront Consumer Integration Guide

> Step 2 · Sprint 2E · Headless API Contract Stabilization

## Purpose
Guide for the React storefront team on how to consume the stabilized API contract. Covers response handling, error handling, capability flags, and TypeScript type usage.

---

## 1. API Client Setup

The API client is pre-configured at `storefront/src/api/client.ts`:

```typescript
import api from '@/api/client';
```

Features:
- Automatic auth token injection from `localStorage`
- Language header from `localStorage`
- 401 auto-redirect to login
- 15-second timeout
- Error helpers: `getApiErrorCode()`, `getValidationErrors()`, `getApiErrorMessage()`

---

## 2. Response Handling

### New Standardized Envelope

All migrated endpoints return:

```typescript
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}
```

### Consuming Responses

```typescript
import api from '@/api/client';
import type { ApiEnvelope, CapabilityFlags } from '@/api/types';

// Typed request
const { data: response } = await api.get<ApiEnvelope<CapabilityFlags>>('/capabilities');
const flags = response.data;  // Fully typed CapabilityFlags
```

### Legacy Endpoints (Not Yet Migrated)

Some endpoints still use legacy patterns. The storefront SDK modules (`products.ts`, `cart.ts`, etc.) handle this internally so page components don't need to know.

---

## 3. Error Handling

### Standard Pattern

```typescript
import { getApiErrorCode, getApiErrorMessage, API_ERROR_CODES } from '@/api';

try {
  await cartApi.addToCart(productId, quantity);
} catch (error) {
  const code = getApiErrorCode(error);
  
  switch (code) {
    case API_ERROR_CODES.CART_OUT_OF_STOCK:
      showToast('This product is out of stock', 'error');
      break;
    case API_ERROR_CODES.CART_QUANTITY_EXCEEDED:
      showToast('Not enough stock available', 'warning');
      break;
    case API_ERROR_CODES.VALIDATION_ERROR:
      const fields = getValidationErrors(error);
      if (fields) setFormErrors(fields);
      break;
    default:
      showToast(getApiErrorMessage(error), 'error');
  }
}
```

### Validation Errors

```typescript
import { getValidationErrors } from '@/api';

try {
  await authApi.signup(formData);
} catch (error) {
  const fields = getValidationErrors(error);
  // fields = { email: ["Email already exists"], password: ["Min 6 chars"] }
  if (fields) {
    Object.entries(fields).forEach(([field, messages]) => {
      setError(field, { message: messages[0] });
    });
  }
}
```

---

## 4. Capability Flags

### Boot-Time Fetch

```typescript
import { getCapabilities } from '@/api/capabilities';

// Call once on app initialization
const capabilities = await getCapabilities();
```

### Conditional Rendering

```tsx
function Header() {
  const { data: caps } = useQuery({ queryKey: ['capabilities'], queryFn: getCapabilities });

  return (
    <nav>
      {caps?.wishlist && <WishlistIcon />}
      {caps?.loyalty_points && <PointsBalance />}
      {caps?.wallet && <WalletBalance />}
    </nav>
  );
}
```

### Checkout Guards

```typescript
if (caps.minimum_order_check && cartTotal < caps.minimum_order_amount) {
  showWarning(`Minimum order: ${caps.currency_symbol}${caps.minimum_order_amount}`);
  return;
}
```

---

## 5. TypeScript Types

All types are in `storefront/src/api/types.ts`:

### Legacy Types (still in use)
- `ProductMini`, `ProductDetail` — existing product shapes
- `CartItem`, `CartGroup`, `CartSummary` — existing cart shapes
- `OrderMini`, `OrderDetail` — existing order shapes

### New Normalized Types (Step 2 contract)
- `ProductSummary`, `ProductDetailNormalized` — storefront-safe product DTOs
- `CartItemNormalized`, `CartSummaryNormalized` — typed cart with numeric prices
- `OrderSummaryNormalized`, `OrderDetailNormalized` — ISO dates, typed totals
- `CheckoutSession`, `CheckoutPhase`, `PaymentStatusType` — checkout lifecycle
- `CapabilityFlags` — feature flags
- `ApiEnvelope<T>` — standardized response wrapper

### Error Codes

```typescript
import { API_ERROR_CODES, type ApiErrorCodeType } from '@/api/types';
// Use for type-safe switch/case on error codes
```

---

## 6. SDK Module Structure

| Module | Import | Endpoints |
|--------|--------|-----------|
| `products.ts` | `productApi` | Featured, best seller, search, detail, variant pricing |
| `categories.ts` | `categoryApi` | List, home, top, sub-categories |
| `brands.ts` | `brandApi` | List, top |
| `cart.ts` | `cartApi` | Add, list, summary, count, change qty, remove |
| `auth.ts` | `authApi` | Login, signup, social, logout, user |
| `checkout.ts` | `checkoutApi, orderApi` | Coupon, delivery, shipping, order create, history |
| `content.ts` | `contentApi` | Sliders, banners, settings, shops, flash deals |
| `customer.ts` | `wishlistApi, addressApi` | Wishlist CRUD, address CRUD |
| `capabilities.ts` | `getCapabilities` | Feature flags |

---

## 7. Migration Path

As endpoints are migrated to the new contract:

1. The SDK module is updated to parse the new envelope
2. Legacy types remain as aliases until all consumers are updated
3. New normalized types are used in new page components
4. Old page components continue working with legacy types

The storefront can consume both old and new response formats simultaneously during the migration period.
