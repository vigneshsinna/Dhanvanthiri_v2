# React UI/UX Resilience Checklist

## State Persistence
| Check | Expected Result | Priority |
|---|---|---|
| Cart survives page refresh | Cart items remain after reload | P0 |
| Cart survives browser close/reopen where intended | Cart restored from server/local storage | P1 |
| Checkout partial data survives accidental refresh where safe | User can resume or sees clear recovery | P1 |
| Auth state restores after refresh | User remains logged in or logs out clearly | P0 |
| Guest checkout token/session survives refresh | Guest checkout can continue securely | P0 |
| Coupon state survives checkout step changes | Coupon remains applied or clearly removed | P1 |

## Loading States and Skeletons
| Check | Expected Result | Priority |
|---|---|---|
| Product listing loading | Skeleton/spinner appears | P1 |
| PDP loading | Skeleton/spinner appears | P1 |
| Cart total recalculation | Loading/disabled state visible | P0 |
| Shipping recalculation | Loading state visible | P0 |
| Payment processing | Button disabled and loading shown | P0 |
| Order confirmation loading | Processing/recovery state visible | P0 |

## Double-Submission Prevention
| Check | Expected Result | Priority |
|---|---|---|
| Add to cart repeated click | Quantity behavior is intentional | P1 |
| Apply coupon repeated click | Single discount application | P0 |
| Place order double-click | Only one order created | P0 |
| Payment button double-click | Only one payment intent/transaction created | P0 |
| Form submit double-click | Button disables or idempotency prevents duplicate | P1 |

## Error Handling
| Error Case | Expected Result | Priority |
|---|---|---|
| Invalid coupon | Inline/toast error | P0 |
| Out-of-stock item | Clear stock error and cart update path | P0 |
| Variant unavailable | CTA disabled or warning | P0 |
| Login invalid | Clear auth error | P0 |
| Address invalid | Field-level errors | P0 |
| Payment failed | Friendly failure state and retry path | P0 |
| Network/API 500 | Retry or support message | P1 |
| Session expired | Guided login/restart path | P0 |

## Accessibility and UX Basics
| Check | Expected Result | Priority |
|---|---|---|
| Keyboard navigation | Search, filters, cart, checkout controls reachable | P1 |
| Focus states | Visible focus on actionable elements | P1 |
| Form labels | Inputs have labels/accessible names | P1 |
| Color contrast | Text/buttons readable | P2 |
| Mobile/laptop layout | No clipping of cart/checkout controls | P0 |
| Toast messages | Visible long enough and clear | P2 |
