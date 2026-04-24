# Playwright Automation Plan for Complete Storefront User Flow

## Objective
Automate the complete ecommerce customer journey from discovery to post-purchase.

## Recommended Test Suites
| Suite | Scope |
|---|---|
| `storefront-discovery.spec.ts` | Search, category, filters, PDP, variants, wishlist |
| `storefront-cart-auth.spec.ts` | Add cart, cart management, login, signup, forgot password, cart merge |
| `storefront-guest-checkout.spec.ts` | Guest validation, token, guest checkout, guest confirmation/tracking |
| `storefront-auth-checkout.spec.ts` | Authenticated address, shipping, coupon, COD/gateway flow |
| `storefront-pricing.spec.ts` | Product x quantity - discount + shipping + tax parity |
| `storefront-payment.spec.ts` | Payment intent, confirm, failure, double-submit, refresh recovery |
| `storefront-post-purchase.spec.ts` | Confirmation, account order tracking, guest tracking, returns, support, reviews |
| `storefront-ux-resilience.spec.ts` | Refresh persistence, loading states, error states, accessibility basics |

## Required Environment Variables
```env
APP_URL=
FRONTEND_URL=
API_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
TEST_CUSTOMER_EMAIL=
TEST_CUSTOMER_PASSWORD=
TEST_CUSTOMER_RESET_EMAIL=
E2E_ALLOW_MUTATION=false
E2E_DB_IS_DISPOSABLE=false
E2E_PAYMENT_MODE=test
E2E_GATEWAY=cod
```

## Safe Mutation Rules
Tests that create orders, users, reviews, returns, support tickets, or update data must only run when:
```env
E2E_ALLOW_MUTATION=true
E2E_DB_IS_DISPOSABLE=true
```

## Test Data Requirements
- simple in-stock product
- variant product with size/color
- out-of-stock product
- category with products
- brand with products
- valid coupon
- expired coupon
- shipping zone
- customer user with saved address
- guest checkout email
- test order for tracking
- return-eligible order
- review-eligible product/order

## Recommended Helpers
- `loginAsCustomer(page)`
- `loginAsAdmin(page)`
- `addProductToCart(page, productSlug)`
- `selectVariant(page, options)`
- `applyCoupon(page, code)`
- `fillShippingAddress(page, address)`
- `selectShippingMethod(page, method)`
- `placeCodOrder(page)`
- `placeGatewayOrder(page, gateway)`
- `expectCartTotal(page, expected)`
- `expectNoCriticalConsoleErrors(page)`
- `expectNoBackend500(page)`
- `waitForStorefrontDataRefresh(page)`

## Reporting Requirements
Every run should capture HTML report, screenshots/videos on failure, console errors, failed network requests, backend 500/SQL errors if visible, and test data used.
