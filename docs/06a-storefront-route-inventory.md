# 06a — Storefront Route Inventory

## 1. Purpose

This document is the source of truth for the **customer-facing storefront route map** for Step 3.

It does four things:

1. lists the routes already implemented in the decoupled React storefront,
2. lists the routes already linked in navigation/components but not yet implemented,
3. maps each route to its ownership, API dependencies, auth posture, and SEO expectations,
4. defines the execution priority for completing the storefront route layer on top of the headless commerce core.

This document covers the **storefront only**. It does not include admin routes, seller dashboard routes, or backend API routes.

---

## 2. Scope

### Included
- public customer discovery routes
- product browsing routes
- cart and checkout-facing routes
- customer account routes
- content / CMS / policy routes
- route gaps visible in header, footer, page links, and redirect flows

### Excluded
- Laravel web routes
- seller panel routes
- admin panel routes
- internal API endpoint inventory

---

## 3. Current Status Summary

### Implemented in router
The current React router explicitly implements **9 routes**:

1. `/`
2. `/categories`
3. `/category/:slug`
4. `/brands`
5. `/brand/:slug`
6. `/search`
7. `/product/:slug`
8. `/cart`
9. `/login`

### Linked in UI but not yet implemented in router
The current storefront code links to additional customer-facing routes that are **not yet present in the router**:

1. `/flash-deals`
2. `/flash-deal/:slug`
3. `/best-selling`
4. `/featured`
5. `/wishlist`
6. `/account`
7. `/account/orders`
8. `/track-order`
9. `/blog`
10. `/sellers`
11. `/page/:slug`
12. `/policy/:type`
13. `/forgot-password`
14. `/register`
15. `/checkout`

### Conclusion
The storefront shell is implemented for the **Phase C baseline** (discovery + product detail + cart + login), but the full route surface required for a launch-ready generic storefront still needs to be completed.

---

## 4. Route Ownership Rules

### Storefront-owned
The storefront owns:
- route definitions
- page composition
- layout behavior
- route guards
- responsive rendering
- loading, empty, and error states
- SEO metadata and structured data rendering
- adapter logic needed to consume legacy and normalized backend responses

### Backend-owned
The backend owns:
- catalog data
- authentication and session/token logic
- pricing, variants, stock, cart, coupons, shipping, checkout, orders
- blogs, banners, flash deals, business settings, policies, and content data
- capability flags

---

## 5. Canonical Route Inventory

## 5.1 Group A — Discovery Routes

| Route | Status | Page Type | Auth | Primary Purpose | Main API Dependencies | SEO Priority |
|---|---|---|---|---|---|---|
| `/` | Implemented | Home | Public | Entry point for discovery and merchandising | sliders, featured categories, flash deals, featured products, best sellers, today's deals | High |
| `/categories` | Implemented | Category index | Public | Browse all product categories | categories | High |
| `/category/:slug` | Implemented | Category listing (PLP) | Public | Browse products for a category | category info, products by category | High |
| `/brands` | Implemented | Brand index | Public | Browse all brands | brands | Medium |
| `/brand/:slug` | Implemented | Brand listing (PLP) | Public | Browse products for a brand | products by brand | High |
| `/search` | Implemented | Search results | Public | Keyword search and sort | product search | High |
| `/flash-deals` | Planned | Deal index | Public | List all flash deals | flash deals | High |
| `/flash-deal/:slug` | Planned | Deal detail / deal PLP | Public | View a specific flash deal and its products | flash deal info, flash deal products | High |
| `/best-selling` | Planned | Merchandising collection | Public | Dedicated best-selling collection page | best-seller products | Medium |
| `/featured` | Planned | Merchandising collection | Public | Dedicated featured product collection page | featured products | Medium |
| `/sellers` | Planned | Seller index | Public | Browse all sellers/shops | seller/shop APIs | Medium |
| `/seller/:slug` or `/shop/:slug` | Planned | Seller storefront | Public | View a specific seller storefront | seller/shop info, seller products | Medium |
| `/blog` | Planned | Blog index | Public | Content discovery for SEO and education | blog list | Medium |
| `/blog/:slug` | Planned | Blog detail | Public | Blog content detail page | blog details | Medium |

### Notes
- `/best-selling` and `/featured` can be implemented either as dedicated routes or as collection pages backed by canonical merchandising queries.
- Seller route naming should be finalized before implementation. Choose one convention and keep it stable.

---

## 5.2 Group B — Consideration Routes

| Route | Status | Page Type | Auth | Primary Purpose | Main API Dependencies | SEO Priority |
|---|---|---|---|---|---|---|
| `/product/:slug` | Implemented | Product detail page (PDP) | Public | Product evaluation and add-to-cart | product detail, reviews, variant price, wishlist check | Very High |
| `/wishlist` | Planned | Wishlist index | Auth | Saved products for later purchase | wishlist list, wishlist remove | Low |
| `/track-order` | Planned | Order tracking | Public or semi-public | Public order status lookup | tracking endpoint / order lookup | Medium |

