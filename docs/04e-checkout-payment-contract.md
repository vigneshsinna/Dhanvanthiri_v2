# 04e — Checkout & Payment Lifecycle Contract

> Step 2 · Sprint 2C · Headless API Contract Stabilization

## Purpose
Defines the standardized checkout flow phases and payment state machine that the storefront relies on.

---

## 1. Checkout Flow Phases

```
┌──────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     ┌───────────┐
│ CART │ ──→ │ ADDRESS │ ──→ │ SHIPPING │ ──→ │ PAYMENT │ ──→ │ REVIEW │ ──→ │ CONFIRMED │
└──────┘     └─────────┘     └──────────┘     └─────────┘     └────────┘     └───────────┘
   ↑              ↑               ↑               ↑
   └──────────────┴───────────────┴───────────────┘
                   (can go back)
```

### Phase Requirements

| Phase | Prerequisites | API Calls | Storefront View |
|-------|--------------|-----------|-----------------|
| `cart` | Cart has items | `POST /carts` (getList) | Cart page with items |
| `address` | Cart validated | `GET /user/shipping/address` | Address selection/form |
| `shipping` | Address selected | `POST /delivery-info` | Shipping method selection |
| `payment` | Shipping selected | `GET /payment-types` | Payment method selection |
| `review` | Payment selected | Cart summary recalculation | Final review before place |
| `confirmed` | Order placed | `POST /order/store` | Order confirmation page |

### Phase Validation Rules

1. **Cart → Address**: Cart must have ≥1 item; if `minimum_order_check` enabled, subtotal must meet threshold
2. **Address → Shipping**: Valid address must be selected (or guest address provided if `guest_checkout` enabled)
3. **Shipping → Payment**: Shipping method must be selected for each seller group
4. **Payment → Review**: Payment method must be selected
5. **Review → Confirmed**: All previous phases valid; stock re-checked; order created

---

## 2. Payment State Machine

```
                    ┌─────────────────┐
                    │                 │
        ┌──────────▼──────────┐      │
        │      PENDING        │      │
        └──┬───┬───┬───┬──┬──┘      │
           │   │   │   │  │         │
    ┌──────┘   │   │   │  └─────┐   │
    ▼          ▼   │   ▼        ▼   │
┌────────┐ ┌────┐ │ ┌───────┐ ┌──────────┐
│REQUIRES│ │PAID│ │ │FAILED │ │CANCELLED │
│_ACTION │ └──┬─┘ │ └───────┘ └──────────┘
└───┬────┘    │   │
    │         │   ▼
    │   ┌─────┘ ┌───────┐
    ▼   │       │EXPIRED│
┌────────┐      └───────┘
│  AUTH- │ │
│ ORIZED │
└───┬────┘
    │
    ▼
┌──────┐      ┌──────────┐      ┌───────────────────┐
│ PAID │ ──→  │ REFUNDED │ or   │ PARTIALLY_REFUNDED│
└──────┘      └──────────┘      └───────────────────┘
```

### State Definitions

| State | Description | Storefront Behavior |
|-------|-------------|---------------------|
| `pending` | Payment initiated, awaiting processing | Show loading/processing |
| `requires_action` | 3DS/OTP/redirect needed | Redirect to action URL |
| `authorized` | Funds held, not yet captured | Show "processing" status |
| `paid` | Payment captured successfully | Show success, order confirmed |
| `failed` | Payment attempt failed | Show error, allow retry |
| `cancelled` | User cancelled payment flow | Return to checkout |
| `expired` | Payment session timed out | Restart payment step |
| `refunded` | Full refund processed | Show refund status |
| `partially_refunded` | Partial refund processed | Show partial refund |

### Valid Transitions

| From | Allowed To |
|------|-----------|
| `pending` | `requires_action`, `authorized`, `paid`, `failed`, `cancelled`, `expired` |
| `requires_action` | `authorized`, `paid`, `failed`, `cancelled`, `expired` |
| `authorized` | `paid`, `failed`, `cancelled` |
| `paid` | `refunded`, `partially_refunded` |

---

## 3. Payment Gateway Normalization

All payment gateways MUST return this shape:

### Initiate Payment Response
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "payment_status": "pending|requires_action",
    "combined_order_id": 123,
    "order_codes": ["20240115-143000-42"],
    "redirect_url": "https://gateway.com/pay/session_xyz",
    "gateway": "stripe",
    "gateway_order_id": "pi_xxx"
  }
}
```

### Payment Callback/Webhook Response
```json
{
  "success": true,
  "message": "Payment confirmed",
  "data": {
    "payment_status": "paid",
    "combined_order_id": 123,
    "transaction_id": "txn_xxx"
  }
}
```

### Payment Failure Response
```json
{
  "success": false,
  "message": "Payment was declined",
  "error": {
    "code": "PAYMENT_FAILED",
    "details": {
      "gateway": "stripe",
      "gateway_error": "card_declined"
    }
  }
}
```

---

## 4. Full Checkout API Call Sequence

```
1. POST /carts                     → Get cart with items grouped by seller
2. POST /cart-summary              → Get totals
3. GET  /user/shipping/address     → Get saved addresses
4. POST /delivery-info             → Get shipping options for address
5. POST /shipping_cost             → Calculate shipping cost
6. POST /coupon-apply              → (Optional) Apply coupon
7. GET  /payment-types             → Get available payment methods
8. POST /cart-summary              → Recalculate totals with shipping + coupon
9. POST /order/store               → Create order
10. POST /payments/pay/{gateway}   → Initiate payment (if not COD)
11. GET  /purchase-history/{id}    → Get order confirmation details
```

---

## 5. Implementation Files

| File | Purpose |
|------|---------|
| `app/Enums/CheckoutPhase.php` | Phase constants and transition validation |
| `app/Enums/PaymentStatus.php` | Payment state machine with allowed transitions |
| `app/Http/Resources/V2/Storefront/CheckoutSessionResource.php` | Checkout session DTO |
| `app/Http/Resources/V2/Storefront/OrderSummaryResource.php` | Order summary DTO |
| `app/Http/Resources/V2/Storefront/OrderDetailResource.php` | Order detail DTO |
| `storefront/src/api/types.ts` | TypeScript types (`CheckoutPhase`, `PaymentStatusType`, `CheckoutSession`) |
