# 06b — Storefront Page Specifications

## Document Purpose

This document defines the page-level functional specification for the responsive storefront that consumes the generic headless commerce core.

It serves four purposes:

1. define the customer-facing pages required for Step 3;
2. separate **currently implemented** pages from **planned** pages;
3. define the expected behavior, API dependencies, SEO posture, and responsive expectations per page;
4. provide a common execution reference for design, frontend, QA, and API consumers.

This document assumes:

- Step 1 is complete: storefront is decoupled from the backend;
- Step 2 is in place: the commerce core exposes a usable headless API contract;
- the storefront consumes the API through the `storefront/src/api/` SDK layer;
- the current route base is defined in `storefront/src/router.tsx`.

---

## Scope Split

### In scope
- discovery pages
- consideration pages
- conversion pages
- account and retention pages
- content and trust pages
- responsive behavior
- SEO posture
- data dependencies
- acceptance criteria

### Out of scope
- final visual branding for any specific client
- admin panel behavior
- seller panel behavior
- backend implementation details not visible to storefront consumers
- CDN and caching mechanics (covered separately in Step 4 / performance docs)

---

## Page Inventory Summary

### Currently implemented in the storefront
- `/`
- `/categories`
- `/category/:slug`
- `/brands`
- `/brand/:slug`
- `/search`
- `/product/:slug`
- `/cart`
- `/login`

### Planned as the next delivery waves
- `/register`
- `/checkout`
- `/checkout/payment`
- `/checkout/success`
- `/checkout/failure`
- `/account`
- `/account/orders`
- `/account/orders/:id`
- `/account/addresses`
- `/account/profile`
- `/wishlist`
- `/flash-deals`
- `/flash-deals/:slug`
- `/seller/:id` or `/shop/:slug`
- `/blog`
- `/blog/:slug`
- `/policies/:type`
- `/track-order`

---

# 1. Discovery Pages

## 1.1 Home Page

**Route:** `/`  
**Current status:** Implemented

### Purpose
The home page is the default entry point into the storefront. It should surface:
- homepage category shortcuts,
- selected merchandising collections,
- featured promotions,
- trust cues,
- quick paths into deeper catalog pages.

### Current data dependencies
- categories
- featured products
- best seller products
- today’s deals
- banners
- sliders
- capability flags
- business settings (optional)

### API dependencies
- `GET /categories/home`
- `GET /products/featured`
- `GET /products/best-seller`
- `GET /products/todays-deal`
- `GET /banners`
- `GET /sliders`
- `GET /capabilities`

### Primary UX blocks
- hero/banner area
- category shortcuts
- featured collections
- merchandising sections
- product cards grid
- newsletter / conversion teaser
- footer trust links

### Responsive behavior
**Mobile**
- stacked sections
- swipe-friendly promotional modules
- 2-column product grids where viable

**Tablet**
- multi-card merchandising rows
- wider content gutters
- image-first layout blocks

**Desktop**
- strong hero section
- multi-column merchandising layout
- quick access into categories/brands
- optional promotional rail blocks

### SEO posture
- indexable
- static title and dynamic metadata from settings/content APIs
- structured homepage metadata optional
- canonical route `/`

### Acceptance criteria
- page loads without requiring authentication
- if merchandising APIs fail, categories and products still render independently
- if banners/sliders are unavailable, page remains functional
- home page supports mobile, tablet, and desktop layouts
- hero, category, and product modules are keyboard accessible

---

## 1.2 Categories Listing Page

**Route:** `/categories`  
**Current status:** Implemented

### Purpose
List all catalog categories and provide a directory into the catalog taxonomy.

### API dependencies
- `GET /categories`

### UX blocks
- page title
- category grid/list
- category image/icon
- category name
- category deep link

### Responsive behavior
- 2-column mobile grid minimum
- richer category card layout on desktop
- consistent click target size

### SEO posture
- indexable
- category directory metadata
- canonical `/categories`

### Acceptance criteria
- all active categories render
- cards link to category detail/listing page
- missing images fall back gracefully
- page remains usable even if category count is large

---

## 1.3 Category Product Listing Page

**Route:** `/category/:slug`  
**Current status:** Implemented

### Purpose
Show products under a selected category and allow sorting and paging.

