# Storefront Activation Cutover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple backend "Browse Website" links from Laravel `route('home')` and document the public React storefront cutover.

**Architecture:** Add a single backend-configured storefront URL source of truth, expose it through a helper used by admin and seller navigation, and document the production routing shape where React owns public routes while Laravel keeps `/api` and `/admin`.

**Tech Stack:** Laravel 10, Blade, PHPUnit 10, Vite/React deployment docs

---

### Task 1: Add regression coverage for storefront URL resolution

**Files:**
- Create: `tests/Unit/StorefrontUrlTest.php`

**Step 1: Write the failing test**

Add tests that assert `storefront_url()` prefers `config('app.frontend_url')` and falls back to `config('app.url')`.

**Step 2: Run test to verify it fails**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php`
Expected: FAIL because `storefront_url()` does not exist yet.

**Step 3: Write minimal implementation**

Add a helper and config entry that resolve the public storefront URL.

**Step 4: Run test to verify it passes**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php`
Expected: PASS

### Task 2: Rewire backend browse links to configured storefront URL

**Files:**
- Modify: `resources/views/backend/inc/admin_nav.blade.php`
- Modify: `resources/views/seller/inc/seller_nav.blade.php`

**Step 1: Update the link target**

Replace `route('home')` with the new helper so both admin and seller panels open the configured storefront.

**Step 2: Run focused tests**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php`
Expected: PASS

### Task 3: Expose environment configuration

**Files:**
- Modify: `.env.example`
- Modify: `config/app.php`

**Step 1: Add `FRONTEND_URL`**

Document the environment variable in `.env.example` and wire it into Laravel config.

**Step 2: Re-run focused tests**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php`
Expected: PASS

### Task 4: Document public-site cutover requirements

**Files:**
- Modify: `HOSTINGER_DEPLOYMENT_GUIDE.md`
- Modify: `docs/18-environment-config-secrets-and-deployment-checklist.md`

**Step 1: Add production routing guidance**

Document the final desired shape:
- `/` and customer routes -> React storefront
- `/api/*` -> Laravel
- `/admin/*` -> Laravel
- SPA fallback for unknown storefront routes

**Step 2: Document `FRONTEND_URL` usage**

Explain that backend browse links must target the configured storefront domain instead of Laravel homepage routes.

### Task 5: Verify the cutover changes

**Files:**
- Verify only

**Step 1: Run unit tests**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php`
Expected: PASS

**Step 2: Run a broader sanity check**

Run: `php artisan test tests/Unit/StorefrontUrlTest.php tests/Feature/ExampleTest.php`
Expected: PASS or report exact failure if unrelated environment issues block it.
