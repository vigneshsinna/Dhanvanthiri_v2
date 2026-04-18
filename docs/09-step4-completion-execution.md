# Step 4 Completion Execution Guide

## Purpose

This document closes the gap between the current Step 4 foundation and a production-ready Step 4 implementation.

Step 4 is **not fully complete yet**. The project already includes:
- panel routing and layout structure
- role guards
- shared panel UI components
- initial performance middleware and monitoring utilities
- build chunking and hashed asset output

However, the current implementation is still missing the final operational work needed to call Step 4 complete.

## Current Reality

### Already implemented
- React panel routes for customer, seller, and admin areas
- `PanelLayout` and role-based wrappers
- account panel pages reusing Step 3 account pages
- seller panel shell and pages
- admin panel shell and pages
- Laravel-side caching middleware/utilities
- frontend production build output
- initial monitoring/performance utilities

### Not fully implemented yet
- admin pages still mostly placeholder screens
- seller panel still contains mock/static data in key pages
- panel navigation still uses hard browser navigation in multiple places
- error logging utility exists but is not wired into app bootstrap/runtime flow
- cache invalidation strategy exists as a concept but is not fully wired to entity updates
- image optimization and CDN strategy are not fully integrated into live rendering and upload flows
- no final Step 4 production acceptance checklist evidence is stored in docs

## Step 4 Completion Scope

Step 4 should be considered complete only when these 4 tracks are closed:

1. **Panel Functional Completion**
2. **Panel SPA Navigation Completion**
3. **Performance / Cache / CDN Integration Completion**
4. **Operational Verification & Production Readiness**

---

## Track 1 — Panel Functional Completion

### Goal
Replace panel placeholders and mock data with real API-backed functionality.

### 1.1 Admin panel completion
The following pages currently exist as shells and must be backed by real data and actions:
- Admin dashboard
- Admin products
- Admin orders
- Admin sellers
- Admin customers
- Admin promotions
- Admin settings

### Required deliverables
- live data queries for each page
- loading, empty, error, and success states
- filters, sorting, and pagination where applicable
- row actions wired to real endpoints
- permission-aware action visibility

### Minimum acceptance
- admin dashboard shows live summary metrics
- admin products shows real catalog data
- admin orders shows live order list and status actions
- admin sellers shows seller list and moderation status
- admin customers shows customer list and profile access
- admin promotions shows active promotion entities or explicit empty state
- admin settings shows at least read/update for core platform settings

### 1.2 Seller panel completion
The seller panel currently has usable structure, but key pages must stop using mock data.

Pages requiring real integration:
- seller dashboard
- seller products
- seller orders
- seller payouts
- seller shop settings

### Required deliverables
- replace all mock arrays with API-backed queries
- real CRUD for seller product operations where supported
- live seller order status and payout history
- real shop settings form with save feedback

### Minimum acceptance
- seller can view their own products from API
- seller can view their own orders from API
- seller can view payout history or a clearly stated unavailable state from API
- seller can update shop settings through API

### 1.3 Customer account panel completion
Customer panel reuses working account pages, but it still needs formal Step 4 closure.

### Required deliverables
- confirm all `/panel/account/*` routes work through SPA navigation
- confirm orders, wishlist, addresses, and profile work from panel entry points
- ensure panel layout does not break account flows or back navigation

---

## Track 2 — Panel SPA Navigation Completion

### Goal
Remove full page reload behavior from panel experience.

### Current issue
Several panel links still use:
- `<a href="...">`
- `window.location.href = ...`

This breaks SPA behavior, causes hard reloads, and weakens state continuity.

### Required changes
- replace panel sidebar navigation links with `NavLink` or `Link`
- replace logout hard redirect with store-driven logout flow + router navigation
- replace internal logo navigation with router navigation
- ensure mobile sidebar open/close state works without reloads

### Acceptance
- panel navigation does not perform full page reloads
- logout clears auth state and navigates cleanly
- route transitions preserve SPA behavior
- no internal panel path relies on hard browser navigation

---

## Track 3 — Performance, Caching, and CDN Completion

