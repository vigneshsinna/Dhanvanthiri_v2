# Storefront User Flow Test Matrix

| Phase | Flow | Coverage | Priority | Automation | Status |
|---|---|---|---|---|---|
| Discovery | Product listing/category tabs | Product grid, category filter, sort control, refresh safety | P0 | `storefront-discovery.spec.ts` | Automated |
| Discovery | Search | Basic search box, query results, no-results | P1 | `storefront-discovery.spec.ts` | Automated |
| Discovery | Search enhancements | Auto-suggest and recent searches | P2 | Not yet implemented | Deferred |
| Discovery | PDP evaluation | PDP load, image, description/review text, variant control, add-to-cart CTA, refresh | P0 | `storefront-discovery.spec.ts` | Automated |
| Discovery | Wishlist | Guest login prompt; auth add/remove pending seeded credentials | P1 | `storefront-discovery.spec.ts` | Partial |
| Cart/Auth | Cart empty state | Empty cart recovery path | P0 | `storefront-cart-auth.spec.ts` | Automated |
| Cart/Auth | Guest add-to-cart | Add product, cart count, cart persistence after refresh | P0 | `storefront-cart-auth.spec.ts` | Guarded mutation |
| Cart/Auth | Login | Invalid login error; valid login with env credentials | P0 | `storefront-cart-auth.spec.ts` | Partial |
| Cart/Auth | Signup | Client validation; account creation requires disposable DB | P1 | `storefront-cart-auth.spec.ts` | Partial |
| Cart/Auth | Forgot password | Reset request messaging | P2 | `storefront-cart-auth.spec.ts` | Guarded mutation |
| Cart/Auth | Social login | Provider buttons only when backend flags are enabled; redirect URL shape | P2 | `storefront-cart-auth.spec.ts` | Automated/sandbox-gated |
| Cart/Auth | Cart merge | Guest cart then login merge | P0 | Not yet implemented | Gap |
| Checkout | Guest address | Disabled continue until required fields are valid | P0 | `storefront-checkout-funnel.spec.ts` | Automated |
| Checkout | Coupon | Invalid coupon error and total stability | P0 | `storefront-checkout-funnel.spec.ts` | Guarded mutation |
| Checkout | Shipping/review/pricing | Guest review shows subtotal, shipping, total, payment controls | P0 | `storefront-checkout-funnel.spec.ts` | Guarded mutation |
| Checkout | Payment | Processing state and double-submit guard | P0 | `storefront-checkout-funnel.spec.ts` | Guarded mutation |
| Post-purchase | Confirmation | Confirmation page and refresh recovery links | P0 | `storefront-post-purchase.spec.ts` | Automated |
| Post-purchase | Tracking | Required email/phone validation and invalid order not-found state | P0 | `storefront-post-purchase.spec.ts` | Automated |
| Post-purchase | Account orders | Auth order history opens with env customer credentials | P0 | `storefront-post-purchase.spec.ts` | Credential-gated |
| Post-purchase | Notifications | Email/SMS log sink | P1 | `storefront-post-purchase.spec.ts` sink-gated | Test environment gap |
| Post-purchase | Returns/reviews | Return request plus delivered-order review UI, validation, submit | P1/P2 | `storefront-post-purchase.spec.ts` | Partial |
| UX | Refresh persistence | Catalog, PDP, checkout refresh without blank screen | P0 | `storefront-ux-resilience.spec.ts` | Automated |
| UX | Loading/disabled states | Checkout disabled/enabled state; payment processing | P0 | `storefront-ux-resilience.spec.ts` | Automated |
| UX | Error handling | Invalid coupon and synthetic cart 500 nonblank recovery | P0 | `storefront-checkout-funnel.spec.ts`, `storefront-ux-resilience.spec.ts` | Partial |
