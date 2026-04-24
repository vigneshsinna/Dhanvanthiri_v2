# Playwright Automation Plan

## Runner

Use the existing Playwright setup in `frontend/playwright.config.ts`.

```bash
cd frontend
npm run test:e2e -- storefront-discovery.spec.ts storefront-cart-auth.spec.ts storefront-checkout-funnel.spec.ts storefront-post-purchase.spec.ts storefront-ux-resilience.spec.ts
```

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `STOREFRONT_URL` or `FRONTEND_URL` | React storefront origin |
| `LARAVEL_APP_URL` or `APP_URL` | Laravel backend origin |
| `API_BASE_URL` | Laravel API origin, usually `${LARAVEL_APP_URL}/api` |
| `E2E_SYSTEM_KEY` or `VITE_SYSTEM_KEY` | API system key for `/api/v2` |
| `E2E_CUSTOMER_EMAIL` | Existing seeded customer for authenticated flows |
| `E2E_CUSTOMER_PASSWORD` | Seeded customer password |
| `E2E_ALLOW_MUTATION=true` | Required for cart/order/user/write flows |
| `E2E_DB_IS_DISPOSABLE=true` | Confirms mutation tests are running on disposable data |
| `E2E_MAIL_LOG_URL` | Optional future mail log verification |
| `E2E_SMS_LOG_URL` | Optional future SMS log verification |

## Suites Added

| Suite | Scope |
|---|---|
| `storefront-discovery.spec.ts` | Catalog, category filters, sorting, PDP, variants, wishlist guest prompt, basic search, no-results |
| `storefront-cart-auth.spec.ts` | Cart empty state, login errors, signup validation, forgot password, guarded add-to-cart, credential-gated login, configured social-login buttons |
| `storefront-checkout-funnel.spec.ts` | Guest address validation, invalid coupon, review pricing, shipping, payment processing |
| `storefront-post-purchase.spec.ts` | Confirmation, tracking, account order surface, support/contact, sink-gated notification check, post-purchase review UI |
| `storefront-ux-resilience.spec.ts` | Refresh persistence, disabled checkout controls, synthetic API failure nonblank recovery |

## Mutation Policy

Default runs are read-only. Mutating tests call `skipUnlessMutationAllowed()` and are skipped unless both flags are set:

```bash
E2E_ALLOW_MUTATION=true E2E_DB_IS_DISPOSABLE=true npm run test:e2e
```

## Next Automation Work

- Expand seeded fixture discovery helpers beyond the disposable customer/product/address/coupon/shipping/delivered-order baseline.
- Add order-count/idempotency API assertion for double-submit prevention.
- Add Mailpit/Mailhog/SMS log integration.
- Run OAuth provider redirect completion once providers are configured in sandbox.
- Add mobile viewport projects for cart and checkout layout.