### Notes
- Product detail should become the canonical route for product SEO, schema, canonical URL, and image indexing.
- Wishlist should support graceful unauthenticated prompts if product save is attempted before login.

---

## 5.3 Group C — Conversion Routes

| Route | Status | Page Type | Auth | Primary Purpose | Main API Dependencies | SEO Priority |
|---|---|---|---|---|---|---|
| `/cart` | Implemented | Cart | Public + Auth-aware | Review items before checkout | cart list, cart summary, cart count, change quantity, remove | Noindex |
| `/checkout` | Planned | Checkout | Auth-preferred / guest if allowed | Delivery, coupon, payment, order placement | delivery info, shipping cost, coupon apply/remove, payment types, create order, payment initiation | Noindex |
| `/checkout/success` | Planned | Order confirmation | Auth or session scoped | Post-order success state | order summary / confirmation | Noindex |
| `/checkout/failure` | Planned | Payment failure state | Auth or session scoped | Failed payment recovery path | payment status / retry options | Noindex |

### Notes
- The current cart page already links to `/checkout`, so this is an active route gap.
- Payment-specific subroutes should only be introduced if the payment flow requires redirect return URLs.

---

## 5.4 Group D — Account & Identity Routes

| Route | Status | Page Type | Auth | Primary Purpose | Main API Dependencies | SEO Priority |
|---|---|---|---|---|---|---|
| `/login` | Implemented | Login | Public | Customer sign-in | auth login, current user | Noindex |
| `/register` | Planned | Registration | Public | Customer account creation | auth signup, social login | Noindex |
| `/forgot-password` | Planned | Password recovery request | Public | Start password reset | forgot password | Noindex |
| `/reset-password` | Planned | Password reset form | Public | Complete reset using verification code | reset password | Noindex |
| `/account` | Planned | Account dashboard | Auth | Entry point for logged-in customer | current user, purchase history, addresses, wishlist summary | Noindex |
| `/account/orders` | Planned | Order history | Auth | List customer orders | purchase history | Noindex |
| `/account/orders/:id` | Planned | Order detail | Auth | View order detail and items | purchase history details, purchase history items, invoice download, reorder | Noindex |
| `/account/profile` | Planned | Profile settings | Auth | Account profile maintenance | current user / profile endpoints | Noindex |
| `/account/addresses` | Planned | Address book | Auth | Manage shipping addresses | address list, create, update, make default, delete | Noindex |

### Notes
- `/register` and `/forgot-password` are already referenced by the login page and therefore should be prioritized.
- `account` routes require a route guard and a consistent unauthorized redirect pattern.

---

## 5.5 Group E — Content, CMS, and Trust Routes

| Route | Status | Page Type | Auth | Primary Purpose | Main API Dependencies | SEO Priority |
|---|---|---|---|---|---|---|
| `/page/:slug` | Planned | Generic CMS page | Public | Static pages such as About Us, Contact | business settings / page content API | Medium |
| `/policy/:type` | Planned | Policy page | Public | Terms, privacy, return, seller policy | policies | Medium |

### Required policy values
Recommended `:type` values for storefront routing:
- `terms`
- `privacy`
- `return`
- `seller`
- `support` (optional)

### Notes
- Footer links already assume page and policy routing exists.
- `about-us` and `contact` should resolve through a generic CMS page route unless a separate design requires dedicated page components.

---

## 6. Implemented Route Details

## 6.1 `/`
**Status:** Implemented  
**Role:** Home / discovery  
**Primary APIs:** sliders, featured categories, flash deals, today's deals, featured products, best sellers  
**Key UX concerns:** hero banner, category shortcuts, merchandising sections  
**SEO:** title, meta description, homepage schema, crawlable sections

## 6.2 `/categories`
**Status:** Implemented  
**Role:** Category index  
**Primary APIs:** categories  
**Key UX concerns:** category cards, loading state, responsive grid  
**SEO:** category hub page

## 6.3 `/category/:slug`
**Status:** Implemented  
**Role:** Category PLP  
**Primary APIs:** category info, products by category  
**Key UX concerns:** pagination, sort, filter expansion in later phase  
**SEO:** indexable category listing

## 6.4 `/brands`
**Status:** Implemented  
**Role:** Brand index  
**Primary APIs:** brands  
**Key UX concerns:** logo grid, alphabetical grouping optional in later phase  
**SEO:** secondary discovery page

## 6.5 `/brand/:slug`
**Status:** Implemented  
**Role:** Brand PLP  
**Primary APIs:** products by brand  
**Key UX concerns:** sort, pagination, brand hero optional later  
**SEO:** indexable brand listing

## 6.6 `/search`
**Status:** Implemented  
**Role:** Search results page  
**Primary APIs:** product search  
**Key UX concerns:** keyword query state, sort, pagination, empty state  
**SEO:** usually noindex or limited indexing policy depending on strategy

