# Storefront And Admin Wiring Design

**Date:** 2026-04-13

**Scope:** Fix product image wiring, blog/FAQ/about admin wiring, and storefront cart-checkout-payment integration.

## Problem Summary

- Storefront and React admin expect response shapes that do not match the current Laravel V2 API payloads.
- The storefront FAQ flow is pointing at `pages/faq` instead of a real FAQ collection source.
- The React admin calls `/api/admin/...` CMS and product endpoints that do not exist in the Laravel app yet.
- The checkout adapter does not follow the real V2 cart-address-shipping-order-payment flow closely enough to support a reliable Razorpay checkout.

## Root Causes

### Products

- Storefront/admin product UIs expect `primary_image_url`.
- V2 product APIs return `thumbnail_image`.
- The catalog adapter passes through too much raw V2 data without normalizing image fields consistently.

### Blog

- `cmsAdapter.posts()` expects `res.data.data` and `res.data.meta`.
- V2 `blog-list` returns `blogs.data` inside a `BlogCollection`, plus no top-level `data/meta` in the expected shape.
- Blog UI expects `featured_image_url`, `excerpt`, category objects, and publish dates that are not normalized from the live API.

### FAQ And About

- FAQ storefront uses the wrong source and falls back to hardcoded data.
- About and other static pages already live in `Page`, but the React admin has no live `/api/admin/pages` bridge to update them.
- There is no React-admin-compatible FAQ CRUD API.

### React Admin

- React admin expects `/api/admin/products`, `/api/admin/posts`, `/api/admin/pages`, `/api/admin/faqs`, and payment health endpoints.
- Laravel currently exposes legacy Blade/admin routes and public V2 routes, but not this React admin API surface.

### Checkout And Razorpay

- V2 order placement depends on cart rows being updated with `address_id`, `shipping_type`, and `shipping_cost`.
- The current adapter sends a simplified payload to `order/store` and assumes that is enough.
- Razorpay checkout needs a real server-created order, client-side checkout modal, server-side signature verification/capture, and order finalization.

## Chosen Approach

Use a hybrid bridge approach:

1. Fix storefront adapters to normalize live V2/public API responses correctly.
2. Add a focused Laravel `/api/admin/...` bridge for the React admin screens involved in this scope.
3. Rewire the checkout adapter to mirror the backend’s real cart and payment sequence.
4. Verify with targeted tests and a real Razorpay test checkout using local env configuration only.

## API Design

### Public / Storefront

- Keep using `/api/v2/products`, `/api/v2/blog-list`, `/api/v2/blog-details/{slug}`, `/api/v2/pages/{slug}`.
- Add `GET /api/v2/faqs` for storefront FAQ consumption.
- Normalize response shapes inside frontend adapters instead of changing public V2 payload contracts broadly.

### React Admin Bridge

Add `/api/admin` endpoints that return shapes the React admin already expects:

- `GET /api/admin/products`
- `GET /api/admin/products/{id}`
- `POST /api/admin/products`
- `POST /api/admin/products/{id}` with `_method=PUT`
- `DELETE /api/admin/products/{id}`
- `POST /api/admin/products/{id}/duplicate`
- `GET /api/admin/pages`
- `POST /api/admin/pages`
- `PUT /api/admin/pages/{id}`
- `DELETE /api/admin/pages/{id}`
- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `PUT /api/admin/posts/{id}`
- `DELETE /api/admin/posts/{id}`
- `GET /api/admin/faqs`
- `POST /api/admin/faqs`
- `PUT /api/admin/faqs/{id}`
- `DELETE /api/admin/faqs/{id}`
- `GET /api/admin/payment-methods`
- `GET /api/admin/payment-methods/razorpay/health`

## Checkout Flow Design

For authenticated checkout:

1. Create/select address.
2. Persist address to cart using `update-address-in-cart`.
3. Load seller delivery info using `delivery-info`.
4. Select and persist shipping type using `update-shipping-type-in-cart` or `shipping_cost`, depending on available data.
5. Recompute totals from `cart-summary`.
6. Create the order with `order/store`.
7. For Razorpay, create a Razorpay order on the server with live cart total.
8. Open Razorpay Checkout in the browser.
9. Verify/capture payment server-side.
10. Finalize order payment success path and redirect to storefront confirmation.

For guest checkout:

- Only support it if the existing V2 flow can be verified end-to-end without unsafe assumptions.
- If not fully supported by the backend, preserve current guest UX but clearly keep the verified real E2E path scoped to authenticated checkout.

## Security Notes

- Razorpay credentials must stay in local environment configuration and must not be committed.
- The React admin bridge should require authenticated admin users.
- Payment health output must not expose secrets.

## Verification Strategy

- Frontend adapter unit tests for product/blog/page/FAQ normalization.
- Backend feature tests for the new bridge endpoints and FAQ public endpoint where practical.
- Manual local verification:
  - product image rendering in admin/storefront
  - blog create/edit reflected on storefront
  - FAQ and about page updates reflected on storefront
  - add to cart -> checkout -> Razorpay test payment -> order confirmation

## Constraints

- No git repository is present in this workspace, so the design doc cannot be committed here.
