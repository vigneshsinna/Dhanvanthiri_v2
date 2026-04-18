# 06f — Account Area Specification

## Document Purpose

This document defines the customer self-service account area for the responsive storefront.

It covers:
- account dashboard
- authentication state
- orders
- addresses
- profile
- wishlist
- session behavior
- navigation and responsive patterns

The account area is a retention and trust layer. It is where the storefront proves that the headless commerce core supports lifecycle interactions after the sale, not just browsing and conversion.

---

## 1. Goals of the Account Area

The account area must enable customers to:
- sign in securely,
- view recent and historical orders,
- inspect order details,
- download invoices where supported,
- manage addresses,
- manage wishlist items,
- update profile information where supported,
- recover trust when something went wrong in checkout.

---

## 2. Core Route Inventory

## Existing
- `/login`

## Planned
- `/register`
- `/account`
- `/account/orders`
- `/account/orders/:id`
- `/account/addresses`
- `/account/profile`
- `/wishlist`
- `/forgot-password` (optional)
- `/reset-password` (optional)

---

## 3. Auth and Session Rules

## 3.1 Current app model
The storefront currently:
- stores an auth token in local storage,
- uses the token in the API client authorization header,
- clears the token on 401,
- redirects to login when protected calls fail.

## 3.2 Account area rules
- all `/account/*` routes require authentication;
- `/wishlist` requires authentication;
- `/login` and `/register` should redirect away if a valid session already exists;
- invalid or expired tokens must not leave the UI in a broken half-authenticated state.

## 3.3 Intended-route handling
When a guest attempts to visit a protected route:
1. preserve the intended path;
2. redirect to login;
3. return to the intended route after successful authentication when appropriate.

---

## 4. Account Shell

## Purpose
Provide a consistent wrapper for all customer self-service pages.

## Shared elements
- account navigation
- customer summary block
- page title area
- responsive content region
- support/help links

## Responsive pattern
### Mobile
- tabs, accordion nav, or drawer
- one-column content

### Desktop
- left nav rail + content panel
- summary and quick actions visible

---

## 5. Login and Registration

## 5.1 Login
### Current status
Implemented

### API dependencies
- `POST /auth/login`
- `GET /auth/user`

### Required UX states
- default form
- field validation error
- invalid credentials
- loading
- success redirect
- already-authenticated redirect

## 5.2 Registration
### Status
Planned

### API dependencies
- `POST /auth/signup`

### Required UX states
- create account form
- field validation errors
- duplicate identity handling
- success transition
- terms/consent where required by storefront/business rules

---

## 6. Account Dashboard

**Route:** `/account`

## Purpose
Serve as the self-service landing page.

## Recommended modules
- greeting / profile summary
- recent order list
- quick links to orders, addresses, wishlist, profile
- active promotions or useful reminders (optional)
- support/help access

## API dependencies
- `GET /auth/user`
- optional `GET /purchase-history`

## Acceptance criteria
- dashboard loads quickly
- key customer actions are reachable in one click/tap
- empty states are graceful for first-time buyers

---

## 7. Orders Area

## 7.1 Orders List
**Route:** `/account/orders`

### Purpose
Allow customers to view their order history.

### API dependencies
- `GET /purchase-history`

### Required data
- order identifier
- order date
- summary amount
- status
- payment state
- fulfillment state if available

### UX states
- loading
- empty list
- populated list
- API failure state

### Acceptance criteria
- customers can see historical orders
- order cards/rows deep-link to detail pages
- status labels are understandable

## 7.2 Order Detail
**Route:** `/account/orders/:id`

### Purpose
Show the detailed order breakdown.

### API dependencies
- `GET /purchase-history-details/{id}`
- `GET /purchase-history-items/{id}`
- `GET /invoice/download/{id}`
- `GET /re-order/{id}`
- optional `GET /order/cancel/{id}` if supported

### UX modules
- order summary header
- item list
- totals
- shipping/delivery summary
- payment summary
- reorder action
- invoice download
- cancellation action when legally/operationally allowed

### Acceptance criteria
- details are internally consistent
- invoice download is clearly available where supported
- reorder is explicit and safe
- cancellation is guarded by status/business rules

---

## 8. Address Book

**Route:** `/account/addresses`

## Purpose
Allow customers to manage delivery addresses.

## API dependencies
- `GET /user/shipping/address`
- `POST /user/shipping/create`
- `POST /user/shipping/update`
- `POST /user/shipping/make_default`
- `GET /user/shipping/delete/{id}`

## UX modules
- address list
- add new address CTA
- address editor
- set default control
- delete action
- default badge

## Responsive behavior
### Mobile
- address cards stacked vertically
- add/edit form via modal, sheet, or inline section

### Desktop
- two-column cards or list with action rail
- inline editor or side panel

## Acceptance criteria
- customer can create, edit, delete, and set default addresses
- validation errors are shown per field
- checkout can reuse the same address contract

---

## 9. Profile Area

**Route:** `/account/profile`

## Purpose
Provide a place to manage customer identity details supported by the API contract.

## Current note
The current storefront SDK exposes `currentUser`, but full profile update endpoints are not yet represented in the SDK. This route should be scoped to supported API capabilities only.

## Modes
### Read-only initial mode
- name
- email
- phone
- avatar where available

### Editable mode (when API is confirmed)
- editable fields
- validation
- save confirmation
- conflict handling

---

## 10. Wishlist

**Route:** `/wishlist`

## API dependencies
- `GET /wishlists`
- `GET /wishlists-add-product/{slug}`
- `GET /wishlists-remove-product/{slug}`
- `GET /wishlists-check-product/{slug}`

## Purpose
Let the customer save and revisit products.

## UX modules
- wishlist list/grid
- remove action
- move/add to cart
- empty state with discovery CTA

## Acceptance criteria
- only authenticated users can access it
- wishlist status is consistent with PDP actions
- removing an item updates list state correctly

---

## 11. Password Recovery (Optional but Recommended)

## Forgot password
- `POST /auth/password/forget_request`

## Reset password
- `POST /auth/password/confirm_reset`

### Purpose
Reduce support dependency and improve customer recovery.

---

## 12. Session and Security Behavior

## Required rules
- clear invalid tokens on 401
- do not show protected content while auth state is unresolved
- protect account routes from unauthenticated access
- after logout, clear account-sensitive cached state
- do not expose stale personal information after logout

## Nice-to-have improvements
- token refresh or silent session revalidation pattern
- account-wide logout confirmation
- better concurrent-session handling

---

## 13. Navigation Model

## Mobile
- account home with linked sections
- simple tabbed or stacked navigation
- minimal nesting

## Desktop
- left-side account navigation
- content panel on right
- persistent context

### Suggested nav items
- Dashboard
- Orders
- Addresses
- Wishlist
- Profile
- Logout

---

## 14. Analytics and Support Signals

Track customer interactions like:
- login success/failure
- registration success/failure
- order detail viewed
- invoice download
- reorder clicked
- address added/edited/deleted
- wishlist add/remove

Keep these as behavioral signals only; backend remains source of truth for customer data.

---

## 15. Acceptance Criteria

The account area is ready when:
1. protected route behavior is clear;
2. login and registration flows are defined;
3. dashboard scope is defined;
4. order history and order detail are defined;
5. address management is defined;
6. wishlist behavior is defined;
7. profile scope is defined;
8. session invalidation behavior is defined;
9. responsive account navigation is defined.
