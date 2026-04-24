# Complete Storefront User Flow Test Matrix

| Phase | Flow | Test Area | Priority | Automation Type | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Search | Search bar, suggestions, no results, recent searches | P1 | E2E/API | Not Tested | |
| 1 | Browsing | Category navigation, brand navigation, listing pages | P0 | E2E | Not Tested | |
| 1 | Filtering | Size, color, price, brand, availability, sort | P0 | E2E/API | Not Tested | |
| 1 | PDP | Images, zoom/carousel, description, specs | P0 | E2E | Not Tested | |
| 1 | Reviews | Ratings, review list, filters | P2 | E2E/API | Not Tested | |
| 1 | Variants | Size/color/attribute selection, price/stock change | P0 | E2E | Not Tested | |
| 1 | Wishlist | Add/remove wishlist, unauth/auth handling | P1 | E2E/API | Not Tested | |
| 2 | Add to Cart | Add from PDP/listing, feedback toast/drawer | P0 | E2E/API | Not Tested | |
| 2 | Cart Management | Quantity update, remove, move to wishlist | P0 | E2E/API | Not Tested | |
| 2 | Login | Existing user login and state restoration | P0 | E2E/API | Not Tested | |
| 2 | Signup | New user registration and validation | P1 | E2E/API | Not Tested | |
| 2 | Guest Checkout | Email-based checkout without account | P0 | E2E/API | Not Tested | |
| 2 | Forgot Password | Reset link request and validation | P2 | E2E/API | Not Tested | |
| 2 | Social Login | Google/Apple/Facebook redirects where configured | P2 | Manual/E2E stub | Not Tested | |
| 3 | Address | New/saved address, validation, shipping/billing | P0 | E2E/API | Not Tested | |
| 3 | Shipping | Standard/express/next-day, dynamic shipping cost | P0 | E2E/API | Not Tested | |
| 3 | Coupons | Apply/remove valid/invalid/expired coupons | P0 | E2E/API | Not Tested | |
| 3 | Pricing | Product x qty - discount + shipping + tax parity | P0 | E2E/API/DB | Not Tested | |
| 3 | Payment | COD/card/wallet/PayPal/Razorpay/BNPL if enabled | P0 | E2E/API/Webhook | Not Tested | |
| 3 | Order Review | Final summary before order placement | P0 | E2E | Not Tested | |
| 4 | Confirmation | Success page with order ID/summary | P0 | E2E/API | Not Tested | |
| 4 | Notifications | Email/SMS confirmation and shipping updates | P1 | API/log/mailhog | Not Tested | |
| 4 | Tracking | Guest and account order tracking | P0 | E2E/API | Not Tested | |
| 4 | Returns | Return/refund initiation | P1 | E2E/API | Not Tested | |
| 4 | Support | Contact/support ticket from order | P2 | E2E/API | Not Tested | |
| 4 | Review | Post-purchase product review submission | P2 | E2E/API | Not Tested | |
| UX | State Persistence | Cart/checkout/auth state survives refresh | P0 | E2E | Not Tested | |
| UX | Loading States | Skeleton/spinner during API operations | P1 | E2E/Visual | Not Tested | |
| UX | Double Submit | Pay/place-order buttons disabled while processing | P0 | E2E | Not Tested | |
| UX | Error Handling | Toasts/inline errors for invalid inputs | P0 | E2E | Not Tested | |
