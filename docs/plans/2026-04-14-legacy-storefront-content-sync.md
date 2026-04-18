# Legacy Storefront Content Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import the legacy storefront products, images, blog posts, FAQs, About Us, and Contact Us content into Laravel so admin and storefront both use the same live backend catalog and CMS records.

**Architecture:** Move the legacy fallback dataset into a PHP config file, then build an idempotent Laravel importer/seeder that copies local legacy assets into Laravel uploads and upserts the related product, blog, FAQ, and page records. Keep the existing public/admin API contracts and verify them against imported live data.

**Tech Stack:** Laravel, PHPUnit, existing V2 API resources/controllers, React storefront adapters

---

### Task 1: Freeze Import Expectations With Backend Tests

**Files:**
- Create: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add a feature test that:
  - runs the legacy importer/seeder
  - asserts `Poondu Thokku` exists in `products`
  - asserts its `thumbnail_img` is set
  - asserts `/api/admin/products` returns a non-placeholder `primary_image_url`
  - asserts `/api/v2/products` returns a non-empty `thumbnail_image`
  - asserts `/api/v2/products/poondu-thokku/0` returns the expected description

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Only enough scaffolding to make the test move from missing importer to actual import behavior.

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 2: Add Backend-Friendly Legacy Dataset

**Files:**
- Create: `config/legacy_storefront_content.php`

**Step 1: Write the failing test**

- Extend `LegacyContentImportTest` to assert the importer can read the complete dataset structure for:
  - products
  - blog posts
  - FAQs
  - pages
  - contact info

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Create a PHP config file mirroring the legacy content currently stored in `frontend/src/lib/fallbackData.ts`
- Include stable relative paths for product and blog images under `frontend/public/images`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 3: Build Legacy Asset Import Support

**Files:**
- Create: `app/Support/LegacyStorefrontContentImporter.php`
- Modify: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add assertions that imported product and blog images are copied into Laravel public uploads and resolve through `uploaded_asset()`

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Add importer support methods that:
  - locate source files in `frontend/public/images`
  - copy them into `public/uploads/all`
  - create or update `uploads` records
  - reuse existing uploaded records by deterministic key

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 4: Import Legacy Products Into Live Catalog

**Files:**
- Modify: `app/Support/LegacyStorefrontContentImporter.php`
- Modify: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add assertions for:
  - imported product count
  - product slug uniqueness
  - `thumbnail_img` and `photos`
  - `product_stocks`
  - published/approved state
  - admin list image URLs

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Upsert products by slug
- Set product fields from legacy data
- Upsert a primary stock row per product
- Attach imported upload ids to `thumbnail_img` and `photos`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 5: Import Blog Categories And Posts

**Files:**
- Modify: `app/Support/LegacyStorefrontContentImporter.php`
- Modify: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add assertions that:
  - blog categories are created
  - blog posts are created by slug
  - banner images are imported
  - `/api/v2/blog-list` and `/api/v2/blog-details/{slug}` return imported content

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Upsert blog categories by slug
- Upsert blog posts by slug
- Import and assign banner upload ids

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 6: Import FAQ, About, And Contact Content

**Files:**
- Modify: `app/Support/LegacyStorefrontContentImporter.php`
- Modify: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add assertions that:
  - `faq` page JSON is imported
  - `about` page content is imported
  - `contact-us` page content is imported
  - contact business settings are updated
  - `/api/v2/pages/about`, `/api/v2/pages/contact`, and `/api/v2/faqs` return imported content

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Upsert:
  - `faq` page with JSON content
  - `about` page with HTML body
  - `contact-us` page with structured JSON body
  - matching `BusinessSetting` rows for address, phone, and email

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 7: Expose Import Through Seeder

**Files:**
- Create: `database/seeds/LegacyStorefrontContentSeeder.php`
- Modify: `database/seeds/DatabaseSeeder.php`
- Modify: `tests/Feature/LegacyContentImportTest.php`

**Step 1: Write the failing test**

- Add assertions that calling the seeder path imports the full dataset idempotently

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

**Step 3: Write minimal implementation**

- Create a seeder that delegates to the importer
- Register it from `DatabaseSeeder`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=LegacyContentImportTest`

### Task 8: Verify Admin And Storefront Contracts Against Imported Data

**Files:**
- Modify: `tests/Feature/Api/Admin/AdminBridgeApiTest.php`
- Modify: `tests/Feature/Api/V2/StorefrontContentApiTest.php`
- Modify: `frontend/src/lib/headless/catalogAdapter.test.ts`

**Step 1: Write the failing tests**

- Update assertions to prove imported content reaches:
  - admin product list/detail
  - storefront page/contact/faq/blog APIs
  - product adapter image flow

**Step 2: Run test to verify it fails**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=\"AdminBridgeApiTest|StorefrontContentApiTest|LegacyContentImportTest\"`
- `npm test -- catalogAdapter.test.ts cmsAdapter.test.ts`

**Step 3: Write minimal implementation**

- Make only the smallest runtime adjustments required by the tests

**Step 4: Run test to verify it passes**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=\"AdminBridgeApiTest|StorefrontContentApiTest|LegacyContentImportTest\"`
- `npm test -- catalogAdapter.test.ts cmsAdapter.test.ts`

### Task 9: Seed Local Data And Spot-Check Runtime Behavior

**Files:**
- Modify only if verification reveals a real defect

**Step 1: Run importer locally**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan db:seed --class=LegacyStorefrontContentSeeder`

**Step 2: Verify public/admin API payloads manually**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan tinker --execute=\"echo App\\Models\\Product::where('slug', 'poondu-thokku')->first()?->thumbnail_img;\"`
- `curl http://127.0.0.1:8000/api/v2/products`
- `curl http://127.0.0.1:8000/api/v2/pages/about`

**Step 3: Fix only verified defects**

- Apply the smallest patch needed

### Task 10: Final Verification

**Files:**
- No new files required

**Step 1: Run backend tests**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test`

**Step 2: Run targeted frontend tests**

Run: `npm test -- catalogAdapter.test.ts cmsAdapter.test.ts`

**Step 3: Report actual status with evidence**

- Include what was imported and any remaining gaps
