# Legacy Storefront Content Sync Design

**Date:** 2026-04-14

**Goal:** Move the legacy storefront catalog and CMS content into Laravel so admin and storefront both use the same live backend data for products, blog posts, FAQs, About Us, and Contact Us.

## Problem

The current repo has two competing content sources:

- Laravel data shown in admin and served by the API
- React fallback content in `frontend/src/lib/fallbackData.ts`

This causes visible drift:

- Admin product list shows placeholder thumbnails because backend products do not have the legacy image assets wired into Laravel uploads
- Storefront pages can still render fallback products, blog posts, FAQs, and pages that do not match backend-managed content
- Product descriptions and imagery differ between the admin records and what the storefront expects from the old site

## Source Of Truth

After this migration, Laravel becomes the only intended content source for:

- Products
- Blog posts
- FAQs
- About Us
- Contact Us

The legacy frontend fallback data will remain in the repo only as migration input and emergency fallback code, but the app should render from backend APIs when those records exist.

## Migration Inputs

The legacy content already exists in the repo:

- Products: `frontend/src/lib/fallbackData.ts`
- Product images: `frontend/public/images/products/*`
- Blog posts: `frontend/src/lib/fallbackData.ts`
- Blog images: `frontend/public/images/blog/*`
- FAQs: `frontend/src/lib/fallbackData.ts`
- About/policy page bodies: `frontend/src/lib/fallbackData.ts`

## Proposed Architecture

Create a backend importer/seeder that reads the legacy content from a checked-in PHP config file instead of parsing TypeScript at runtime. That importer will:

1. Create or update upload records for local legacy images
2. Create or update product records and stock
3. Create or update blog categories and blog posts
4. Create or update FAQ page JSON
5. Create or update About and Contact pages
6. Create or update supporting business settings for storefront contact details

To keep runtime code simple, the legacy dataset should be stored in a new PHP config file derived from the existing frontend fallback data. Laravel import code should only depend on that PHP dataset plus local image files.

## Data Model Decisions

### Products

- Use `products` + `product_stocks`
- Register each legacy product image as an `uploads` record stored in a public path such as `uploads/all/legacy-*`
- Set `thumbnail_img` to the imported upload id
- Set `photos` to at least the same imported upload id so PDP galleries are populated
- Preserve slugs, names, descriptions, price, stock, and metadata from the legacy catalog
- Mark products as in-house, approved, and published

### Blog

- Use `blog_categories` + `blogs`
- Import featured blog images into `uploads`
- Map legacy excerpt/body/meta fields into existing blog columns

### FAQ

- Continue using the existing `faq` page JSON content format because public API and admin bridge already depend on it

### About Us

- Continue using a `pages` record with slug `about`

### Contact Us

- Use a `pages` record with slug `contact-us` and type `contact_us_page`
- Store page description and structured contact fields in the page content shape already supported by `StorefrontPageResource`
- Also sync matching business settings such as contact email, phone, and address so storefront settings and contact page stay aligned

## Runtime Wiring

No new public API contract should be introduced. Existing routes should serve the newly imported backend data:

- `/api/v2/products`
- `/api/v2/products/{slug}/0`
- `/api/admin/products`
- `/api/v2/blog-list`
- `/api/v2/blog-details/{slug}`
- `/api/admin/posts`
- `/api/v2/faqs`
- `/api/admin/faqs`
- `/api/v2/pages/about`
- `/api/v2/pages/contact`
- `/api/admin/pages`

## Error Handling

- Import should be idempotent: rerunning it updates existing records by slug instead of creating duplicates
- Missing image files should fail clearly during tests
- If a page or category exists already, importer should update it rather than duplicating it

## Testing Strategy

Use backend-first TDD:

- Add feature tests proving the importer creates products with real image URLs and non-empty descriptions
- Add feature tests proving blog, FAQ, About, and Contact content are imported and returned by the public/admin endpoints
- Run targeted tests first, then broader API checks

## Risks

- Existing manual content could be overwritten if importer is too aggressive
- Contact page has two storage locations today: page content and business settings
- Product/category mapping should stay minimal to avoid accidental coupling to unfinished admin taxonomy work

## Mitigations

- Match and update by stable slug
- Limit imported fields to the storefront/admin surfaces currently used
- Keep importer deterministic and idempotent
- Verify exact public/admin API outputs after import
