# Storefront, Account, And Guest Checkout Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the storefront/account contract mismatches, add a real guest checkout bridge with guest session persistence, and keep React admin limited to the already-backed Laravel bridge features.

**Architecture:** Laravel remains the owner of `/admin/*` while React storefront continues consuming `/api/v2` and the narrow `/api/admin` bridge already present. Guest checkout is implemented through a persisted guest customer record plus a dedicated guest checkout session token, then handed into the existing order/payment flow with idempotent guest-specific endpoints.

**Tech Stack:** Laravel, Sanctum, React, Vite, React Query, Vitest, Laravel feature tests, Razorpay PHP SDK, Razorpay Checkout JS

---

### Task 1: Add Guest Lifecycle Persistence

**Files:**
- Create: `database/migrations/2026_04_15_000001_add_guest_flags_to_users_table.php`
- Create: `database/migrations/2026_04_15_000002_create_guest_checkout_sessions_table.php`
- Modify: `app/Models/User.php`
- Create: `app/Models/GuestCheckoutSession.php`
- Test: `tests/Feature/Api/GuestCheckoutPersistenceTest.php`

**Step 1: Write the failing tests**

- Add tests that assert:
  - guest-capable users can be marked with `is_guest`
  - claimed accounts use `account_claimed_at`
  - guest checkout sessions persist token hash, status, expiry, temp cart binding, and optional `combined_order_id`

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPersistenceTest`
Expected: FAIL because the migrations/model do not exist yet.

**Step 3: Write minimal implementation**

- Add `is_guest` boolean and `account_claimed_at` nullable timestamp to `users`
- Create `guest_checkout_sessions` with:
  - `guest_user_id`
  - `temp_user_id`
  - `guest_checkout_token_hash`
  - `status`
  - `combined_order_id`
  - `order_code`
  - `expires_at`
- Add `guestCheckoutSessions()` relationship on `User`
- Add `GuestCheckoutSession` model with status constants:
  - `initiated`
  - `validated`
  - `cart_bound`
  - `payment_pending`
  - `payment_authorized`
  - `order_completed`
  - `expired`
  - `abandoned`
  - `failed`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPersistenceTest`
Expected: PASS

**Step 5: Continue without commit**

- No git repository is present in this workspace.

### Task 2: Add Guest Session Service And Validate Flow

**Files:**
- Create: `app/Support/GuestCheckout/GuestCheckoutService.php`
- Create: `app/Http/Controllers/Api/V2/GuestCheckoutController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/GuestCheckoutValidateTest.php`

**Step 1: Write the failing tests**

- Cover `POST /api/v2/guest/checkout/validate`
- Assert:
  - `temp_user_id` cart is required
  - guest details are required
  - claimed-account email is rejected with a sign-in required message
  - existing guest email can be reused only when `is_guest = true` and `account_claimed_at` is null
  - successful validation returns `guest_checkout_token` and expires metadata

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutValidateTest`
Expected: FAIL because the route/controller/service do not exist yet.

**Step 3: Write minimal implementation**

- Add guest route group:
  - `POST /api/v2/guest/checkout/validate`
- Implement service behavior:
  - validate guest cart by `temp_user_id`
  - reject claimed-account email reuse
  - create or reuse only guest user rows
  - create/refresh a guest checkout session
  - hash the token before storing it
  - set `status = validated`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutValidateTest`
Expected: PASS

### Task 3: Make Cart Handoff Idempotent

**Files:**
- Modify: `app/Support/GuestCheckout/GuestCheckoutService.php`
- Modify: `app/Http/Controllers/Api/V2/GuestCheckoutController.php`
- Test: `tests/Feature/Api/GuestCheckoutCartHandoffTest.php`

**Step 1: Write the failing tests**

