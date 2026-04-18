# Step 3 — Responsive Storefront Productization Execution Plan

## 1. Purpose
This document defines the next execution phase after:
- Step 1 — storefront decoupling
- Step 2 — API contract stabilization

Step 3 focuses on turning the decoupled storefront into a **production-ready, reusable, responsive storefront system** that can be adapted for different client verticals such as cosmetics, lenses, wellness, fashion, and general retail.

This is not a single-brand redesign. This is a **storefront platformization step**.

---

## 2. Step 3 Goal
Build a reusable frontend storefront system that:
- consumes the stabilized headless commerce APIs
- works seamlessly on mobile, tablet, and desktop
- supports multiple client verticals without backend rewrites
- allows fast storefront customization by theme, content model, and product display rules
- is SEO-ready, performance-aware, and deployment-ready

---

## 3. Entry Gate for Step 3
Step 3 should start only after the following are confirmed:

### Required
1. Step 1 storefront separation is complete
2. Step 2 contract docs exist and are the source of truth
3. Capability flags endpoint is live
4. Core storefront pages compile at TypeScript level
5. API SDK modules are available for catalog, cart, auth, checkout, content, and customer

### Recommended before scale rollout
1. Reinstall frontend dependencies cleanly and verify reproducible production build
2. Finish remaining contract tests from the Step 2 checklist
3. Identify which legacy endpoints still use old response shapes
4. Confirm which controllers will remain legacy during Step 3 and which are safe for normalized usage

---

## 4. Current Verified Baseline
The current implementation already includes:
- decoupled React storefront project
- route-based page structure
- reusable product and layout components
- API SDK modules
- Redux slices for auth and cart
- React Query data hooks
- contract types and error helpers
- capability flags endpoint and DTO resources in Laravel

That means Step 3 does **not** start from zero. It starts from a working foundation.

---

## 5. Step 3 Scope

### In Scope
- responsive storefront architecture
- reusable page templates
- design system foundations
- vertical-specific presentation layer strategy
- account area completion
- checkout UX completion
- SEO-ready route metadata strategy
- frontend performance hardening
- image/content handling rules
- theming model
- capability-flag-driven feature rendering
- production storefront build readiness

### Out of Scope
- admin panel SPA migration
- seller panel SPA migration
- backend caching/CDN implementation
- backend-wide controller migration beyond what is necessary for storefront usage
- non-storefront operational dashboards

---

## 6. Step 3 Outcome
At the end of Step 3, the platform should provide:

### 6.1 Storefront Core
A generic storefront shell with:
- layout system
- navigation system
- footer/content blocks
- responsive product listing and PDP patterns
- account pages
- checkout pages
- search and discovery flows

### 6.2 Storefront Configuration Layer
A reusable configuration model controlling:
- logo and branding
- color palette
- typography tokens
- homepage section ordering
- enabled capabilities
- content block visibility
- product card variant
- category navigation behavior

### 6.3 Vertical Adaptation Layer
A way to adapt UI per business type without changing the backend commerce engine.

Examples:
- cosmetics: rich imagery, routines, bundles, ingredient highlights
- lens/optical: prescription messaging, attribute emphasis, comparison-heavy cards
- wellness: benefits, subscriptions, trust badges, bundles
- general retail: broad catalog-first layout

---

## 7. Architecture for Step 3

## 7.1 Frontend Layers

### Layer A — Commerce Core UI
Reusable pages and components powered by the API contract.

Examples:
- cart drawer/page
- checkout shell
- account shell
- search results
- category listing
- product gallery
- product variants

### Layer B — Experience Modules
Reusable but optional modules.

Examples:
- flash deals
- blog
- seller storefronts
- bundles
- related products
- reviews
- recently viewed
- recommendations

### Layer C — Vertical Presentation Packs
Client-specific presentation rules with no backend logic duplication.

Examples:
- product fact sections
- attribute labeling
- badges
- navigation taxonomy display
- PDP information hierarchy

### Layer D — Brand Skin
Visual theming only.

Examples:
- colors
- fonts
- spacing tone
- icon style
- hero section style

---

## 8. Storefront Information Architecture

## 8.1 Public Pages
- Home
- Categories
- Category Listing
- Brand Listing
- Brand Detail
- Search
- Product Detail
- Cart
- Login
- Registration
- Forgot Password
- Blog Listing
- Blog Detail
- Policies / static pages

