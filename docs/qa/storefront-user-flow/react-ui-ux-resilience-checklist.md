# React UI/UX Resilience Checklist

| Area | Check | Automation Status |
|---|---|---|
| Refresh | `/products` reload keeps product grid visible | Automated |
| Refresh | `/products/:slug` reload keeps PDP content visible | Automated |
| Refresh | `/checkout` reload returns to a recoverable checkout screen | Automated |
| Cart | Empty cart has a clear shopping recovery link | Automated |
| Cart | Guest cart survives reload after add-to-cart | Guarded mutation |
| Checkout | Continue to payment is disabled until guest details are valid | Automated |
| Checkout | Payment click shows processing/loading state | Guarded mutation |
| Checkout | Payment/order double-click does not create duplicate attempts | Guarded mutation, needs backend order-count assertion |
| Errors | Invalid login has clear error message | Automated |
| Errors | Invalid coupon has clear error message | Guarded mutation |
| Errors | Synthetic cart API 500 does not blank the React app | Automated |
| Account | Auth state survives refresh | Credential-gated |
| Post-purchase | Confirmation refresh is safe | Automated |
| Post-purchase | Delivered order review form validates and submits | Automated with mocked order/API |
| Auth | Social login buttons hide unless provider flags are enabled | Automated |
| Mobile | Cart/checkout controls fit viewport | Manual Playwright viewport pass still required |
| Accessibility | Search, filters, cart, checkout keyboard reachability | Partial; search role covered, axe/keyboard pass still required |