- Add tests that prove:
  - guest validation binds the cart from `temp_user_id` to `user_id`
  - retrying validate does not duplicate cart rows
  - retrying validate does not create duplicate guest addresses
  - original `temp_user_id` remains auditable on the checkout session

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutCartHandoffTest`
Expected: FAIL

**Step 3: Write minimal implementation**

- Move the cart handoff into a transaction
- Rebind cart rows only once
- Create or update a guest address row for the guest user
- Update session status to `cart_bound`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutCartHandoffTest`
Expected: PASS

### Task 4: Add Guest Summary Endpoint

**Files:**
- Modify: `app/Http/Controllers/Api/V2/GuestCheckoutController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/GuestCheckoutSummaryTest.php`
- Test: `frontend/src/features/checkout/__tests__/guest-checkout-contract.test.ts`

**Step 1: Write the failing tests**

- Cover `POST /api/v2/guest/checkout/summary`
- Assert:
  - `guest_checkout_token` is required
  - expired sessions are rejected
  - valid sessions return stable totals from the rebound guest cart

**Step 2: Run tests to verify they fail**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutSummaryTest`
- `npm test -- guest-checkout-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `POST /api/v2/guest/checkout/summary`
- Resolve guest session by token hash
- Return the same totals contract used by authenticated checkout, but sourced from guest session context
- Update frontend test expectations away from old `/guest/*` `/api` client assumptions if needed

**Step 4: Run tests to verify they pass**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutSummaryTest`
- `npm test -- guest-checkout-contract.test.ts`
Expected: PASS

### Task 5: Add Idempotent Guest Payment Intent

**Files:**
- Modify: `app/Http/Controllers/Api/V2/GuestCheckoutController.php`
- Modify: `app/Support/GuestCheckout/GuestCheckoutService.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/GuestCheckoutPaymentIntentTest.php`
- Modify: `frontend/src/lib/headless/checkoutAdapter.ts`
- Test: `frontend/src/lib/headless/checkoutAdapter.test.ts`

**Step 1: Write the failing tests**

- Cover `POST /api/v2/guest/payments/intent`
- Assert:
  - valid token required
  - same guest session reuses existing pending combined order when appropriate
  - Razorpay payload includes order id, order number, key id, amount, currency
  - COD and wallet flows remain deterministic

**Step 2: Run tests to verify they fail**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPaymentIntentTest`
- `npm test -- checkoutAdapter.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `POST /api/v2/guest/payments/intent`
- Create or reuse one active `CombinedOrder` per recoverable guest session
- Persist `combined_order_id`, `order_code`, and `status = payment_pending`
- Update `checkoutAdapter.guestCreatePaymentIntent()` to call the new guest endpoint using `headlessApi`

**Step 4: Run tests to verify they pass**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPaymentIntentTest`
- `npm test -- checkoutAdapter.test.ts`
Expected: PASS

### Task 6: Add Idempotent Guest Payment Confirm

**Files:**
- Modify: `app/Http/Controllers/Api/V2/GuestCheckoutController.php`
- Modify: `app/Support/GuestCheckout/GuestCheckoutService.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/GuestCheckoutPaymentConfirmTest.php`
- Modify: `frontend/src/lib/headless/checkoutAdapter.ts`
- Test: `frontend/src/features/checkout/__tests__/guest-checkout-contract.test.ts`

**Step 1: Write the failing tests**

- Cover `POST /api/v2/guest/payments/confirm`
- Assert:
  - token required
  - confirm is idempotent for repeated requests
  - successful confirm sets session status to `payment_authorized` then `order_completed`
  - invalid signature is rejected

**Step 2: Run tests to verify they fail**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPaymentConfirmTest`
- `npm test -- guest-checkout-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `POST /api/v2/guest/payments/confirm`
- Resolve guest session by token
- Verify Razorpay signature and capture if needed
- Mark checkout session completed safely on duplicate confirms
- Update `checkoutAdapter.confirmPayment()`/guest confirm usage to pass guest token context

