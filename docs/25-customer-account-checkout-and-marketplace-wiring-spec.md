# Customer, Account, Checkout, and Marketplace Wiring Specification

## Objective

Close the remaining customer-journey and marketplace gaps between backend-managed data and the React storefront.

## A. Authentication and account

### Current status
- login, register, forgot password, reset password: wired
- current user/profile update: wired
- account dashboard, orders, addresses, profile: wired

### Remaining action
- verify post-login redirect behavior after public-site cutover
- verify auth/session persistence when React becomes public root
- verify account links in header/footer route correctly

## B. Wishlist

### Current status
- API support exists
- PDP toggle exists
- account wishlist page exists
- header/footer point to `/wishlist`, but router only exposes `/account/wishlist`

### Required fix
Choose one of:
1. add public route `/wishlist` that maps to wishlist page, or
2. update header/footer links to `/account/wishlist`

## C. Cart

### Current status
- fully wired for list, count, add, remove, quantity change, summary

### Required validation
- guest cart behavior
- merge cart on login if required
- seller-group cart edge cases

## D. Checkout

### Current status
- address → shipping → payment → review flow exists
- coupon apply/remove exists
- seller-group processing exists
- COD and wallet branches exist
- external redirect support exists

### Remaining gap
The backend still contains multiple legacy payment controllers and callback flows that assume Blade/public `route('home')`.

### Required work
- update each enabled gateway to redirect to React success/failure/account routes
- confirm callback security and order status sync
- verify webhook/callback parity per gateway

## E. Orders

### Current status
- purchase history and detail pages exist
- success/failure pages exist

### Remaining action
- expose reorder/invoice buttons if desired
- ensure order code/id mapping is stable for success screens and account pages

## F. Marketplace / sellers

### Current status
- seller listing page exists
- seller detail/shop page exists
- seller product tabs exist
- seller brands endpoint exists but is unused

### Required work
- decide whether seller brands should be rendered
- validate seller status/hide rules from admin
- validate shop banner/logo fallbacks

## G. Non-scope clarification

The React panel routes under:
- `/panel/admin/*`
- `/panel/seller/*`

are **not** the live Laravel admin/seller backoffice and should not be treated as completion of admin↔storefront wiring.

## Acceptance criteria

- full customer journey works on React storefront root domain
- no auth/account/wishlist/cart route mismatches remain
- enabled payment gateways return to React routes correctly
- seller listing and seller shop pages reflect admin-managed seller visibility and product data