### Goal
Move from performance scaffolding to integrated optimization.

### 3.1 Frontend performance completion
#### Required actions
- route-level lazy loading for major page groups
- split panel bundles from storefront bundles
- split checkout/payment code paths separately
- confirm no oversized initial bundle for anonymous users

#### Acceptance
- homepage and discovery routes load without dragging panel/admin bundles
- checkout code loads only when needed
- largest entry chunks are reduced from current baseline

### 3.2 Error monitoring completion
#### Required actions
- wire `errorLogger` into app bootstrap
- capture React render errors through error boundary reporting
- capture API failures from central client interceptor
- attach route, user role, and environment metadata to logs

#### Acceptance
- frontend runtime errors are centrally reported
- API failures are visible through one monitoring path
- panel and storefront failures can be distinguished

### 3.3 Backend/API caching completion
#### Required actions
- define cache keys for:
  - homepage data
  - category listings
  - product detail responses
  - brand/seller listings
  - content pages
- wire invalidation after create/update/delete events
- tag or namespace cache by entity domain where possible
- prevent stale catalog rendering after admin updates

#### Acceptance
- cache is used for read-heavy endpoints
- admin/seller/catalog updates invalidate affected cache reliably
- stale data windows are understood and documented

### 3.4 CDN and asset delivery completion
#### Required actions
- move static frontend assets behind CDN
- define cache-control headers for JS/CSS/image assets
- define purge strategy for deploys
- ensure media URLs resolve correctly in storefront and panel
- define fallback for environments without CDN

#### Acceptance
- hashed frontend assets are CDN-cacheable
- media delivery is stable across environments
- production deploy has a repeatable cache purge strategy

### 3.5 Image optimization completion
#### Required actions
- define image variant sizes for listing, detail, banner, thumbnail
- ensure storefront uses optimized image sizes instead of full originals
- define lazy loading behavior for below-the-fold images
- confirm banner and product gallery assets are compressed appropriately

#### Acceptance
- product/category images do not ship raw oversized originals by default
- list/grid/detail views use appropriate image sizes

---

## Track 4 — Operational Verification and Production Readiness

### Goal
Create evidence that Step 4 is truly completed, not only coded.

### Required actions
- verify admin panel routes with authenticated admin user
- verify seller panel routes with authenticated seller user
- verify customer panel routes with authenticated customer user
- run production frontend build from clean install
- verify hashed assets and chunk output
- confirm panel navigation works without reloads
- confirm core cached endpoints behave correctly before/after updates
- confirm CDN/static asset headers in target deployment environment

### Required artifacts
- Step 4 completion report
- screenshots or route verification notes for all panel areas
- build output summary
- bundle summary
- cache invalidation verification notes
- CDN configuration note

---

## Execution Order

### Sprint / Wave A — Functionalize panels
1. Admin dashboard + products + orders
2. Seller products + orders + shop settings
3. Customer panel verification

### Sprint / Wave B — SPA polish
1. Remove `<a href>` and `window.location.href`
2. Clean logout flow
3. Route transition validation

### Sprint / Wave C — Performance integration
1. lazy loading
2. error logger wiring
3. bundle review
4. backend cache invalidation
5. image sizing
6. CDN configuration

### Sprint / Wave D — Operational closure
1. production-like verification
2. final QA checklist
3. Step 4 completion report

---

## Final Definition of Done for Step 4

Step 4 is complete only when all of the following are true:

- all panel pages are backed by real data or an explicitly supported unavailable-state contract
- seller/admin pages no longer depend on mock/static placeholder data
- all internal panel navigation is SPA-based
- runtime error logging is wired and observable
- route-level code splitting is implemented
- cache invalidation is wired to actual entity update flows
- CDN/static asset strategy is configured for deployment
- image delivery strategy is implemented
- clean production build and verification evidence are documented

If any of the above is missing, Step 4 should be treated as **in progress**, not complete.

## Recommended next artifact after implementation
Create:
- `09a-step4-completion-report.md`

That report should capture:
- what was changed
- what routes/pages were verified
- what performance improvements were measured
- what remains intentionally deferred