**Step 4: Run tests to verify they pass**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestCheckoutPaymentConfirmTest`
- `npm test -- guest-checkout-contract.test.ts`
Expected: PASS

### Task 7: Add Guest Confirmation And Tracking Access

**Files:**
- Create: `app/Http/Controllers/Api/V2/GuestOrderAccessController.php`
- Modify: `routes/api.php`
- Modify: `frontend/src/lib/headless/accountAdapter.ts`
- Modify: `frontend/src/features/orders/api.ts`
- Test: `tests/Feature/Api/GuestOrderAccessTest.php`
- Test: `frontend/src/features/orders/__tests__/guest-tracking-contract.test.ts`

**Step 1: Write the failing tests**

- Cover:
  - `GET /api/v2/orders/track`
  - `GET /api/v2/orders/{orderNumber}`
- Assert:
  - order-number lookup is explicit and consistent
  - guest access requires signed/time-bounded token or guest checkout token
  - access is rate-limited and generic on failure

**Step 2: Run tests to verify they fail**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestOrderAccessTest`
- `npm test -- guest-tracking-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add guest-safe tracking/detail controller
- Standardize backend support for order-number lookup
- Update `accountAdapter.guestOrderTracking()` to stop calling the web route and use the new API route
- Rate-limit and time-bound signed order access

**Step 4: Run tests to verify they pass**

Run:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestOrderAccessTest`
- `npm test -- guest-tracking-contract.test.ts`
Expected: PASS

### Task 8: Add Claim-Account Follow-Up Path Foundation

**Files:**
- Create: `app/Http/Controllers/Api/V2/GuestAccountClaimController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/GuestAccountClaimTest.php`
- Modify: `frontend/src/features/payment/pages/OrderConfirmationPage.tsx`

**Step 1: Write the failing tests**

- Add tests for a minimal claim-foundation endpoint that:
  - resolves guest user by valid guest/session/order access
  - sets password
  - flips `is_guest` false
  - sets `account_claimed_at`
  - reuses the same user row

**Step 2: Run test to verify it fails**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestAccountClaimTest`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add a foundation endpoint for future claim flow
- Add confirmation-page hooks for:
  - `Continue as guest`
  - `Create/claim your account`

**Step 4: Run test to verify it passes**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test --filter=GuestAccountClaimTest`
Expected: PASS

### Task 9: Fix Storefront Account Contract Mismatches

**Files:**
- Modify: `app/Http/Controllers/Api/V2/AuthController.php`
- Modify: `app/Http/Controllers/Api/V2/ProfileController.php`
- Modify: `app/Http/Controllers/Api/V2/AddressController.php`
- Modify: `frontend/src/lib/headless/authAdapter.ts`
- Modify: `frontend/src/lib/headless/client.ts`
- Modify: `frontend/src/lib/headless/checkoutAdapter.ts`
- Modify: `frontend/src/lib/headless/accountAdapter.ts`
- Test: `frontend/src/lib/headless/authAdapter.test.ts`
- Test: `frontend/src/features/checkout/__tests__/address-contract.test.ts`
- Test: `frontend/src/features/wishlist/__tests__/wishlist-contract.test.ts`
- Test: `frontend/src/features/orders/__tests__/oms-contract.test.ts`

**Step 1: Write the failing tests**

- Cover:
  - `/auth/user` normalization
  - no fake refresh retry behavior
  - avatar upload contract alignment
  - address payload alignment to id-based backend data
  - wishlist slug handling
  - order detail lookup by standardized order number

**Step 2: Run tests to verify they fail**

