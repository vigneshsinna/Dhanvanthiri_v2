# 14 — Catalog and CMS Integration Spec

## Objective
Connect the old storefront's read-only discovery experience to the new headless backend first.

## Scope
- home
- categories
- brands
- search
- product listing
- product detail
- CMS pages
- blog or article pages if supported

## Why this goes first
These routes are low-risk, read-heavy, and provide the safest first cutover path.

## Data domains
### Catalog
- categories
- brands
- product summaries
- product detail
- filters and sort
- variant and price display
- stock badges
- breadcrumbs

### CMS
- home hero content
- banners
- static pages
- policy pages
- article/blog summaries and detail if available

## Mapping rules
- normalize IDs to string or numeric format consistently
- derive display price model centrally
- create one image URL resolver
- handle missing SEO fields with sensible defaults
- standardize pagination metadata

## SEO requirements
- route-level meta title and description
- canonical URL handling
- structured data where already supported
- crawl-safe category and product URLs
- server/public fallback handling for missing pages

## Performance requirements
- cache GET responses where safe
- lazy load non-critical UI sections
- keep filter state in URL
- avoid duplicate product fetches on page transitions

## Open decisions
- which backend endpoint powers site-wide search
- how faceted filtering is mapped
- whether blog/CMS remains on old backend temporarily or fully migrates now

## Test cases
- category page loads with filters
- search results paginate correctly
- PDP loads with variants and stock state
- CMS page fallback works
- missing slug returns a proper not-found state
- SEO tags render correctly per page

## Acceptance criteria
- all discovery pages read from the new backend
- components do not depend on old backend catalog shape
- SEO fields are mapped and validated
- page URLs remain stable or redirect cleanly