### Current data dependencies
- category info
- products by category
- optional sub-categories
- optional filters (future enhancement)

### API dependencies
- `GET /category/info/{slug}`
- `GET /products/category/{slug}`

### Current implemented behavior
- reads `page` query param
- reads `sort_by` query param
- renders paginated product grid
- renders category title from slug / category info

### Planned enhancements
- filter panel
- breadcrumbs
- sub-category chips
- applied filters summary
- empty state recommendations

### Responsive behavior
**Mobile**
- stacked title + sort control
- future filters open in drawer

**Desktop**
- left filter rail or top filter bar
- richer pagination and merchandising support

### SEO posture
- indexable
- title/meta from category info
- canonical should include slug path only and exclude transient sort/page from canonical

### Acceptance criteria
- slug-based route loads the right category data
- sort and page params update the listing
- loading and empty states are present
- failed category lookup returns a not-found-friendly state
- pagination preserves the route context

---

## 1.4 Brands Listing Page

**Route:** `/brands`  
**Current status:** Implemented

### Purpose
Provide a brand directory so customers can browse by manufacturer or label.

### API dependencies
- `GET /brands`

### UX blocks
- page header
- brand logo grid
- brand name
- link to brand listing page

### Responsive behavior
- compact grid on mobile
- larger cards on desktop
- lazy-loaded brand logos

### SEO posture
- indexable
- canonical `/brands`

### Acceptance criteria
- all brands render as links
- missing logos do not break the layout
- loading skeleton is visible while data resolves

---

## 1.5 Brand Product Listing Page

**Route:** `/brand/:slug`  
**Current status:** Implemented

### Purpose
Show all products for a selected brand.

### API dependencies
- `GET /products/brand/{slug}`

### Implemented behavior
- `page` query param support
- `sort_by` query param support
- pagination buttons
- product count display

### Planned enhancements
- brand info header
- brand logo / description
- richer sorting options
- filter side panel
- cross-links to categories

### Responsive behavior
Same general behavior as category listing pages.

### SEO posture
- indexable
- canonical based on slug path
- sort/page excluded from canonical

### Acceptance criteria
- listing renders based on brand slug
- sort and page changes are reflected
- pagination is stable and usable on mobile and desktop

---

## 1.6 Search Results Page

**Route:** `/search`  
**Current status:** Implemented

### Purpose
Support catalog discovery through keyword search, optional category context, sorting, and paging.

### API dependencies
- `GET /products/search`

### Current implemented behavior
- query param-driven search
- paginated result rendering
- sort handling

### Planned enhancements
- search suggestions
- recent searches
- no-result recovery recommendations
- spelling tolerance
- merchandising rules

### Responsive behavior
- search input remains primary interaction element
- mobile search bar must be easy to access from header
- desktop can support inline filters and sort controls

### SEO posture
- **not intended as a primary index page**
- should generally use `noindex, follow` for arbitrary keyword searches
- canonical should avoid preserving user-entered query strings as canonical targets

### Acceptance criteria
- empty query returns a safe default state
- results render for valid queries
- pagination preserves current search term
- sort changes keep the search context
- page does not crash on zero results

---

# 2. Consideration Pages

## 2.1 Product Detail Page (PDP)

**Route:** `/product/:slug`  
**Current status:** Implemented

### Purpose
Provide the customer with all information needed to evaluate and buy a product.

### Current data dependencies
- product detail
- variant price calculation
- reviews
- wishlist state (future enhancement)
- related/recommended products (future enhancement)

### API dependencies
- `GET /products/{slug}/{userId}`
- `POST /products/variant/price`
- `GET /reviews/product/{productId}`

### Implemented behavior
- image gallery
- variant selectors
- quantity
- add-to-cart
- review display
- price handling

### Planned enhancements
- sticky purchase bar on mobile
- recommended products
- breadcrumb trail
- shipping and returns info blocks
- structured delivery/promises modules
- richer media gallery
- seller/shop card
- trust badges
- recently viewed

### Responsive behavior
**Mobile**
- image-first layout
- sticky buy box or bottom action bar
- touch-friendly variant controls

**Desktop**
- two-column layout
- gallery on the left, buy box on the right
- extended product description and trust modules

