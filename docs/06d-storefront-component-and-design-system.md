# 06d — Storefront Component and Design System

## Document Purpose

This document defines the reusable UI system for the responsive storefront built on top of the headless commerce core.

The goal is to make the storefront:
- reusable across multiple verticals,
- consistent across pages,
- responsive across mobile, tablet, and desktop,
- themeable per client without changing core page logic.

This document covers:
- design system principles,
- component taxonomy,
- current components,
- planned components,
- responsive grid rules,
- theming and client overrides,
- accessibility standards.

---

## 1. Design System Goals

The storefront design system must support:

1. **Reusability**  
   A product card or checkout summary should be reusable across many clients.

2. **Scalability**  
   New verticals such as cosmetics, lens/optical, wellness, gifting, and others should be supported through composition and theme tokens.

3. **Separation of concerns**  
   API logic and business rules remain outside presentational components.

4. **Responsive-first delivery**  
   Components must adapt cleanly across mobile, tablet, and desktop.

5. **Accessible commerce interactions**  
   Forms, selectors, buttons, and navigation must remain keyboard- and screen-reader-friendly.

---

## 2. Current Frontend Baseline

The current storefront stack includes:
- React
- TypeScript
- route-based pages
- Tailwind utility styling
- Redux for auth/cart state
- React Query hooks for API-backed server state

Current shared UI components already present:
- `Header`
- `Footer`
- `ProductCard`
- `ProductGrid`

These are the seed components for the design system.

---

## 3. Design Token Layers

## 3.1 Core tokens
These should be generic and shared across all clients.

### Color tokens
- text primary
- text secondary
- text muted
- surface default
- surface elevated
- border default
- border emphasis
- accent primary
- accent primary hover
- success
- warning
- error

### Typography tokens
- font family primary
- font family secondary (optional)
- display size
- heading 1–6 scale
- body regular
- body small
- caption
- button label

### Spacing tokens
- xs
- sm
- md
- lg
- xl
- 2xl
- section spacing

### Radius tokens
- input radius
- card radius
- panel radius
- pill radius

### Shadow tokens
- card shadow
- elevated panel shadow
- overlay shadow

## 3.2 Semantic tokens
These are still generic, but closer to ecommerce semantics.

- product sale price color
- product compare-at price color
- stock in / low / out state colors
- CTA primary / secondary
- trust badge backgrounds
- input error border / text
- promotional banner treatments

## 3.3 Client / vertical theme tokens
These are customizable per storefront.

Examples:
- cosmetics: warmer palette, editorial merchandising, image-heavy hero
- lens/optical: clinical clarity, spec-heavy PDP, prescription callouts
- wellness: softer palette, benefit-led cards, compliance info areas

---

## 4. Layout System

## 4.1 App shell
The current storefront uses a shared layout:
- global header
- main route content
- footer

This should remain the default shell for all storefronts.

## 4.2 Container widths
Recommended shared container scale:
- narrow content container for auth/account forms
- standard content container for most catalog pages
- wide content container for homepage and merchandising layouts
- full-bleed sections only for controlled hero/promotional modules

## 4.3 Grid rules
### Mobile
- 4 or 8 px baseline spacing
- 1-column content flow for most pages
- 2-column product cards where comfortable
- drawer patterns for filters/navigation

### Tablet
- 2-column page bodies where appropriate
- 3-column product grids standard
- wider form layout and split summary possible

### Desktop
- 4+ column merchandising grids
- left filter rails or sidebars where helpful
- two-column PDP and checkout layouts
- persistent summary panels where relevant

---

## 5. Component Taxonomy

## 5.1 Foundations
- Button
- Link
- Icon wrapper
- Typography primitives
- Input
- Select
- Radio group
- Checkbox
- Textarea
- Badge
- Chip
- Divider
- Skeleton
- Empty state
- Error state
- Spinner / loading indicator

## 5.2 Navigation
- Header
- Mobile menu drawer
- Search bar
- Mega menu / category menu
- Breadcrumbs
- Pagination
- Tabs
- Footer
- Secondary nav
- Account nav rail

## 5.3 Commerce display
- ProductCard
- ProductGrid
- PriceBlock
- RatingSummary
- InventoryBadge
- DiscountBadge
- Gallery
- VariantSelector
- QuantitySelector
- BrandCard
- CategoryCard
- SellerCard
- PromoBanner
- FlashDealCard

## 5.4 Commerce actions
- AddToCartButton
- BuyNowButton
- WishlistToggle
- CouponForm
- DeliverySelector
- AddressCard
- PaymentMethodCard
- OrderSummaryPanel
- ReorderButton
- InvoiceButton

