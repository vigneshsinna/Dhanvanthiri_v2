# 16 — Checkout, Payment, and Order Cutover Spec

## Objective
Cut over the entire transactional funnel to the new headless backend with no dual-backend transaction handling.

## Non-negotiable rule
Once checkout migration starts, the full transaction path must stay on the new backend:
- cart validation
- address confirmation
- shipping selection
- coupon/tax/total confirmation
- order creation
- payment initiation
- payment confirmation
- order success/failure state
- post-payment order retrieval

## Checkout stages
1. Auth validation or guest eligibility check
2. Address selection or creation
3. Shipping option confirmation
4. Order summary confirmation
5. Payment method selection
6. Payment initiation
7. Redirect/modal/SDK handling
8. Callback or webhook confirmation
9. Success/failure page
10. Order detail availability

## Payment integration rules
- frontend should not construct payment truth on its own
- backend returns payment-init contract
- backend/webhook is the final order/payment authority
- frontend polls or reads order status after callback if needed

## Required contracts
- validate cart for checkout
- fetch checkout summary
- create order
- start payment
- confirm order/payment status
- fetch order success detail
- fetch failed payment recovery state if supported

## Critical edge cases
- payment succeeds but frontend times out
- payment fails after order creation
- callback returns before UI is ready
- duplicate click on pay
- partial failure between order create and payment init
- stale cart totals at payment time

## Rollout strategy
### Phase 1
Internal/staging only with new backend checkout

### Phase 2
Limited traffic or controlled user cohort

### Phase 3
Full cutover with rollback disabled for payment path once confidence is achieved

## QA focus
- all payment methods in scope
- duplicate submission protection
- coupon and shipping combinations
- guest vs auth checkout behavior
- order history and confirmation consistency
- refund/failed order visibility if supported

## Acceptance criteria
- no old backend endpoint participates in checkout once cutover starts
- payment and order states are consistent across UI and backend
- success and failure pages are reliable after refresh or redirect
- operational teams can trace checkout failures using logs and order IDs