### SEO posture
- high-priority indexable page
- unique title, description, product metadata
- canonical route based on slug
- product structured data recommended
- image alt strategy required

### Acceptance criteria
- page resolves correct product by slug
- variant changes update calculated price where supported
- add-to-cart works for valid quantities and selected variant state
- out-of-stock state is visible and actionable
- page loads gracefully when optional content is unavailable
- SEO metadata is present and not duplicated

---

# 3. Conversion Pages

## 3.1 Cart Page

**Route:** `/cart`  
**Current status:** Implemented

### Purpose
Summarize cart contents and enable quantity changes, removal, and progression to checkout.

### API dependencies
- `POST /carts`
- `POST /cart-summary`
- `POST /cart-count`
- `POST /carts/change-quantity`
- `DELETE /carts/{id}`
- `POST /carts/process`

### Implemented behavior
- grouped cart rendering
- quantity controls
- removal
- summary block
- empty cart state

### Planned enhancements
- coupon module
- save for later
- shipping estimate preview
- cross-sell recommendations
- guest checkout CTA
- split seller/order explanation where relevant

### Responsive behavior
**Mobile**
- stacked line items
- sticky summary CTA optional

**Desktop**
- two-column layout with persistent summary
- wider item detail row

### SEO posture
- not indexable
- noindex
- no public crawling value

### Acceptance criteria
- cart groups load after page entry
- quantity updates refresh cart and summary
- item removal refreshes totals and count
- empty state is user-friendly
- guests and logged-in customers follow the correct next-step behavior

---

## 3.2 Checkout Page

**Route:** `/checkout`  
**Current status:** Planned

### Purpose
Collect shipping, billing, delivery, coupon, and order placement details in a conversion-optimized sequence.

### Dependencies
- addresses
- delivery info
- shipping cost
- coupon state
- payment types
- order creation
- capabilities

### Core modules
- authentication / guest state
- delivery address selection
- shipping method / seller shipment grouping
- order review
- coupon application
- payment selection
- order placement

### Responsive behavior
- single-column stepped experience on mobile
- two-column review + input layout on desktop

### SEO posture
- private transactional route
- noindex

### Acceptance criteria
- invalid address or shipping inputs are blocked
- customer can review totals before order creation
- payment options reflect backend capabilities
- order submission is idempotent or safely retryable from frontend UX

---

## 3.3 Checkout Result Pages

**Routes**
- `/checkout/success`
- `/checkout/failure`
- `/checkout/pending`

**Current status:** Planned

### Purpose
Present the post-payment or post-order state clearly and direct the customer toward the next valid action.

### Acceptance criteria
- success page confirms order reference and next steps
- failure page explains retry options
- pending page explains asynchronous verification where applicable

---

# 4. Retention and Account Pages

## 4.1 Login Page

**Route:** `/login`  
**Current status:** Implemented

### Purpose
Authenticate returning customers.

### API dependencies
- `POST /auth/login`
- `GET /auth/user`

### Implemented behavior
- email/password form
- zod validation
- token persistence
- auth state update

### Planned enhancements
- forgot password
- social login
- redirect-to-intended-route
- inline field-level API error handling
- registration cross-link
- guest merge/cart merge behavior

### Responsive behavior
- centered form on desktop
- full-width card layout on mobile

### SEO posture
- noindex

### Acceptance criteria
- validation errors are shown
- bad credentials return a usable error message
- token is persisted safely according to current app model
- authenticated users are redirected appropriately

---

## 4.2 Registration Page

**Route:** `/register`  
**Current status:** Planned

### Purpose
Create a new customer account.

### API dependencies
- `POST /auth/signup`

### Acceptance criteria
- registration fields are validated
- success state transitions customer into an authenticated or next-verification path
- duplicate email/phone errors are clear

---

## 4.3 Account Dashboard

**Route:** `/account`  
**Current status:** Planned

### Purpose
Provide a landing page for customer self-service.

### Core blocks
- recent orders
- account details
- address shortcuts
- wishlist shortcut
- support/policies quick links

---

## 4.4 Orders Listing and Details

**Routes**
- `/account/orders`
- `/account/orders/:id`

**Current status:** Planned

