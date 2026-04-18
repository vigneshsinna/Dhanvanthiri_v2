# Storefront Account & Guest Checkout — QA Checklist

**Date:** 2026-04-15  
**Version:** 1.0

---

## 1. Guest Checkout Happy Path

- [ ] **Add items to cart as guest** — products appear in cart with correct prices
- [ ] **Navigate to /checkout** — guest checkout form appears (not forced to login)
- [ ] **Fill guest details** — email, phone, recipient name, address fields
- [ ] **Click "Continue to Payment"** — validates guest info, proceeds to payment step
- [ ] **Select COD** — place order, redirects to confirmation page
- [ ] **Confirmation page shows** — order number, COD notice, "Create Account" section
- [ ] **Click "Create Account"** — password form appears
- [ ] **Set password + confirm** — account claim succeeds, success message shown
- [ ] **Sign in with claimed email/password** — login works, can see order history

---

## 2. Guest Checkout — Razorpay Flow

- [ ] **Select Razorpay as gateway** — Razorpay modal opens
- [ ] **Complete payment in modal** — payment confirmed, redirects to confirmation
- [ ] **Confirmation page shows order number** — payment confirmed message
- [ ] **Guest claim available** — "Create Account" button visible

---

## 3. Guest Order Tracking

- [ ] **Navigate to /track-order** — tracking form displayed
- [ ] **Enter order number + email** — submit finds order
- [ ] **Order data displayed** — status, grand total, items, shipments, timeline
- [ ] **Enter order number + phone** — submit finds order
- [ ] **Enter invalid order number** — shows "Order not found" error
- [ ] **Submit without email or phone** — shows validation error
- [ ] **Submit without order number** — field required validation

---

## 4. Guest Order Detail Access

- [ ] **Navigate to /order/{orderNumber}?order_access_token=xxx** — order detail loads
- [ ] **Navigate to /order/{orderNumber}?guest_checkout_token=xxx** — order detail loads
- [ ] **Navigate to /order/{orderNumber} (no tokens)** — shows "Order not found"
- [ ] **Guest detail page shows** — items, summary, shipping address, payment info

---

## 5. Authenticated Checkout (Regression)

- [ ] **Login as customer** — redirected to home
- [ ] **Add items to cart** — items appear
- [ ] **Navigate to /checkout** — address selection step shown (not guest form)
- [ ] **Select existing address** — address highlighted
- [ ] **Add new address** — form works, address saved
- [ ] **Continue to payment** — summary shows correct totals
- [ ] **Select Razorpay** — payment modal opens
- [ ] **Complete payment** — confirmation page, can view in /account/orders

---

## 6. Authenticated Order Management (Regression)

- [ ] **GET /account/orders** — order list page loads with orders
- [ ] **Click order** — order detail page loads
- [ ] **Cancel order** — cancel dialog works, order status updates
- [ ] **Return request** — return form works
- [ ] **Re-order** — items added to cart
- [ ] **Download invoice** — PDF downloads

---

## 7. Wishlist (Regression)

- [ ] **Add product to wishlist** — success toast, product appears in wishlist page
- [ ] **Remove from wishlist** — product removed
- [ ] **Wishlist uses slug** — verify no numeric ID fallback in network tab

---

## 8. Admin Panel (Scope Reduction)

- [ ] **Login as admin** — admin dashboard loads
- [ ] **Navigation shows only backed items:**
  - Dashboard ✓
  - OMS → Order Operations ✓
  - OMS → Payment Methods ✓
  - Catalog → Products ✓
  - Catalog → Categories ✓
  - CMS → Pages ✓
  - CMS → Posts ✓
  - CMS → FAQs ✓
- [ ] **Hidden items NOT shown:**
  - Shipments, Returns, Tracking, Payments (under OMS)
  - Brands, Inventory, Reviews, Attributes, Colors, Size Charts, Warranties (under Catalog)
  - Banners, Media Library (under CMS)
  - Marketing section entirely
  - Customers section entirely
  - Reports section entirely
  - License & System section entirely
  - Settings section entirely
- [ ] **Direct URL /admin/shipments** — shows empty/fallback, not a crash

---

## 9. Auth Normalization (Regression)

- [ ] **Login response** — contains `user.type`, `user.role`, `user.email_verified`
- [ ] **Page refresh** — `/auth/user` returns same shape as login
- [ ] **No identity downgrade on refresh** — admin stays admin, customer stays customer

---

## 10. API Security

- [ ] **Guest checkout token** — expired token returns 422
- [ ] **Guest checkout token** — invalid/random token returns 422
- [ ] **Order access token** — expired token returns 404
- [ ] **Wallet gateway blocked for guests** — returns 422 with "signed-in" message
- [ ] **Email collision** — using a claimed email for guest checkout returns error
- [ ] **Double account claim** — second claim attempt returns 422

---

## 11. Edge Cases

- [ ] **Empty cart checkout** — shows "Your cart is empty" with browse button
- [ ] **Payment gateway not loaded** — shows error message, doesn't crash
- [ ] **Razorpay modal dismissed** — returns to payment step, can retry
- [ ] **Network error during payment** — error message shown, can retry
- [ ] **Back button in checkout** — returns to address step correctly
