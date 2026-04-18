# Homepage, Catalog, and Merchandising Wiring Specification

## Objective

Ensure all admin-managed catalog and merchandising modules are correctly exposed through APIs and rendered in the React storefront.

## A. Homepage section wiring

### 1. Hero sliders
- **Source of truth:** admin slider management
- **API:** `/api/v2/sliders`
- **Current status:** wired
- **Action:** confirm ordering, multi-slide behavior, autoplay, and fallback image handling

### 2. Homepage banner slots
- **Source of truth:** banner management / homepage editor
- **APIs present:**
  - `/api/v2/banners`
  - `/api/v2/banners-one`
  - `/api/v2/banners-two`
  - `/api/v2/banners-three`
- **Current status:** not wired to homepage
- **Action required:**
  - define slot ownership (`hero-secondary`, `mid-page`, `promo-strip`, etc.)
  - create React components per slot
  - add fallback when slot is empty

### 3. Featured categories
- **API:** `/api/v2/categories/featured`
- **Current status:** wired
- **Action:** validate icon/cover precedence and ordering from admin

### 4. Top categories / top brands / top sellers
- **APIs present:**
  - `/api/v2/categories/top`
  - `/api/v2/brands/top`
  - `/api/v2/seller/top`
- **Current status:** unused
- **Action required:** decide whether these become homepage sections or are removed from public scope

### 5. Merchandising blocks
- **APIs used:**
  - `/api/v2/products/todays-deal`
  - `/api/v2/products/featured`
  - `/api/v2/products/best-seller`
- **Current status:** wired
- **Action:** verify admin flags and empty-state behavior for each block

### 6. Flash deals
- **APIs used:**
  - `/api/v2/flash-deals`
  - `/api/v2/flash-deals/info/{slug}`
  - `/api/v2/flash-deal-products/{id}`
- **Current status:** wired
- **Action:** add countdown, schedule-state handling, and deal-expired behavior if required

## B. Catalog listing and discovery wiring

### 1. Category discovery
- **Current status:** wired
- **Required validation:**
  - category slug uniqueness
  - category landing page metadata
  - empty-category handling

### 2. Brand discovery
- **Current status:** wired
- **Required validation:**
  - brand slug uniqueness
  - empty brand handling
  - brand image/logo fallback

### 3. Search
- **Current status:** wired
- **Required validation:**
  - keyword search behavior
  - pagination
  - no-result UX
  - URL-based query preservation

### 4. Product detail page
- **Current status:** wired
- **Required validation:**
  - image gallery order
  - variant pricing across all products
  - stock/out-of-stock rules
  - brand/seller cross-links
  - review rendering

### 5. Product tags
- **Current status:** partial
- **Current behavior:** tags are displayed, but do not lead anywhere
- **Decision required:**
  - either keep as static metadata,
  - or add tag-driven search/list pages

## C. Non-wired catalog features that must be decided

### 1. All products page
- API exists for generic product listing
- No dedicated storefront route currently consumes it
- Decide whether to add `/products`

### 2. Digital products
- API exists
- No storefront page
- Add only if product strategy includes digital commerce

### 3. In-house products
- API exists
- No storefront page
- Add only if needed for merchandising strategy

### 4. Compare
- No React implementation found
- Add only if parity with legacy storefront is required

## Acceptance criteria

- Homepage sections reflect admin-managed sliders, categories, flash deals, and product flags
- Banner slots are wired or explicitly removed from scope
- Category, brand, search, and product detail pages are fully customer-usable
- Merchandising sections match admin visibility/order rules
- No hardcoded placeholder catalog sections remain where admin owns the content