### API dependencies
- `GET /purchase-history`
- `GET /purchase-history-details/{id}`
- `GET /purchase-history-items/{id}`
- `GET /invoice/download/{id}`
- `GET /re-order/{id}`

### Acceptance criteria
- orders list is paginated or grouped clearly
- order details reconcile with checkout/order states
- invoice download works on supported browsers
- reorder behavior is safe and explicit

---

## 4.5 Address Book

**Route:** `/account/addresses`  
**Current status:** Planned

### API dependencies
- `GET /user/shipping/address`
- `POST /user/shipping/create`
- `POST /user/shipping/update`
- `POST /user/shipping/make_default`
- `GET /user/shipping/delete/{id}`

### Acceptance criteria
- customer can list, create, edit, delete, and set default addresses
- invalid address data is rejected with field-specific messaging

---

## 4.6 Profile Page

**Route:** `/account/profile`  
**Current status:** Planned

### Purpose
Display and update customer profile information within the supported API contract.

---

## 4.7 Wishlist

**Route:** `/wishlist`  
**Current status:** Planned

### API dependencies
- `GET /wishlists`
- `GET /wishlists-add-product/{slug}`
- `GET /wishlists-remove-product/{slug}`
- `GET /wishlists-check-product/{slug}`

### Acceptance criteria
- wishlist is only visible to authenticated users
- add/remove/check flows remain consistent across PDP and account views

---

# 5. Content and Trust Pages

## 5.1 Flash Deals

**Routes**
- `/flash-deals`
- `/flash-deals/:slug`

**Current status:** Planned

### API dependencies
- `GET /flash-deals`
- `GET /flash-deals/info/{slug}`
- `GET /flash-deal-products/{id}`

---

## 5.2 Blog

**Routes**
- `/blog`
- `/blog/:slug`

**Current status:** Planned

### API dependencies
- `GET /blog-list`
- `GET /blog-details/{slug}`

### SEO posture
- indexable
- article metadata
- structured data recommended

---

## 5.3 Policies / Static Trust Pages

**Route pattern:** `/policies/:type`  
**Current status:** Planned

### API dependencies
- `GET /policies/{type}`

### Examples
- privacy policy
- terms
- seller policy
- return policy
- support policy

---

## 5.4 Order Tracking

**Route:** `/track-order`  
**Current status:** Planned

### Purpose
Provide public or semi-public order tracking where the backend supports it.

---

# 6. Route Priority Waves

## Wave A — Already delivered
- Home
- Categories
- Category listing
- Brands
- Brand listing
- Search
- PDP
- Cart
- Login

## Wave B — Immediate next
- Register
- Flash deals
- Blog
- Wishlist
- seller/shop listing page

## Wave C — Conversion critical
- Checkout
- Payment result pages
- coupon interactions on checkout/cart
- guest vs authenticated checkout state

## Wave D — Retention / self-service
- Account dashboard
- Orders
- Order detail
- Addresses
- Profile

## Wave E — Trust and support
- Policies
- Order tracking
- support/help entry points

---

# 7. Cross-Cutting Rules

## Authentication
- discovery and consideration routes must be publicly accessible unless explicitly protected
- account, wishlist, address, and order routes require authentication
- checkout may support guest or authenticated entry depending on capabilities

## Error handling
Every route must define:
- loading state
- empty state
- recoverable API failure state
- not found state where relevant
- authentication failure behavior where relevant

## SEO
Each route must explicitly define:
- index or noindex
- canonical logic
- title/meta source
- structured data requirement
- open graph priority where relevant

## Accessibility
Each route must support:
- keyboard traversal
- sufficient color contrast
- alt text for images
- focus-visible interactions
- semantic heading structure

---

# 8. Definition of Done for Page Specifications

A page is considered specification-complete when:
1. route is named and prioritized;
2. purpose and customer outcome are documented;
3. required APIs are identified;
4. auth posture is clear;
5. SEO posture is clear;
6. responsive expectations are defined;
7. acceptance criteria are listed;
8. fallback/error states are documented.

---

# 9. Implementation Note

This document is intentionally generic so the same storefront system can serve:
- cosmetics
- lens / optical
- wellness
- gifting
- other consumer catalog verticals

Branding, theme packs, merchandising configuration, and vertical-specific blocks should be layered on top of these page specifications, not mixed into the core page contract.
