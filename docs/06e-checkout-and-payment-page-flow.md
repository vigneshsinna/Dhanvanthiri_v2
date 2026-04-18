# 06e — Checkout and Payment Page Flow

## Document Purpose

This document defines the customer checkout journey and payment flow for the responsive storefront using the headless commerce core.

It covers:
- cart-to-checkout progression,
- address and shipping flows,
- coupon handling,
- order creation,
- payment selection,
- success / failure / pending result handling,
- frontend responsibilities,
- contract expectations for safe execution.

This document aligns storefront behavior to the existing checkout SDK module:
- `checkoutApi`
- `orderApi`
- `addressApi`
- `cartApi`
- `getCapabilities()`

---

## 1. Checkout Goals

The checkout flow must:
1. convert customers without unnecessary friction;
2. keep totals and shipping information trustworthy;
3. support seller-grouped carts if the backend requires owner-specific processing;
4. provide clear payment-state handling;
5. safely recover from failures and retries;
6. preserve customer trust.

---

## 2. Checkout Entry Conditions

A customer may enter checkout only when:
- the cart contains at least one valid item;
- the cart can be loaded successfully;
- the cart summary is available;
- the customer satisfies the authentication requirements defined by capabilities or business rules.

### Entry sources
- cart page CTA
- buy now flow (future)
- deep-link retry after login (optional)

### Pre-check checks
Before allowing checkout start, the storefront should verify:
- cart items still exist;
- quantities are valid;
- seller groups, if any, can be processed;
- the customer has a valid address or can create one;
- required capabilities are enabled.

---

## 3. Checkout States

The checkout route should maintain clear states:

1. **Cart review**
2. **Address selection / creation**
3. **Delivery and shipping selection**
4. **Coupon and order review**
5. **Payment selection**
6. **Order placement**
7. **Post-order payment handling**
8. **Result state**

These can be rendered as:
- a multi-step flow, or
- a single-page structured checkout with ordered sections.

---

## 4. Core API Dependencies

| Checkout Concern | SDK Method | Endpoint |
|---|---|---|
| cart groups | `cartApi.list()` | `POST /carts` |
| cart summary | `cartApi.summary()` | `POST /cart-summary` |
| process cart owner group | `cartApi.process(data)` | `POST /carts/process` |
| address list | `addressApi.list()` | `GET /user/shipping/address` |
| address create | `addressApi.create(data)` | `POST /user/shipping/create` |
| address update | `addressApi.update(data)` | `POST /user/shipping/update` |
| address default | `addressApi.makeDefault(data)` | `POST /user/shipping/make_default` |
| address delete | `addressApi.delete(id)` | `GET /user/shipping/delete/{id}` |
| coupon apply | `checkoutApi.applyCoupon(data)` | `POST /coupon-apply` |
| coupon remove | `checkoutApi.removeCoupon()` | `POST /coupon-remove` |
| coupon list | `checkoutApi.couponList()` | `GET /coupon-list` |
| delivery info | `checkoutApi.deliveryInfo(data)` | `POST /delivery-info` |
| shipping cost | `checkoutApi.shippingCost(data)` | `POST /shipping_cost` |
| payment types | `checkoutApi.paymentTypes()` | `GET /payment-types` |
| create order | `checkoutApi.createOrder(data)` | `POST /order/store` |
| wallet payment | `checkoutApi.payWithWallet(data)` | `POST /payments/pay/wallet` |
| COD payment | `checkoutApi.payWithCOD(data)` | `POST /payments/pay/cod` |

---

## 5. Checkout Page Composition

## 5.1 Section A — Contact / Account State
### Purpose
Explain whether the customer is:
- signed in,
- checking out as guest,
- required to sign in before continuing.

### Rules
- if auth is required and missing, redirect to login with return path;
- if guest checkout is supported, preserve cart state across login/register conversion.

---

## 5.2 Section B — Address Selection
### Purpose
Allow the customer to:
- choose an existing address,
- create a new address,
- edit a saved address,
- set the default address when needed.

### UX expectations
- mobile: card list + inline create form or modal
- desktop: address list with summary and edit controls

### Failure handling
- invalid form fields must render field-level errors
- failed address creation/update must not break checkout state

---

## 5.3 Section C — Delivery and Shipping
### Purpose
Resolve shipping/delivery options and update totals.

### Rules
- if the backend requires seller/owner processing, process each group first;
- calculate shipping cost after address and delivery selections are known;
- refresh totals after shipping changes.

### Risks
- shipping recalculation mismatch
- stale totals
- unsupported combinations of address and delivery method

---

## 5.4 Section D — Coupon and Promotions
### Purpose
Allow coupon application and removal before final order confirmation.