## 8.2 Authenticated Pages
- Account Dashboard
- Orders
- Order Detail
- Wishlist
- Addresses
- Profile
- Notifications (optional)
- Returns / support (if enabled)

## 8.3 Conversion Funnel Pages
- Cart
- Address selection/input
- Shipping selection
- Payment selection
- Review / confirmation
- Order success / failure / pending

---

## 9. Step 3 Workstreams

## Workstream 1 — Responsive Design System
Create a reusable frontend design system.

### Deliverables
- typography scale
- spacing scale
- color tokens
- button system
- card system
- form controls
- validation states
- modal/drawer system
- skeleton loaders
- empty/error states
- responsive breakpoint rules

### Rules
- mobile-first
- no duplicated desktop-only components unless necessary
- every major component must define mobile, tablet, and desktop behavior

---

## Workstream 2 — Storefront Layout System
Create reusable layout primitives.

### Deliverables
- main shell
- header variants
- mobile menu
- desktop mega-menu placeholder
- footer blocks
- breadcrumb system
- filter/sidebar layout
- grid/list toggle support
- sticky CTA zones where relevant

---

## Workstream 3 — Catalog and Discovery Completion
Complete discovery experience.

### Deliverables
- category listing with filters/sorts
- brand listing and brand detail pages
- search results page
- pagination or load-more model
- empty search state
- no-result fallback
- recently viewed module
- related product sections
- flash deal presentation

### Notes
This workstream should consume stabilized contract types wherever possible.

---

## Workstream 4 — PDP Productization
Standardize the product detail page to handle multiple verticals.

### Deliverables
- image gallery
- product summary block
- price block
- variant selector
- stock state handling
- add-to-cart / buy-now state logic
- delivery / shipping message area
- reviews block
- detail accordion/tabs system
- vertical-specific info section slot

### Vertical Slot Examples
- cosmetics: ingredients, usage, skin type
- lens: lens type, power range, material, usage guidance
- wellness: benefits, dosage/usage, care notes

---

## Workstream 5 — Account Experience Completion
Finish customer account flows.

### Deliverables
- dashboard
- orders list
- order detail
- address CRUD
- profile edit
- wishlist page
- authenticated route protection
- login/registration consistency

---

## Workstream 6 — Checkout UX Completion
Complete the headless storefront purchase journey.

### Deliverables
- cart-to-checkout entry
- address step
- shipping step
- payment step
- review step
- order result pages
- retry payment state
- failed payment handling
- pending/processing state handling

### Important Rule
Do not rebuild payment logic in the frontend. The frontend only orchestrates the contract and reflects state.

---

## Workstream 7 — Capability-Driven Rendering
Use the `/capabilities` endpoint to toggle features.

### Deliverables
- feature bootstrap on app load
- capability-aware route visibility
- capability-aware payment method display
- optional feature guards
- safe fallbacks for disabled capabilities

### Example
- hide auction UI when auction addon is disabled
- hide wallet payment option when wallet is off
- hide guest checkout when disabled

---

## Workstream 8 — SEO and Content Readiness
Prepare the storefront for discoverability.

### Deliverables
- route metadata strategy
- canonical URL handling
- product/category structured data plan
- robots/sitemap integration plan
- page title/meta description generation rules
- content blocks for blog/policies/home sections

### Note
This is storefront-focused SEO. Full performance and CDN hardening come in Step 4.

---

## Workstream 9 — Frontend Performance Hardening
Improve user experience before scale rollout.

### Deliverables
- image lazy loading
- route-level code splitting
- query caching rules
- skeleton states
- bundle inspection
- API retry policy rules
- error boundary strategy
- stale-while-revalidate approach where suitable

---

## 10. Storefront Product Model for Multi-Vertical Use
Step 3 must avoid assuming one product type.

### Required Frontend Model Layers
1. **Core product fields**
   - id
   - slug
   - name
   - media
   - price
   - stock
   - rating
   - variants

2. **Structured optional fields**
   - badges
   - highlights
   - short facts
   - grouped attributes
   - delivery messages

3. **Vertical extension fields**
   - cosmetics-specific
   - lens-specific
   - wellness-specific
   - custom client-specific

### Rule
The frontend should support extension fields without making the base storefront unusable.

---

## 11. Execution Sequence

