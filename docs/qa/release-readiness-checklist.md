# 🚀 Release Readiness Checklist: Storefront & Admin Integration

**Version:** 1.1  
**Project:** Dhanvathiri v2 (React + Laravel Headless)  
**Release Target:** Public Storefront Cutover  

---

## 1. Quick Smoke Test (5-Minute Verification)
*Perform these first after any deployment to the staging/production environment.*

- [ ] **Home Page**: Hero slider, featured categories, and "Today's Deal" section load correctly.
- [ ] **Search**: Searching for a known product (e.g., "Aspirin") returns valid results.
- [ ] **Guest Checkout**: Add product to cart → Go to /checkout → Fill guest form → Select COD → Success.
- [ ] **Auth**: Login as existing customer → View /account/orders → Logout.
- [ ] **Admin Reflection**: Change a product price in Admin → Verify it updates on Storefront immediately (or after cache clear).
- [ ] **Direct Access**: Refresh the browser on `/checkout` or `/account` (tests SPA fallback/routing).

---

## 2. Regression Matrix: Core Ecommerce Paths

| Feature | Scenario | Guest | Auth | Admin/Seller |
| :--- | :--- | :---: | :---: | :---: |
| **Catalog** | Slug-based product/category navigation | ✅ | ✅ | N/A |
| **Cart** | Persistence across page refreshes | ✅ | ✅ | N/A |
| **Checkout** | Shipping address creation/selection | ✅ | ✅ | N/A |
| **Payments** | Cash on Delivery (COD) flow | ✅ | ✅ | N/A |
| **Payments** | Razorpay (External Gateway) flow | ✅ | ✅ | N/A |
| **Payments** | Wallet (In-app balance) flow | ❌ | ✅ | N/A |
| **Orders** | Order creation & ID generation | ✅ | ✅ | ✅ |
| **Tracking** | Track by Order ID + Phone/Email | ✅ | N/A | ✅ |
| **Account** | Claiming a guest order into a new account | ✅ | N/A | N/A |

---

## 3. Module-by-Module Walkthroughs

### 3.1 Storefront Wiring (React <-> Laravel)
- [ ] **API Base URL**: Verify `VITE_API_BASE_URL` points to the correct backend environment.
- [ ] **System Key**: Ensure `x-system-key` header is present in all outgoing API requests from the frontend.
- [ ] **SPA Fallback**: Verify that non-API/non-Admin routes (e.g., `/products/any-slug`) are handled by `index.php` to serve the React app.
- [ ] **CORS**: Verify no CORS errors when the React frontend (e.g., on `FRONTEND_URL`) calls the Laravel API.
- [ ] **Asset Paths**: Verify images/logos from `public/uploads` render correctly in the React components.

### 3.2 Guest Checkout & Account Conversion
- [ ] **No-Login Barrier**: Verify the checkout button doesn't force a redirect to `/login`.
- [ ] **Guest Form**: Verify validation for Email/Phone/Address in the guest checkout step.
- [ ] **Order Success**: Verify the guest is shown an order confirmation page with a "Create Account to Track" option.
- [ ] **Account Claim**: Verify that setting a password on the success page correctly creates a user record and links the order.
- [ ] **Email Collision**: Attempt guest checkout with an email that already has an account (should prompt to login).

### 3.3 Payments & Order Lifecycle
- [ ] **COD Flow**: Order creates as `pending`, lands on success page.
- [ ] **Wallet Flow**: (Auth only) Verify balance is deducted and order status updates to `paid`.
- [ ] **Razorpay/External**: 
    - [ ] Modal opens correctly.
    - [ ] Dismissing modal returns to checkout (no crash).
    - [ ] Successful payment redirects to `/checkout/success?payment_id=xxx`.
    - [ ] Failed payment redirects to `/checkout/failure` or stays on payment step with error.
- [ ] **Inventory Sync**: Verify product stock decreases after a successful order.

### 3.4 Order Tracking & Detail Access
- [ ] **Public Tracker**: Verify `/track-order` works with `Order ID` + `Phone/Email`.
- [ ] **Tokenized Access**: Verify guest order detail links (e.g., `/order/123?order_access_token=...`) load without login.
- [ ] **Auth History**: Verify `/account/orders` shows the new order immediately after placement.

### 3.5 Admin-Backed Content (CMS/Catalog)
- [ ] **Business Settings**: Verify Store Name and Logo in Header/Footer match Admin → Business Settings.
- [ ] **Homepage Sliders**: Verify Sliders in Admin → Website Setup → Sliders reflect on the React home page.
- [ ] **Flash Deals**: Verify active Flash Deals from Admin show the countdown and correct discounted prices.
- [ ] **CMS Pages**: Verify `/page/about-us` and `/page/contact-us` (if enabled in Admin) render their HTML content correctly.
- [ ] **Product Visibility**: Hide a product in Admin → Verify it returns 404 or disappears from Storefront search/lists.

---

## 4. Environment-Specific Verification

### 4.1 Deployment & Routing
- [ ] **Laravel Admin**: Verify `/admin` is still accessible and functional after React deployment.
- [ ] **Vite Proxy**: In development, verify `/api/v2` proxies to `:8000`. In production, verify direct pathing.
- [ ] **HTTPS**: Verify all API calls and asset loads are forced over HTTPS.
- [ ] **Symlink/Storage**: Verify `php artisan storage:link` is executed so uploads are accessible.

### 4.2 SEO & Social
- [ ] **Sitemap**: Verify `sitemap.xml` includes the new React routes (products/categories).
- [ ] **Robots.txt**: Verify `robots.txt` allows indexing of public routes but disallows `/admin` and `/account`.
- [ ] **Meta Tags**: Check `<title>` and `<meta name="description">` on a Product Detail Page.

---

## 5. Release Blockers (Go/No-Go Criteria)

| Category | Blocker Condition | Severity |
| :--- | :--- | :---: |
| **Checkout** | Payment gateway modal fails to open | 🛑 CRITICAL |
| **Checkout** | Guest order fails to save to database | 🛑 CRITICAL |
| **Routing** | Page refresh on `/checkout` results in a 404 | 🛑 CRITICAL |
| **Branding** | Hardcoded "Animazon" or generic logo on footer/header | ⚠️ HIGH |
| **Tracking** | Guest cannot track their order after placement | ⚠️ HIGH |
| **Admin** | Admin cannot edit products or view orders | 🛑 CRITICAL |

---

## 6. Post-Release Monitoring Checklist

- [ ] **Error Logs**: Monitor `storage/logs/laravel.log` for any 500s from the new `v2` API endpoints.
- [ ] **Conversion Rate**: Compare order volume vs. historical data to ensure the new flow isn't dropping users.
- [ ] **Payment Success Rate**: Monitor Razorpay/Gateway dashboard for "Aborted" or "Failed" payment spikes.
- [ ] **Frontend Logs**: Check Sentry/Log monitoring for client-side JS crashes in the React app.
- [ ] **SEO Indexing**: Use Google Search Console to verify new React URLs are being crawled correctly.

---

## 🛠️ Developer Checklist (Before Handover)

1. [ ] Run `npm run build` in `/frontend` and verify `dist/` is empty of dev-only code.
2. [ ] Ensure `.env` in production has `FRONTEND_URL` and `SYSTEM_KEY` defined.
3. [ ] Clear all caches: `php artisan cache:clear`, `php artisan view:clear`, `php artisan config:clear`.
4. [ ] Verify `public/index.php` fallback logic is active for React routing.
