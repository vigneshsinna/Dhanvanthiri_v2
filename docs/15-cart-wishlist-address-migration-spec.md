# 15 — Cart, Wishlist, and Address Migration Spec

## Objective
Move user shopping state and profile-related shopping helpers to the new headless backend before transactional checkout cutover.

## Scope
- add to cart
- update quantity
- remove cart item
- cart summary
- wishlist add/remove/list
- address create/update/delete/select
- shipping address default behavior

## Cart migration rules
### Identity
Decide whether cart is keyed by:
- guest session token
- customer auth token
- server-side cart ID

Recommended: backend-owned cart identity with guest token support and auth merge.

### Required cart operations
- create or get cart
- add line item
- update line item
- remove line item
- empty cart
- apply coupon if already supported pre-checkout
- get summary totals

### Product rules
- variant selection must be explicit
- stock validation must happen server-side
- quantity constraints must be normalized
- pricing/tax/shipping preview logic must be consistent with checkout

## Wishlist
- require auth or allow guest staging, but document one rule
- ensure add/remove actions update header and account views
- normalize item structure to product-card compatible shape

## Addresses
- list addresses
- create address
- edit address
- delete address
- choose default shipping address
- validate postcode, city, state, country rules per supported market

## Frontend state rules
- cart badge count from one source only
- optimistic UI only for low-risk actions
- always refetch summary after mutation if backend totals are authoritative
- address forms should reuse the same validation schema in account and checkout

## Edge cases
- expired product while in cart
- unavailable variant
- price changed after add-to-cart
- address deleted while selected
- coupon becomes invalid
- guest cart merge on login

## Acceptance criteria
- cart state comes only from the new backend
- wishlist uses the new backend end to end
- address CRUD is fully migrated
- cart totals shown to the user match backend totals