Run:
- `npm test -- authAdapter.test.ts address-contract.test.ts wishlist-contract.test.ts oms-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Normalize `AuthController::user()` to return the login-style payload
- Remove placeholder refresh behavior in `frontend/src/lib/headless/client.ts`
- Align avatar upload contract either by frontend base64 encoding or backend multipart acceptance
- Align checkout address creation/update with country/state/city ids
- Ensure wishlist add/remove always carries slug
- Make order detail adapter use the finalized backend identifier contract

**Step 4: Run tests to verify they pass**

Run:
- `npm test -- authAdapter.test.ts address-contract.test.ts wishlist-contract.test.ts oms-contract.test.ts`
Expected: PASS

### Task 10: Limit React Admin To Backed Bridge Features

**Files:**
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/features/admin/config/navigation.ts`
- Modify: `frontend/src/features/admin/api.ts`
- Test: `frontend/src/features/admin/__tests__/admin-workflow-contract.test.ts`

**Step 1: Write the failing tests**

- Assert unsupported admin routes/navigation items are hidden or removed from the live React admin surface for this pass.

**Step 2: Run test to verify it fails**

Run: `npm test -- admin-workflow-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Keep React admin limited to currently backed bridge features:
  - products
  - pages
  - posts
  - faqs
  - payment-method visibility/health
- Remove or hide unsupported navigation/routes that would otherwise 404 against `/api/admin`

**Step 4: Run test to verify it passes**

Run: `npm test -- admin-workflow-contract.test.ts`
Expected: PASS

### Task 11: Frontend Route And UI Changes

**Files:**
- Modify: `frontend/src/features/checkout/pages/CheckoutPage.tsx`
- Modify: `frontend/src/features/checkout/api.ts`
- Modify: `frontend/src/features/orders/pages/OrderTrackingPage.tsx`
- Modify: `frontend/src/features/orders/pages/OrderDetailPage.tsx`
- Modify: `frontend/src/features/payment/pages/OrderConfirmationPage.tsx`
- Test: `frontend/src/features/checkout/pages/checkoutpage.test.tsx`
- Test: `frontend/src/features/orders/pages/orderdetailpage.test.tsx`

**Step 1: Write the failing tests**

- Cover:
  - guest checkout validate returns and stores guest token
  - guest summary/intent/confirm reuse that token
  - confirmation page offers continue/claim actions
  - tracking/detail pages use the standardized guest-safe route

**Step 2: Run tests to verify they fail**

Run:
- `npm test -- checkoutpage.test.tsx orderdetailpage.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

- Store guest checkout token in checkout state only for the active guest flow
- Pass it through guest summary, payment intent, payment confirm, and confirmation/tracking flows
- Update confirmation UI copy and action buttons
- Ensure success/confirmation pages do not depend on login state

**Step 4: Run tests to verify they pass**

Run:
- `npm test -- checkoutpage.test.tsx orderdetailpage.test.tsx`
Expected: PASS

### Task 12: QA Scenarios And Rollback Checks

**Files:**
- Create: `docs/qa/2026-04-15-storefront-account-guest-wiring-checklist.md`

**Step 1: Write the QA checklist**

- Include:
  - guest checkout happy path
  - guest checkout retry/idempotency path
  - claimed-email rejection path
  - guest confirmation without login
  - guest tracking with signed/time-bounded access
  - wishlist/order detail regressions
  - limited React admin verification
  - rollback checks for new migrations and guest routes

**Step 2: Run backend verification**

Run: `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan test`
Expected: PASS or a documented list of failing pre-existing tests.

**Step 3: Run frontend verification**

Run: `npm test`
Expected: PASS or a documented list of failing pre-existing tests.

**Step 4: Run build verification**

Run: `npm run build`
Expected: PASS

**Step 5: Manual smoke verification**

Run locally:
- `C:\php-8.4.10-nts-Win32-vs17-x64\php.exe artisan serve`
- `npm run dev` from `frontend`

Manually verify:
- guest cart creation and validate flow
- guest Razorpay/COD path
- guest confirmation page after refresh
- guest tracking/detail access
- authenticated checkout still works
- supported React admin bridge pages still work

**Step 6: Report actual status with evidence**

- Document any remaining gaps, especially if webhook reconciliation or claim-account UI remains partial in this pass.
