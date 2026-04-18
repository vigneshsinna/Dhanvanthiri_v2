# Storefront And Admin Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make products, blog, FAQ, and about content flow correctly between Laravel, the storefront, and the React admin, and make checkout work through a real Razorpay end-to-end path.

**Architecture:** Keep the existing Laravel V2 public API for storefront data, normalize those payloads in the frontend adapters, and add a focused `/api/admin` bridge for the React admin screens in scope. Rework checkout to follow the backend’s real cart-address-shipping-order-payment sequence instead of the current simplified adapter flow.

**Tech Stack:** Laravel, Sanctum, React, Vite, React Query, Vitest, Razorpay PHP SDK, Razorpay Checkout JS

---

### Task 1: Lock Failing Frontend Contract Tests

**Files:**
- Modify: `frontend/src/lib/headless/cmsAdapter.test.ts`
- Modify: `frontend/src/lib/headless/catalogAdapter.ts`
- Modify: `frontend/src/lib/headless/cmsAdapter.ts`

**Step 1: Write the failing tests**

- Add tests for:
  - product image normalization to `primary_image_url`
  - blog list normalization from `blogs.data`
  - blog detail normalization from `blog`
  - FAQ normalization from a dedicated FAQ source

**Step 2: Run test to verify it fails**

Run: `npm test -- cmsAdapter.test.ts`

**Step 3: Write minimal implementation**

- Normalize V2 payloads in adapters only.

**Step 4: Run test to verify it passes**

Run: `npm test -- cmsAdapter.test.ts`

**Step 5: Continue without commit**

- No git repo is available in this workspace.

### Task 2: Fix Storefront Product Image Wiring

**Files:**
- Modify: `frontend/src/lib/headless/catalogAdapter.ts`
- Test: `frontend/src/lib/headless/cmsAdapter.test.ts`

**Step 1: Write the failing test**

- Assert product collections expose `primary_image_url` from `thumbnail_image`.

**Step 2: Run test to verify it fails**

Run: `npm test -- cmsAdapter.test.ts`

**Step 3: Write minimal implementation**

- Map `thumbnail_image` to `primary_image_url` in product list/detail normalization.

**Step 4: Run test to verify it passes**

Run: `npm test -- cmsAdapter.test.ts`

### Task 3: Add Public FAQ API

**Files:**
- Create: `app/Http/Controllers/Api/Admin/FaqAdminController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/PublicFaqsTest.php`

**Step 1: Write the failing test**

- Add a feature test for `GET /api/v2/faqs`.

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=PublicFaqsTest`

**Step 3: Write minimal implementation**

- Return active FAQs in a storefront-friendly JSON shape.

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=PublicFaqsTest`

### Task 4: Build React Admin CMS Bridge APIs

**Files:**
- Create: `app/Http/Controllers/Api/Admin/PageAdminController.php`
- Create: `app/Http/Controllers/Api/Admin/PostAdminController.php`
- Create: `app/Http/Controllers/Api/Admin/FaqAdminController.php`
- Create: `app/Http/Controllers/Api/Admin/ProductAdminController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/AdminCmsBridgeTest.php`

**Step 1: Write the failing tests**

- Cover `GET/POST/PUT/DELETE` for pages, posts, FAQs, and product list/detail endpoints in the response shapes expected by React admin.

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=AdminCmsBridgeTest`

**Step 3: Write minimal implementation**

- Add only the endpoints required by the user’s scope.

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=AdminCmsBridgeTest`

### Task 5: Wire About Page And Blog/Faq Admin To Storefront

**Files:**
- Modify: `frontend/src/lib/headless/cmsAdapter.ts`
- Modify: `frontend/src/features/cms/pages/BlogListPage.tsx` if needed only for shape compatibility
- Modify: `frontend/src/features/cms/pages/BlogPostPage.tsx` if needed only for shape compatibility
- Test: `frontend/src/features/cms/pages/BlogListPage.test.tsx`
- Test: `frontend/src/features/cms/pages/FaqPage.test.tsx`

**Step 1: Write the failing tests**

- Assert live-like payloads render blog cards and FAQ groups without fallback data.

**Step 2: Run test to verify it fails**

Run: `npm test -- BlogListPage.test.tsx FaqPage.test.tsx`

**Step 3: Write minimal implementation**

- Keep UI changes minimal; prefer adapter fixes.

**Step 4: Run test to verify it passes**

Run: `npm test -- BlogListPage.test.tsx FaqPage.test.tsx`

### Task 6: Add Razorpay Admin Health Endpoint

**Files:**
- Create: `app/Http/Controllers/Api/Admin/PaymentMethodAdminController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/AdminPaymentHealthTest.php`

**Step 1: Write the failing test**

- Assert the Razorpay health endpoint returns configured/not-configured status without leaking secrets.

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=AdminPaymentHealthTest`

**Step 3: Write minimal implementation**

- Read env/config safely and report health.

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=AdminPaymentHealthTest`

### Task 7: Rewire Checkout Adapter To Match Real Backend Flow

**Files:**
- Modify: `frontend/src/lib/headless/checkoutAdapter.ts`
- Modify: `frontend/src/features/checkout/api.ts`
- Test: `frontend/src/features/checkout/__tests__/payment-methods.test.ts`
- Test: `frontend/src/test/msw-handlers.ts` if needed for adapter contract alignment

**Step 1: Write the failing tests**

- Cover:
  - payment methods normalization
  - address persistence into cart
  - shipping persistence before order creation
  - Razorpay intent payload shape

**Step 2: Run test to verify it fails**

Run: `npm test -- payment-methods.test.ts`

**Step 3: Write minimal implementation**

- Follow the real backend sequence instead of the simplified direct `order/store` path.

**Step 4: Run test to verify it passes**

Run: `npm test -- payment-methods.test.ts`

### Task 8: Add Server Endpoints For Razorpay Storefront Checkout

**Files:**
- Modify: `app/Http/Controllers/Api/V2/RazorpayController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/RazorpayCheckoutFlowTest.php`

**Step 1: Write the failing test**

- Cover Razorpay order creation and payment verification endpoints for storefront checkout.

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=RazorpayCheckoutFlowTest`

**Step 3: Write minimal implementation**

- Return only the fields the storefront checkout page needs.

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=RazorpayCheckoutFlowTest`

### Task 9: Exercise Real Local End-To-End Flow

**Files:**
- Modify only if verification reveals a real defect.

**Step 1: Configure local env**

- Set Razorpay test credentials in local env only.

**Step 2: Run storefront locally**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan serve`
- `npm run dev` from `frontend`

**Step 3: Verify flow manually**

- Add product to cart
- Open cart
- Proceed to checkout
- Select address/shipping
- Pay with Razorpay test mode
- Confirm order creation and success state

**Step 4: Fix only verified defects**

- Apply the smallest necessary patch.

### Task 10: Final Verification

**Files:**
- No new files required.

**Step 1: Run backend tests**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test`

**Step 2: Run frontend tests**

Run: `npm test`

**Step 3: Build frontend**

Run: `npm run build`

**Step 4: Report actual status with evidence**

- Include any remaining gaps, especially if guest checkout or a secondary payment path remains outside the verified scope.
