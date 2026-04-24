# Detailed Storefront End-to-End Test Cases

## General Test Rules
For every user flow, verify page loads without 404/500, API requests return expected status, loading/success/error states render, refresh behavior is correct, browser console has no critical errors, and cart/order/pricing state is consistent between UI and backend.

## Phase 1: Discovery & Evaluation

### Search
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SRCH-001 | Basic search | Enter product keyword and submit | Results page loads matching products | P1 |
| SRCH-002 | Auto-suggest | Type partial keyword | Suggestions appear without crash | P2 |
| SRCH-003 | No results | Search unlikely keyword | Friendly no-results state appears | P2 |
| SRCH-004 | Recent searches | Search term, return to search | Recent search appears if feature exists | P3 |
| SRCH-005 | Search refresh | Refresh search URL | Same results or valid state loads | P1 |

### Browsing, Filtering, Sorting
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| BROWSE-001 | Category listing | Open category page | Products load and category title visible | P0 |
| BROWSE-002 | Brand listing | Open brand page | Products for brand load correctly | P1 |
| FILTER-001 | Price filter | Apply min/max price | Products match price range | P0 |
| FILTER-002 | Brand filter | Apply brand filter | Products match selected brand | P1 |
| FILTER-003 | Size/color filter | Apply variant filters | Products reflect selected variants | P1 |
| FILTER-004 | Sort price low-high | Select sort | Product order is ascending | P1 |
| FILTER-005 | Filter URL persistence | Apply filters and refresh | Filters remain applied or restore from URL | P1 |

### Product Detail Page
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PDP-001 | PDP load | Open `/products/{slug}` | Product data, price, image, CTA render | P0 |
| PDP-002 | Image carousel | Click thumbnails/next | Image changes correctly | P1 |
| PDP-003 | Zoom/lightbox | Open zoom if available | Opens and closes correctly | P2 |
| PDP-004 | Description/specs | View product details | Backend description/specs render | P1 |
| PDP-005 | Reviews | Open reviews | Reviews or empty state shown | P2 |
| PDP-006 | Review filter | Filter by rating if available | Reviews update correctly | P3 |
| PDP-007 | Variant selection | Select size/color | Price/stock/SKU/CTA update | P0 |
| PDP-008 | Out-of-stock variant | Select unavailable variant | Add to cart disabled or warning shown | P0 |
| PDP-009 | PDP refresh | Refresh selected product | No blank screen | P1 |

### Wishlist
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| WISH-001 | Auth wishlist add/remove | Login, add/remove product | Wishlist updates correctly | P1 |
| WISH-002 | Guest wishlist behavior | Add as guest | Login prompt or local wishlist behavior is clear | P2 |
| WISH-003 | Wishlist persistence | Refresh wishlist page | State persists | P1 |

## Phase 2: Cart & Authentication

### Add to Cart and Cart Management
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| CART-001 | Add simple product | Click Add to Cart | Cart count updates and toast/drawer appears | P0 |
| CART-002 | Add variant product | Select variant and add | Correct variant added | P0 |
| CART-003 | Add from listing | Add product from listing if supported | Product added without losing place | P1 |
| CART-004 | Cart refresh | Add product and refresh | Cart still contains item | P0 |
| CART-005 | Stock limit | Add beyond stock | Friendly stock error shown | P0 |
| CART-006 | Quantity update | Increase/decrease quantity | Totals update correctly | P0 |
| CART-007 | Remove item | Remove item | Item removed and totals update | P0 |
| CART-008 | Empty cart | Remove all items | Empty state appears | P1 |

