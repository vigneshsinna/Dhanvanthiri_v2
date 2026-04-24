# Detailed Storefront E2E Test Cases

## Global Rules

- Use Playwright from `frontend/`.
- Use `STOREFRONT_URL`/`FRONTEND_URL`, `LARAVEL_APP_URL`/`APP_URL`, `API_BASE_URL`, and `E2E_SYSTEM_KEY`.
- Tests that create or mutate cart, user, checkout, order, review, return, or support data must call `skipUnlessMutationAllowed()` and require `E2E_ALLOW_MUTATION=true` plus `E2E_DB_IS_DISPOSABLE=true`.
- Assertions must verify visible customer behavior, not only API calls.
- Real product/order bugs should be fixed only after a focused failing test reproduces them.

## Automated Cases

| ID | Scenario | Expected |
|---|---|---|
| BROWSE-001 | Load `/products` | Product cards render without 404/500/blank page |
| FILTER-001 | Select category tab | Product grid remains populated or shows valid empty state |
| FILTER-004 | Sort price low-high | Sort control accepts low-high option and prices remain visible |
| PDP-001 | Open first PDP | H1, image, price/CTA, and product details render |
| PDP-007 | Variant control | Variant/pack/size control is visible when product data exposes variants |
| PDP-009 | PDP refresh | PDP reloads without blank screen |
| SRCH-001 | Basic search submit | Header search navigates to `/products?search=...` and shows matching products |
| SRCH-002 | Search no-results | Empty backend search response shows a clear no-results state |
| WISH-002 | Guest wishlist | Guest sees login prompt or is routed to login |
| CART-008 | Empty cart | Empty-state recovery link is visible |
| CART-004 | Cart refresh | Guarded mutation test adds item and verifies cart survives reload |
| AUTH-002 | Invalid login | Clear auth error appears |
| AUTH-004 | Signup validation | Required/invalid field messages appear |
| AUTH-005 | Forgot password | Guarded mutation test verifies success/failure reset messaging |
| AUTH-006 | Social login disabled | No provider buttons appear when backend login flags are disabled |
| AUTH-007 | Social login configured | Enabled provider button appears and points at `/social-login/redirect/{provider}` |
| ADDR-002 | Guest address validation | Continue button remains disabled until fields are valid |
| PRICE-003 | Invalid coupon | Guarded mutation test shows coupon error and preserves totals |
| PAY-001 | Order review | Guarded mutation test shows subtotal, shipping, total, payment controls |
| PAY-005 | Double submit | Guarded mutation test enters processing state on payment click |
| POST-001 | Confirmation | Confirmation page renders recovery links |
| TRACK-002 | Guest tracking validation | Requires email or phone and shows not-found state for invalid order |
| REVIEW-001 | Eligible order review | Delivered order item exposes review form and submits to backend review API |
| REVIEW-002 | Ineligible order review | Processing/non-delivered order does not expose review action |
| REVIEW-003 | Review validation | Empty comment shows a validation error before API submit |
| UX-001 | Refresh persistence | Catalog, PDP, and checkout remain nonblank after refresh |
| UX-004 | API failure handling | Synthetic cart 500 leaves React root nonblank |

## Remaining Gaps

- `SRCH-003/004`: auto-suggest and recent searches remain deferred unless backend suggestion support is wired into the React header.
- `POST-003/004`: email/SMS log verification needs `E2E_MAIL_LOG_URL`/`E2E_SMS_LOG_URL` or equivalent test sink.
- `CHECKOUT-ORDER`: full successful checkout/order creation remains guarded by disposable DB mutation flags.
- `CART-MERGE`: guest cart merge after login still needs a seeded authenticated flow.

## Manual Checks Still Required

- Real payment gateway sandbox redirect, cancel, and webhook callback behavior.
- Email/SMS templates and provider delivery logs.
- Return/refund eligibility for delivered seeded orders.
- Social provider OAuth configuration.
- Cart merge behavior with a seeded customer account and a pre-login guest cart.
- Mobile cart/checkout viewport pass.
