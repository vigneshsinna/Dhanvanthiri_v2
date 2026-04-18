# Storefront, Account, And Guest Checkout Wiring Design

**Date:** 2026-04-15

**Scope:** This pass covers storefront/account wiring plus a real guest checkout bridge. Laravel remains the production owner of `/admin`, and React admin stays limited to the currently backed bridge features instead of expanding to the full unimplemented admin API surface.

## Problem Summary

- Storefront account flows still have contract mismatches around auth rehydration, refresh handling, address payloads, avatar uploads, wishlist identifiers, order identifiers, and guest tracking.
- The React checkout UI presents guest checkout, but the backend currently only supports authenticated order/payment routes plus a guest-account-creation helper that behaves too much like a real account path.
- Guest order access is currently unsafe and inconsistent because the frontend tries to look up guest state by generic routes instead of a dedicated guest session contract.
- React admin and Laravel admin compete conceptually, but this pass intentionally avoids broad React admin expansion and keeps only the narrow `/api/admin` bridge already backed today.

## Architectural Decisions

1. Laravel continues to own `/admin/*` in production.
2. React admin remains limited to the currently backed bridge features only.
3. Storefront/account wiring is fixed directly in the React adapters and Laravel V2/API bridge.
4. Guest checkout is implemented through a guest customer record plus a dedicated guest checkout session, not by silently creating a normal logged-in account and not by using a fully anonymous order model.

## Chosen Approach

Use the existing `users`, `addresses`, `carts`, `orders`, and `combined_orders` relationships, but add a small guest lifecycle layer:

- keep `user_type = customer`
- add `is_guest = true|false`
- add `account_claimed_at` nullable timestamp
- create a `guest_checkout_sessions` table that owns the guest checkout token and progress state
- convert the cart from `temp_user_id` to `user_id` only after guest validation succeeds
- reuse the existing checkout/order/payment flow where possible once the guest session is bound to a guest user

This avoids inventing a second order system while also preserving a clean separation between guest checkout and claimed customer accounts.

## Guest Identity Rules

- Never bind guest checkout to an existing non-guest user just because email or phone matches.
- Reuse only when:
  - `is_guest = true`
  - `account_claimed_at is null`
  - the email matches exactly
- Do not resolve or merge by phone.
- If the email belongs to a claimed customer account, the backend must require sign-in instead of silently attaching the checkout to that account.

## Guest Session Model

Create `guest_checkout_sessions` with these fields:

- `id`
- `guest_user_id`
- `temp_user_id`
- `guest_checkout_token_hash`
- `status`
- `combined_order_id` nullable
- `order_code` nullable
- `expires_at`
- timestamps

Frozen `status` values:

- `initiated`
- `validated`
- `cart_bound`
- `payment_pending`
- `payment_authorized`
- `order_completed`
- `expired`
- `abandoned`
- `failed`

## Token Rules

- Store only a hashed guest token server-side.
- The token must be long, random, and explicitly time-bounded.
- Rotate the token when checkout is restarted.
- Invalidate the token after claim flow, and optionally after hard completion depending on final confirmation UX.
- A single guest checkout token is sufficient for this pass as long as it is tightly scoped and expired correctly.

## Guest Checkout Flow

### Validate

`POST /api/v2/guest/checkout/validate`

Responsibilities:

- validate guest cart presence via `temp_user_id`
- validate guest contact + address payload
- reject emails already attached to claimed accounts
- create or reuse only a guest user
- create or refresh a guest checkout session
- return `guest_checkout_token`

### Cart Handoff

After validation succeeds:

- find active cart rows by `temp_user_id`
- create/reuse guest user
- create/reuse guest address row
- reassign cart rows from `temp_user_id` to `user_id`
- persist the original `temp_user_id` on the guest checkout session for auditability
- make the operation idempotent so retries do not duplicate cart rows or address records

### Summary

`POST /api/v2/guest/checkout/summary`

- requires `guest_checkout_token`
- uses the bound guest user/cart context
- returns stable checkout totals

### Payment Intent

`POST /api/v2/guest/payments/intent`

- requires `guest_checkout_token`
- must be idempotent by guest checkout session
- should reopen the same pending order/payment context when retrying recoverable failures
- stores the resulting `combined_order_id` and `order_code` on the guest checkout session

### Payment Confirm

`POST /api/v2/guest/payments/confirm`

- requires `guest_checkout_token`
- verifies Razorpay/server-side payment state
- must be idempotent
- updates the guest checkout session status safely on repeated confirms
- must not be the only payment truth source; webhook/server reconciliation should still be able to finalize state

## Order And Address Persistence

- A guest user may have a reusable `addresses` row for operational checkout needs.
- The final order must also persist its own immutable shipping/billing address snapshot so later edits or claim/merge actions cannot rewrite historical purchase details.

## Confirmation, Tracking, And Access

- Success/confirmation access must not depend on a storefront auth session.
- Guest confirmation and tracking should use the guest checkout token and/or a signed order access mechanism.
- Signed order access must be rate-limited and time-bounded.
- Avoid raw lookup by email/phone as the primary access method.
- Standardize guest-facing order detail/tracking around explicit order-number support instead of mixed numeric-id vs order-code behavior.

Recommended guest-facing endpoints:

- `POST /api/v2/guest/checkout/validate`
- `POST /api/v2/guest/checkout/summary`
- `POST /api/v2/guest/payments/intent`
- `POST /api/v2/guest/payments/confirm`
- `GET /api/v2/orders/track`
- `GET /api/v2/orders/{orderNumber}`

## Session Expiry Rules

- If the guest checkout session expires before order creation, the guest must restart checkout.
- If the session is expired but linked to a recoverable `payment_pending` order, refresh may revive the same order/payment context.
- If the order is already completed, confirmation/tracking may still work through signed order access even after checkout session expiry.

## Claim Path

This pass does not need full claim/merge implementation, but the lifecycle is frozen now:

- account claim converts the same guest user row into a real customer account
- no duplicate user is created during claim
- orders, addresses, and history remain on the same user row
- password is set only during explicit claim/activation
- `is_guest` becomes `false`
- `account_claimed_at` is set

## Storefront And Account Contract Fixes In Scope

- normalize `/api/v2/auth/user` to the same shape used by login success
- remove fake refresh behavior and use explicit logout/re-auth behavior until a real refresh strategy exists
- align avatar upload contract
- align address create/update payload contract
- add proper guest order tracking/detail routes
- standardize order-number lookup
- fix wishlist slug handling
- keep React admin limited to currently backed product/page/post/faq/payment bridge endpoints

## Security Notes

- No guest flow should issue a normal storefront auth token.
- Guest checkout tokens and signed order access must be rate-limited and time-bounded.
- Guest/payment/order endpoints must be idempotent where retries are expected.
- Razorpay credentials remain server-only and must not be exposed beyond the public key fields already required by Checkout.

## Verification Strategy

- backend feature tests for guest validation, cart handoff, guest payment intent, guest payment confirm, guest tracking, and order-number lookup
- frontend tests for guest checkout adapter and UI flow
- regression tests for address, auth rehydration, wishlist, and order detail contracts
- manual QA for:
  - guest checkout happy path
  - guest checkout retry path
  - payment refresh/reopen path
  - guest confirmation without login
  - guest tracking with signed/time-bounded access
  - claimed-account email collision

## Constraints

- This workspace has no git repository, so the design document cannot be committed here.