## Phase 3A — Foundation Hardening
- clean package install
- confirm build reproducibility
- establish design tokens
- finalize route map
- finalize capability bootstrapping

## Phase 3B — Public Discovery Experience
- home
- categories
- category listing
- brands
- brand detail
- search
- blog/static pages

## Phase 3C — Product and Conversion Experience
- PDP completion
- cart hardening
- wishlist
- registration
- guest and auth flow continuity

## Phase 3D — Account Experience
- dashboard
- orders
- profile
- addresses

## Phase 3E — Checkout Completion
- shipping
- payment
- confirmation
- payment failure/retry

## Phase 3F — Vertical Adaptation Layer
- cosmetics presentation pack
- lens presentation pack
- general retail presentation pack

## Phase 3G — Production Readiness
- accessibility pass
- responsive QA
- SEO pass
- error-state pass
- analytics event map

---

## 12. Sprint Plan

## Sprint 3.1 — Foundation Hardening
### Goals
- dependency cleanup
- build reproducibility
- design token setup
- layout shell refinement
- capability bootstrap wiring

### Deliverables
- successful clean install instructions
- reproducible production build
- app bootstrap with capability flags
- finalized shared layout system

## Sprint 3.2 — Public Discovery Pages
### Goals
- complete read-only discovery flows

### Deliverables
- categories
- category detail/listing
- brands
- brand detail
- search
- blog/static pages

## Sprint 3.3 — PDP + Cart
### Goals
- complete product and cart interaction experience

### Deliverables
- finalized PDP
- wishlist UX
- cart UX
- cart warnings and stock-state handling

## Sprint 3.4 — Account Pages
### Goals
- complete authenticated customer experience

### Deliverables
- dashboard
- orders
- profile
- addresses
- protected routes

## Sprint 3.5 — Checkout UX
### Goals
- finish the storefront purchase funnel

### Deliverables
- address
- shipping
- payment
- review
- order result pages

## Sprint 3.6 — Vertical Packs + Hardening
### Goals
- reusable adaptation model and polish

### Deliverables
- cosmetics pack
- lens pack
- general retail pack
- responsive QA pass
- SEO pass

---

## 13. Definition of Done for Step 3
Step 3 is complete only when all of the following are true:

1. Storefront runs as a reusable frontend product, not a one-off client site
2. Public pages work across mobile, tablet, and desktop
3. Account and checkout experiences are production-ready
4. Capability flags are actively used by the frontend
5. Vertical-specific presentation packs can be introduced without backend rewrites
6. The storefront can be branded per client without altering commerce logic
7. TypeScript build passes from a clean install
8. Key storefront routes have acceptable performance and error handling
9. The storefront is ready for Step 4 panel modernization and performance scaling

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy API response shapes still leak into storefront logic | Medium | Use normalized adapters and isolate legacy mapping in SDK layer |
| Checkout gateway flows differ too much by provider | High | Use capability + gateway adapter strategy; keep UI generic |
| One client vertical over-shapes the base storefront | High | Keep vertical packs isolated from core components |
| Responsive design becomes page-by-page inconsistent | Medium | Define shared layout primitives and tokens first |
| Build reproducibility issues delay releases | High | Clean reinstall, lock dependencies, document build environment |

---

## 15. Immediate Next Actions
1. Clean reinstall storefront dependencies and verify production build from scratch
2. Freeze the Step 3 route map and page ownership
3. Define design tokens and responsive rules
4. Wire capability bootstrap into app initialization
5. Complete public discovery pages before deepening checkout
6. Decide the first vertical presentation pack to implement after the generic base is stable

---

## 16. Recommended Artifact Set for Step 3
Create these documents under `docs/` during execution:

- `06a-storefront-route-inventory.md`
- `06b-responsive-design-system-spec.md`
- `06c-page-template-matrix.md`
- `06d-vertical-presentation-pack-guide.md`
- `06e-checkout-ux-state-map.md`
- `06f-storefront-seo-metadata-strategy.md`
- `06g-frontend-performance-checklist.md`
- `06h-step3-implementation-report.md`

---

## 17. Final Position
Step 3 is where the project moves from **technical decoupling** to **product-grade storefront platformization**.

The backend is already serving as the commerce engine.
The API contract foundation exists.
Now the priority is to build a responsive, extensible storefront system that multiple clients can adopt with minimal rework.
