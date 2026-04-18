# 08 — Performance, Caching, and CDN Strategy

## Document Purpose

This document defines the performance and delivery strategy for the headless commerce platform after the storefront and API contract layers are stable.

It covers:
- storefront performance goals,
- API caching opportunities,
- asset strategy,
- CDN usage,
- image optimization,
- invalidation rules,
- observability and rollout guidance.

The aim is not only to make the storefront fast, but to make performance predictable across multiple client storefronts built on the same commerce core.

---

## 1. Performance Goals

The platform should aim for:

1. fast first render for key discovery pages;
2. fast product listing and PDP interactions;
3. responsive cart and checkout interactions;
4. stable asset delivery under traffic spikes;
5. cacheability of high-read, low-write data;
6. clear invalidation behavior.

---

## 2. Performance Layers

Think in layers:

1. **Frontend bundle and rendering**
2. **API request efficiency**
3. **backend application work**
4. **database/query efficiency**
5. **asset and image delivery**
6. **edge/CDN distribution**
7. **cache invalidation and freshness control**

Each layer should be designed intentionally.

---

## 3. Storefront Performance Priorities

## 3.1 Highest priority pages
- Home
- Category listing
- Brand listing
- Search
- Product detail page
- Cart
- Checkout

## 3.2 Highest priority interactions
- initial route load
- product image rendering
- filter/sort updates
- add to cart
- cart summary refresh
- checkout totals update
- payment handoff

---

## 4. Frontend Performance Strategy

## 4.1 Build and bundle hygiene
- use clean dependency installation in CI
- ensure reproducible production builds
- split route bundles by page group
- lazy-load non-critical routes
- keep large dependencies out of the landing bundle
- avoid shipping admin-only logic into storefront bundles

## 4.2 Rendering strategy
- defer non-critical homepage modules
- avoid blocking initial render with too many parallel non-essential calls
- prioritize above-the-fold content
- progressively load secondary sections

## 4.3 Asset strategy
- compress static assets
- fingerprint bundle files
- set long cache lifetimes for immutable assets
- load only what is needed per route

---

## 5. API Caching Strategy

## 5.1 Good candidates for caching
These are generally high-read and can tolerate short-lived caching:
- categories
- brands
- banners
- sliders
- featured products
- best sellers
- today’s deals
- blog list and blog detail
- policies
- business settings
- languages
- currencies
- capability flags

## 5.2 Poor candidates for heavy caching
These are user- or session-sensitive:
- cart
- cart summary
- cart count
- wishlist
- addresses
- checkout shipping totals
- payment types when dynamic per session/cart
- order creation and payment mutations
- authenticated order/account views

## 5.3 Conditional caching
These may be cached carefully if freshness rules are clear:
- product detail
- category listings
- brand listings
- search results
- flash deals and flash deal products

---

## 6. Recommended Cache Layers

## 6.1 Browser cache
Use for:
- static assets
- images
- immutable bundled JS/CSS
- some public API responses if safe

## 6.2 CDN / edge cache
Use for:
- images
- public static assets
- public read APIs with explicit cache headers
- generated media URLs where stable

## 6.3 Application cache
Use for:
- expensive catalog aggregations
- business settings
- capability flags
- content endpoints
- precomputed listing fragments where safe

## 6.4 Database optimization
Use for:
- indexes on common filter/sort fields
- query optimization for catalog endpoints
- avoiding N+1 patterns in product/detail responses

---

## 7. Cache Header Guidance

## Public read endpoints
Prefer explicit cache-control based on volatility.

### Examples
- categories / brands: longer short-term cache
- banners / sliders: medium short-term cache
- product detail / listings: shorter cache, with purge triggers
- blog/policies: medium cache with editorial purge

## Session-sensitive endpoints
Use no-store or private cache semantics where appropriate.

Examples:
- cart
- account
- wishlist
- checkout
- order history

---

## 8. CDN Strategy

## 8.1 What should be on the CDN
- JS bundles
- CSS bundles
- fonts
- product images
- brand logos
- category images
- banners and slider assets
- other storefront media assets

## 8.2 What should generally not be edge-cached blindly
- authenticated API responses
- cart/checkout/order/account data
- payment callback routes
- mutation endpoints

## 8.3 Multi-client benefit
A CDN layer is especially important when multiple storefronts share the same commerce core because:
- asset delivery can remain storefront-specific while backend logic is shared;
- static and media traffic is offloaded from the origin;
- global performance improves without changing commerce rules.

---

## 9. Image Optimization Strategy

## Goals
- reduce payload size
- preserve product confidence
- keep image loading predictable

## Recommendations
- serve responsive image sizes
- prefer modern formats where supported
- lazy-load below-the-fold images
- reserve space to reduce layout shift
- generate thumbnails and listing variants
- use higher-quality assets for PDP hero image only where needed

## Route-specific guidance
- home page banners: optimized hero assets
- listing pages: consistent small/medium card images
- PDP: gallery and zoom-friendly larger images
- brand/category logos: compact, cached aggressively

---

## 10. API Performance and Contract Considerations

## 10.1 Public catalog endpoints
- keep payloads small
- expose only storefront-safe fields
- avoid deeply nested unnecessary relationships
- support pagination consistently
- support efficient query params

## 10.2 PDP endpoints
- avoid fetching too much unused data
- separate optional modules where useful
- keep variant/price recalculation fast

## 10.3 Checkout endpoints
- prioritize correctness over aggressive caching
- maintain idempotency / retry safety for order creation
- observe latency on shipping/totals calculations closely

---

## 11. Invalidation Strategy

Caching only works if invalidation is clear.

## 11.1 Trigger-based invalidation examples
Purge or refresh caches when:
- product details change
- price changes
- stock changes
- category assignment changes
- banners/sliders are updated
- policy pages change
- flash deals start/end
- capability flags change

## 11.2 Invalidation levels
- specific asset purge
- specific product/page purge
- listing fragment purge
- homepage merchandising purge
- broad catalog purge only when absolutely necessary

---

## 12. Observability and Monitoring

Track:
- page load times by route
- API latency by endpoint
- cache hit/miss ratios
- image weight and request counts
- error rate by page group
- checkout latency
- payment handoff latency

Recommended thresholds should be set once production usage data is available.

---

## 13. Rollout Strategy

## Phase A
- clean and reproducible frontend build
- static asset compression and hashing
- image optimization baseline

## Phase B
- CDN for assets and media
- cache headers for public resources
- route-level bundle review

## Phase C
- application/API response caching for public endpoints
- catalog and content cache invalidation hooks
- monitoring dashboards

## Phase D
- edge optimization refinement
- traffic-aware tuning
- client-specific asset optimization

---

## 14. Risks

- caching private or session-sensitive endpoints incorrectly
- stale prices or stock on listings
- broken purge rules
- over-caching search and checkout flows
- performance work started before contract stability is sufficient

---

## 15. Acceptance Criteria

This strategy is implementation-ready when:
1. public vs private endpoints are classified for caching;
2. CDN asset scope is defined;
3. image optimization policy is defined;
4. invalidation triggers are documented;
5. performance observability requirements are defined;
6. rollout phases are agreed.

---

## 16. Practical First Actions

Before deeper optimization, do these first:
1. verify a clean production storefront build in CI;
2. remove dependency packaging inconsistencies;
3. classify endpoints into cacheable / private / conditional;
4. put static assets and media behind CDN;
5. add route and endpoint performance monitoring;
6. optimize image sizes for home, listing, and PDP.

This sequence produces fast wins without risking commerce correctness.