### Rules
- coupon changes must trigger summary refresh;
- invalid coupon responses must be clearly explained;
- coupon state should remain visible and reversible.

---

## 5.5 Section E — Order Review
### Purpose
Provide a trustworthy final summary of:
- items,
- quantities,
- seller grouping where relevant,
- subtotal,
- tax,
- shipping,
- discount,
- grand total.

### UX expectation
The customer must not feel surprised by:
- hidden fees,
- shipping changes,
- post-payment amount changes.

---

## 5.6 Section F — Payment Method Selection
### Purpose
Render only payment methods returned by the backend contract.

### Payment modes currently represented by SDK
- wallet
- cash on delivery
- other gateways returned through payment types and external flows

### Rules
- payment availability is backend-owned
- storefront only renders supported options
- disabled methods should not appear as active choices

---

## 5.7 Section G — Place Order
### Purpose
Create the order in a safe, recoverable, observable way.

### Rules
- button should be disabled while submission is in flight
- duplicate submission protection is required
- result handling must be explicit
- combined or grouped orders must return enough identifiers for the next payment step

---

## 6. Checkout Flow Sequence

## 6.1 Recommended sequence
1. load cart and summary
2. verify customer session / checkout mode
3. load addresses if authenticated
4. choose/create address
5. process cart owner group(s) if required
6. submit delivery info
7. fetch/update shipping cost
8. apply coupon if entered
9. fetch payment types
10. create order
11. branch into payment method flow
12. render success / pending / failure state

---

## 7. Payment Flow Modes

## 7.1 Cash on Delivery
### Flow
1. customer selects COD
2. storefront creates order
3. storefront calls COD payment endpoint if required
4. storefront redirects to success or order-confirmation screen

### Success condition
- order exists
- payment method is recorded appropriately
- customer sees clear next steps

---

## 7.2 Wallet Payment
### Flow
1. customer selects wallet
2. storefront checks displayed wallet availability
3. order is created
4. storefront invokes wallet payment action
5. storefront displays success or failure result

### Risks
- insufficient balance
- stale totals between order creation and payment
- partial order creation without confirmed wallet debit

---

## 7.3 External Gateway Payment
### Flow pattern
1. customer creates order
2. backend returns identifiers or redirect/session data
3. storefront redirects or launches gateway experience
4. gateway completes / cancels / fails
5. storefront returns to result route
6. backend truth confirms payment status

### Contract requirements
- storefront must not invent payment success
- backend remains the source of truth for payment status
- callback / webhook reconciliation must drive final order state

---

## 8. Result Pages

## 8.1 Success
### Must show
- order reference
- summary of successful outcome
- next steps
- link to order history or invoice if appropriate

### Must not
- overstate shipment promises not confirmed by backend

## 8.2 Failure
### Must show
- what failed
- whether order was created or not
- retry options
- support path if money may be in uncertain state

## 8.3 Pending
### Must show
- payment/order awaiting confirmation
- what the customer should do next
- where to check latest status

---

## 9. Guest vs Authenticated Checkout

## Authenticated-first model
Use when:
- addresses are account-bound,
- order history continuity is required,
- business rules disallow guest checkout.

## Guest/hybrid model
Use when:
- lower-friction conversion is a priority,
- address/order can be attached later or via email/phone,
- backend supports non-authenticated order creation safely.

### Decision note
This must be aligned with capability flags and backend policy. The storefront should not guess.

---

## 10. Error Handling Rules

Every checkout stage must define:
- inline validation errors,
- recoverable API failures,
- hard-stop blockers,
- retry behavior,
- customer-safe wording.

### High-priority blockers
- cart no longer valid
- shipping unavailable
- order creation failed
- payment method unavailable
- payment state unknown

---

## 11. Analytics and Observability

The checkout flow should emit events for:
- checkout started
- address selected/created
- shipping chosen
- coupon applied/removed
- payment method selected
- order created
- payment started
- payment success/failure/pending

These events should be designed so storefront analytics never becomes the source of truth for commerce state.

---

## 12. Acceptance Criteria

Checkout flow is considered implementation-ready when:
1. cart-to-checkout progression is defined;
2. address flow is defined;
3. shipping recalculation is defined;
4. coupon handling is defined;
5. payment selection rules are defined;
6. order creation sequence is defined;
7. success / failure / pending result behavior is defined;
8. guest vs authenticated posture is decided;
9. retry and failure handling is documented.

---

## 13. Delivery Recommendation

Build checkout in this order:
1. read-only checkout review shell
2. address integration
3. shipping integration
4. coupon integration
5. payment type rendering
6. order creation
7. COD/wallet flow
8. external gateway flow
9. result pages
10. analytics and polish

This sequence reduces risk and makes debugging easier.
