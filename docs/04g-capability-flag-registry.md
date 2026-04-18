# 04g — Capability Flag Registry

> Step 2 · Sprint 2D · Headless API Contract Stabilization

## Purpose
Documents the runtime feature flag system that lets the storefront adapt its UI without hardcoded backend knowledge.

---

## Endpoint

```
GET /api/v2/capabilities
```

**Auth**: None required (public)  
**Cache**: Storefront should cache for session lifetime  
**Implementation**: `app/Http/Controllers/Api/V2/CapabilityController.php`

---

## Flag Reference

### Core Features

| Flag | Type | Source | Default | Description |
|------|------|--------|---------|-------------|
| `multi_vendor` | bool | hardcoded | `true` | Platform supports multiple sellers |
| `guest_checkout` | bool | `guest_checkout_activation` setting | `false` | Allow checkout without account |
| `wallet` | bool | `wallet_system` setting | `false` | Wallet balance feature |
| `loyalty_points` | bool | `club_point` addon | `false` | Club points / loyalty program |
| `email_verification` | bool | `email_verification` setting | `false` | Require email verification after signup |

### Addons

| Flag | Type | Source | Default | Description |
|------|------|--------|---------|-------------|
| `wishlist` | bool | hardcoded | `true` | Wishlist functionality |
| `flash_deals` | bool | hardcoded | `true` | Flash deal campaigns |
| `coupons` | bool | hardcoded | `true` | Coupon/discount codes |
| `reviews` | bool | hardcoded | `true` | Product reviews |
| `refund_requests` | bool | `refund_request` addon | `false` | Refund request system |
| `otp_system` | bool | `otp_system` addon | `false` | OTP-based authentication |
| `affiliate_system` | bool | `affiliate_system` addon | `false` | Affiliate marketing |
| `offline_payment` | bool | `offline_payment` addon | `false` | Manual/offline payment methods |
| `auction` | bool | `auction` addon | `false` | Auction products |
| `wholesale` | bool | `wholesale` addon | `false` | Wholesale pricing tiers |
| `seller_subscription` | bool | `seller_subscription` addon | `false` | Seller package subscriptions |
| `delivery_boy` | bool | `delivery_boy` addon | `false` | Delivery boy tracking |
| `pos` | bool | `pos_system` addon | `false` | Point of sale |
| `blog` | bool | hardcoded | `true` | Blog/articles |

### Checkout & Shipping

| Flag | Type | Source | Default | Description |
|------|------|--------|---------|-------------|
| `minimum_order_check` | bool | `minimum_order_amount_check` setting | `false` | Enforce minimum order amount |
| `minimum_order_amount` | float | `minimum_order_amount` setting | `0` | Minimum order threshold |
| `pickup_point` | bool | `pickup_point` setting | `false` | Pickup point option |
| `shipping_type` | string | `shipping_type` setting | `"flat_rate"` | `flat_rate`, `seller_wise`, `carrier` |

### Payment Methods

| Flag | Type | Description |
|------|------|-------------|
| `payment_methods` | string[] | List of enabled gateway keys |

Possible values: `paypal`, `stripe`, `sslcommerz`, `instamojo`, `razorpay`, `paystack`, `bkash`, `nagad`, `iyzico`, `flutterwave`, `paytm`, `khalti`, `aamarpay`, `mpesa`, `cash_on_delivery`, `wallet`

### Localization

| Flag | Type | Source | Description |
|------|------|--------|-------------|
| `currency_symbol` | string | system currency | e.g. `"$"`, `"৳"`, `"₹"` |
| `currency_code` | string | system currency | ISO 4217 code (e.g. `"USD"`) |
| `address_has_state` | bool | `has_state` setting | Whether address form shows state field |

---

## Storefront Usage

```typescript
// Boot-time fetch (once per session)
import { getCapabilities } from '@/api/capabilities';

const caps = await getCapabilities();

// Conditional UI rendering
{caps.wishlist && <WishlistButton productId={id} />}
{caps.flash_deals && <FlashDealBanner />}
{caps.guest_checkout && <GuestCheckoutOption />}

// Payment method rendering
{caps.payment_methods.map(method => (
  <PaymentOption key={method} method={method} />
))}

// Minimum order enforcement
if (caps.minimum_order_check && cartTotal < caps.minimum_order_amount) {
  showMinOrderWarning(caps.minimum_order_amount, caps.currency_symbol);
}
```

---

## Adding New Flags

1. Add the flag to `CapabilityController::index()` in the response array
2. Add the TypeScript type to `storefront/src/api/types.ts` → `CapabilityFlags`
3. Document in this file
4. The storefront gracefully handles unknown flags (they're just missing properties)