## 6.7 `/product/:slug`
**Status:** Implemented  
**Role:** Product detail page  
**Primary APIs:** product detail, reviews, cart add, cart count  
**Key UX concerns:** image gallery, variant selection, pricing, review rendering, stock state  
**SEO:** highest-value indexable commerce page

## 6.8 `/cart`
**Status:** Implemented  
**Role:** Cart page  
**Primary APIs:** cart list, cart summary, remove item, change quantity, cart count  
**Key UX concerns:** grouped cart items, quantity controls, summary, checkout CTA  
**SEO:** noindex

## 6.9 `/login`
**Status:** Implemented  
**Role:** Authentication entry point  
**Primary APIs:** login, current user  
**Key UX concerns:** validation, redirect after login, clear error handling  
**SEO:** noindex

---

## 7. Route Gaps Already Visible in the UI

These are links or navigational expectations already present in the storefront code but missing from the router.

| Route | Where it is referenced | Why it matters |
|---|---|---|
| `/flash-deals` | Home, Header, Footer | active merchandising gap |
| `/flash-deal/:slug` | Home | detail route required for flash deal cards |
| `/best-selling` | Header, Footer | merchandising collection route missing |
| `/featured` | Header | merchandising collection route missing |
| `/wishlist` | Header, Footer | wishlist journey incomplete |
| `/account` | Header, Footer | logged-in customer destination missing |
| `/account/orders` | Footer | order history destination missing |
| `/track-order` | Footer | trust and post-purchase feature missing |
| `/blog` | Header, Footer | content/SEO route missing |
| `/sellers` | Header, Footer | marketplace discovery route missing |
| `/page/about-us` | Footer | CMS route missing |
| `/page/contact` | Footer | CMS route missing |
| `/policy/terms` | Footer | legal route missing |
| `/policy/privacy` | Footer | legal route missing |
| `/policy/return` | Footer | legal route missing |
| `/policy/seller` | Footer | legal route missing |
| `/forgot-password` | Login page | auth completion gap |
| `/register` | Login page | auth completion gap |
| `/checkout` | Cart page | checkout completion gap |

---

## 8. Recommended Delivery Waves

## Wave 1 — Complete critical journey gaps
Implement first:
- `/register`
- `/forgot-password`
- `/checkout`
- `/account`
- `/account/orders`
- `/account/addresses`

Reason: these close the essential customer purchase and retention journey.

## Wave 2 — Complete merchandising and growth routes
Implement next:
- `/flash-deals`
- `/flash-deal/:slug`
- `/best-selling`
- `/featured`
- `/wishlist`
- `/track-order`

Reason: these improve merchandising, conversion, and post-purchase trust.

## Wave 3 — Complete marketplace and content routes
Implement after core funnel completion:
- `/blog`
- `/blog/:slug`
- `/sellers`
- `/seller/:slug` or `/shop/:slug`
- `/page/:slug`
- `/policy/:type`

Reason: these improve discoverability, SEO depth, marketplace scale, and content completeness.

---

## 9. Routing Standards

### 9.1 Naming rules
- use lowercase paths
- use hyphenated slugs
- avoid duplicate semantic routes for the same page type
- choose one seller route convention and keep it stable

### 9.2 Auth guard rules
- public routes must not block rendering when no token exists
- auth-only routes must redirect unauthenticated users to `/login`
- after login, user should be returned to the original intended route when possible

### 9.3 SEO rules
- indexable routes: home, categories, category pages, brands, brand pages, product pages, blog pages, CMS pages, policy pages if desired
- noindex routes: cart, checkout, login, register, forgot-password, account pages
- search indexing policy should be explicitly decided

### 9.4 Error handling rules
Each route must support:
- loading state
- empty state
- not found state where relevant
- API error fallback
- mobile and desktop responsive layout

---

## 10. Acceptance Criteria for Route Inventory Completion

The storefront route inventory is considered complete when:

1. all existing router routes are documented,
2. all UI-linked-but-missing routes are documented,
3. every route has a status of implemented, planned, blocked, or deferred,
4. every route is mapped to its API dependency set,
5. auth posture is defined for each route,
6. SEO posture is defined for each route,
7. the delivery sequence is agreed for implementation waves.

---

## 11. Immediate Next Actions

1. finalize the canonical route list in this document,
2. decide whether seller storefront routes are `/seller/:slug` or `/shop/:slug`,
3. implement Wave 1 routes first,
4. add route-level SEO metadata handling for all indexable pages,
5. keep this document updated whenever a route is added, renamed, or retired.

---

## 12. Suggested Companion Documents

This document should be used together with:
- `07-step3-responsive-storefront-execution.md`
- `06-pre-step3-readiness-gates.md`
- `04a-api-domain-inventory.md`
- `04k-storefront-consumer-integration-guide.md`