### Authentication
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| AUTH-001 | Login valid | Login with valid credentials | Auth state persists after refresh | P0 |
| AUTH-002 | Login invalid | Submit wrong password | Clear error shown | P0 |
| AUTH-003 | Signup | Register test user | Account created or verification flow shown | P1 |
| AUTH-004 | Signup validation | Submit invalid fields | Field-level errors shown | P1 |
| AUTH-005 | Forgot password | Request reset | Success message/email log generated | P2 |
| AUTH-006 | Social login | Click configured provider | Redirect or disabled-state is correct | P2 |
| AUTH-007 | Guest cart merge | Add cart as guest then login | Guest cart merges with account cart | P0 |

### Guest Checkout
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| GUEST-001 | Start guest checkout | Add cart item and continue as guest | Email/address step opens | P0 |
| GUEST-002 | Existing account email | Enter claimed account email | Asked to sign in; no silent binding | P0 |
| GUEST-003 | Guest validation | Enter valid guest details | Guest session/token created | P0 |
| GUEST-004 | Guest refresh | Refresh after validation | Checkout resumes or recovery shown | P0 |
| GUEST-005 | Guest confirmation | Complete order as guest | Success page loads without login | P0 |
| GUEST-006 | Guest tracking | Track guest order | Works securely with token/order code | P0 |

## Phase 3: Checkout Funnel

### Address, Shipping, Coupons, Pricing
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| ADDR-001 | Add new address | Fill address form | Address saves and is selected | P0 |
| ADDR-002 | Required validation | Submit empty required fields | Field-level errors shown | P0 |
| ADDR-003 | Saved address | Login and select saved address | Address persists to next step | P0 |
| SHIP-001 | Standard shipping | Select standard | Cost updates correctly | P0 |
| SHIP-002 | Express shipping | Select expedited | Cost/estimate update | P1 |
| SHIP-003 | Free shipping | Meet threshold | Shipping becomes free where configured | P1 |
| PRICE-001 | Base total | Product x quantity | Subtotal matches calculation | P0 |
| PRICE-002 | Valid coupon | Apply valid code | Discount applies correctly | P0 |
| PRICE-003 | Invalid coupon | Apply invalid code | Friendly error, no discount | P0 |
| PRICE-004 | Remove coupon | Remove code | Totals recalculate | P0 |
| PRICE-005 | Tax calculation | Proceed to review | Tax shown according to config | P0 |
| PRICE-006 | Final parity | Compare UI vs backend order total | Totals match | P0 |

### Payment and Review
| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PAY-001 | Order review | Reach review step | Items, address, shipping, tax, total visible | P0 |
| PAY-002 | COD order | Place COD order if enabled | Order created and success page shown | P0 |
| PAY-003 | Gateway order | Use test gateway | Redirect/payment completes | P0 |
| PAY-004 | Failed payment | Simulate fail/cancel | Failure state shown; order not wrongly paid | P0 |
| PAY-005 | Double-submit | Double-click place/pay | Only one order/payment attempt created | P0 |
| PAY-006 | Payment loading | Click pay | Button disabled and loading shown | P0 |
| PAY-007 | Refresh during payment | Refresh before/after redirect | Recoverable state, no duplicate order | P0 |

## Phase 4: Post-Purchase

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| POST-001 | Success page | Complete order | Order ID/code and summary visible | P0 |
| POST-002 | Confirmation refresh | Refresh success page | Page resolves safely | P0 |
| POST-003 | Email notification | Complete order | Email log/mailhog contains confirmation | P1 |
| POST-004 | SMS notification | Complete order if SMS enabled | SMS job/log created or skipped cleanly | P2 |
| TRACK-001 | Account tracking | Login and open tracking | Status/timeline loads | P0 |
| TRACK-002 | Guest tracking | Track with order code/token | Status/timeline loads securely | P0 |
| TRACK-003 | Admin status reflection | Change admin status | Storefront tracking updates | P0 |
| RETURN-001 | Return request | Initiate return if eligible | Request created or eligibility message shown | P1 |
| SUPPORT-001 | Contact support | Submit support/contact form | Ticket/message created | P2 |
| REVIEW-001 | Leave review | Submit review for purchased product | Review saved or moderation message shown | P2 |
