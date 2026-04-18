# Content, Settings, Navigation, and SEO Wiring Specification

## Objective

Wire all non-catalog storefront concerns that are currently still hardcoded or partially connected.

## A. Business settings and branding

### Current state
- `contentApi.businessSettings()` exists
- `useBusinessSettings()` hook exists
- Header/footer do not consume it
- Header logo is hardcoded as `Store`
- Footer branding is generic

### Required wiring
Use business settings for:
- store name
- logo
- default currency symbol/code display helpers
- support email/phone if available
- legal/trademark footer text

## B. Navigation

### Current state
- `Header.tsx` desktop and mobile navigation is hardcoded
- no menu API/config is consumed

### Required wiring
Move navigation ownership to backend-driven configuration or a documented static contract.

At minimum define:
- primary nav items
- footer nav groups
- visibility flags
- ordering
- category shortcut behavior

## C. Footer

### Current state
Static links include:
- `/categories`
- `/brands`
- `/flash-deals`
- `/best-selling`
- `/account`
- `/account/orders`
- `/wishlist` ← route mismatch today
- `/track-order` ← missing route today
- `/blog`
- `/sellers`
- `/page/about-us` ← missing route today
- `/page/contact` ← missing route today
- policy links

### Required wiring
- replace static link set with a backend-driven or centrally configured footer model
- remove or implement broken destinations
- use policy/custom-page slugs from backend

## D. Generic CMS pages

### Current state
- blog pages are wired
- policy pages are wired
- generic custom pages like About/Contact are not wired

### Required wiring
Add a generic page system:
- route: `/page/:slug`
- API: page-by-slug endpoint or equivalent adapter
- SEO title/description support
- render HTML body safely
- 404 handling for missing pages

## E. Localization

### Current state
- languages and currencies APIs exist
- no selectors or app-state usage exists

### Required decision
If multi-language / multi-currency is in scope:
- add selectors
- persist selection
- ensure all prices respect currency policy
- update URL/query/storage strategy

If not in scope now:
- remove the options from current delivery scope and document them as future work

## F. SEO and structured metadata

### Current state
- `useSeoMeta()` is used on key pages
- no evidence of full canonical strategy
- no evidence of JSON-LD implementation
- robots/sitemap ownership is still tied to backend/public setup

### Required wiring
Implement:
- canonical URLs per route type
- product schema JSON-LD
- category listing schema where appropriate
- blog/article schema
- org/site metadata defaults
- public sitemap ownership after cutover

## Acceptance criteria

- Header/footer branding comes from backend settings or an approved configuration layer
- No footer/header link points to a missing route
- Generic custom pages are supported or removed from navigation
- SEO metadata is consistent across public route types
- Localization scope is explicitly implemented or explicitly deferred
