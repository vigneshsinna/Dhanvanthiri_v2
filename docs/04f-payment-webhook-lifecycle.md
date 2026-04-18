# 04f — Payment Webhook Lifecycle

> Step 2 · Sprint 2C · Headless API Contract Stabilization

## Purpose
Defines how payment gateway webhooks/callbacks integrate with the standardized payment lifecycle.

---

## 1. Webhook Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Gateway    │ ──→ │  Webhook     │ ──→ │  Order Status   │
│  (Stripe,    │     │  Controller  │     │  Update         │
│   PayPal...) │     │              │     │                 │
└─────────────┘     └──────────────┘     └─────────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │  Payment     │
                    │  Status      │
                    │  Transition  │
                    └──────────────┘
```

## 2. Webhook Security

| Requirement | Implementation |
|-------------|---------------|
| Signature verification | Each gateway verifies webhook signature before processing |
| Idempotency | Webhooks are idempotent — duplicate delivery doesn't double-process |
| HTTPS only | Webhook endpoints only accept HTTPS |
| IP whitelisting | Where supported by gateway |
| Replay protection | Check `payment_status` transition validity before applying |

## 3. Gateway-Specific Webhook Mapping

| Gateway | Webhook Event | Maps To |
|---------|--------------|---------|
| Stripe | `payment_intent.succeeded` | `paid` |
| Stripe | `payment_intent.payment_failed` | `failed` |
| PayPal | `PAYMENT.CAPTURE.COMPLETED` | `paid` |
| PayPal | `PAYMENT.CAPTURE.DENIED` | `failed` |
| Razorpay | `payment.authorized` | `authorized` |
| Razorpay | `payment.captured` | `paid` |
| Razorpay | `payment.failed` | `failed` |
| SSLCommerz | `VALID` | `paid` |
| SSLCommerz | `FAILED` | `failed` |
| bKash | `Completed` | `paid` |
| bKash | `Failed` | `failed` |
| Flutterwave | `successful` | `paid` |
| Flutterwave | `failed` | `failed` |

## 4. Standard Webhook Processing Flow

```
1. Receive webhook → Verify signature
2. Parse gateway event → Map to PaymentStatus enum
3. Load order by gateway_order_id
4. Validate state transition (PaymentStatus::allowedTransitions)
5. Update order.payment_status
6. If paid → trigger notifications, update stock
7. Return 200 OK to gateway
```

## 5. Client-Side Payment Status Polling

For gateways that redirect (3DS, bank redirect):

```
POST /order/store        → combined_order_id
POST /payments/pay/xyz   → {redirect_url, payment_status: "requires_action"}
→ User redirected to gateway
→ Gateway callback to server
→ Server updates payment_status to "paid"
→ User returns to storefront

GET /purchase-history/{id} → check payment_status
```

The storefront polls `GET /purchase-history/{id}` every 3 seconds after redirect return, for up to 30 seconds, to detect the updated payment status.