## 5.5 Content
- Hero section
- Carousel
- Rich text article body
- Policy page wrapper
- Blog card
- Blog list
- Trust strip
- FAQ accordion
- Testimonial block

## 5.6 Feedback and system
- Toast / inline feedback
- Confirmation modal
- Destructive action confirmation
- Form error summary
- not found state
- API degraded state banner (optional)

---

## 6. Current Components and Required Expansion

## 6.1 Header
### Current
- responsive layout
- mobile menu support
- search entry
- navigation

### Must expand to support
- account state
- cart count
- category shortcuts
- language/currency switchers if capabilities allow
- storefront branding slot
- trust/announcement bar optional slot

## 6.2 Footer
### Current
- basic shared footer

### Must expand to support
- policy links
- content-driven sections
- trust and support links
- social links
- newsletter CTA (optional by client)

## 6.3 ProductCard
### Current
- reusable product card

### Must support
- image
- product name
- sale/compare price
- discount state
- rating / review count
- click-through to PDP
- optional wishlist action
- optional quick-add
- optional vertical-specific metadata

### Vertical variations
- cosmetics: highlight shade/benefit tags
- optical: highlight lens type/spec summary
- wellness: highlight goals/benefits/subscription option

## 6.4 ProductGrid
### Current
- grid rendering and loading support

### Must support
- skeleton state
- empty state
- density variants
- responsive column count
- card composition consistency

---

## 7. Planned Route-Level Component Sets

## Home page
- Hero
- category strip
- merchandising sections
- product rails
- promo banners
- editorial blocks
- newsletter / trust modules

## Category / Brand / Search pages
- page header
- filter bar / filter drawer
- sort control
- applied filters chips
- product grid
- pagination
- empty state

## PDP
- gallery
- media thumbnails
- product summary
- price block
- variant selectors
- quantity selector
- add to cart actions
- review module
- delivery / trust info
- related products

## Cart
- cart line item
- quantity selector
- remove action
- grouped seller block
- summary panel
- coupon slot

## Checkout
- address selection
- delivery options
- order review
- payment methods
- summary panel
- place order CTA

## Account
- account shell
- nav rail or tabs
- profile panel
- order list
- address book cards
- wishlist list

---

## 8. Responsive Rules by Component Type

## Product cards
- mobile: tighter layout, image-first, minimal metadata
- desktop: more space for secondary metadata and actions

## Filters
- mobile: drawer / bottom sheet
- desktop: rail or top bar

## Forms
- mobile: single-column, full-width inputs
- desktop: grouped fields where scannable

## Summary panels
- mobile: below content or sticky footer CTA
- desktop: right-side sticky summary where appropriate

## Media galleries
- mobile: swipe-friendly
- desktop: thumbnail + main image layout

---

## 9. Theming and Multi-Client Strategy

## 9.1 Shared core
The core storefront design system must remain generic.

Do not hardcode:
- brand-specific colors,
- category-specific copy,
- vertical-specific feature wording,
- promotional component assumptions.

## 9.2 Theme pack approach
Each client storefront should be able to provide:
- color token overrides
- font overrides
- hero style variant
- card density variant
- header/footer composition options
- merchandising module configuration
- vertical-specific content blocks

## 9.3 Allowed vertical extensions
Vertical extensions are allowed when they:
- sit behind composition boundaries,
- do not break generic page contracts,
- do not require page rewrites for every client.

Examples:
- lens prescription helper block on PDP
- cosmetics ingredient / usage / routine card
- wellness subscription info block

---

## 10. Accessibility Standards

Every shared component must support:
- visible focus states
- keyboard interaction
- semantic labeling
- form field errors tied to inputs
- image alt handling
- screen-reader-friendly button labels
- color contrast targets appropriate for commerce interactions

Special attention:
- variant selectors
- quantity controls
- mobile menu
- modal dialogs
- coupon and checkout forms
- pagination buttons

---

## 11. Content Loading and States

Every data-backed component must define:
- loading skeleton state
- empty state
- inline error state
- retry affordance where appropriate

Examples:
- ProductGrid loading skeleton
- Brand grid empty state
- PDP reviews empty state
- checkout payment methods unavailable state

---

## 12. Definition of Done

A component or design-system element is complete when:
1. purpose is named;
2. inputs/props are defined;
3. visual states are defined;
4. responsive behavior is defined;
5. accessibility behavior is defined;
6. theming behavior is defined;
7. dependencies on API/state are documented;
8. QA can test it independently.

---

## 13. Implementation Recommendation

Build the remaining storefront using:
- small, composable primitives,
- route-level composition,
- theme tokens instead of page rewrites,
- API-to-UI mapping handled outside presentational components.

This keeps the storefront:
- generic,
- reusable,
- multi-client ready,
- easier to scale in Step 4 and beyond.
