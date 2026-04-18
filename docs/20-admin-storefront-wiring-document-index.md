# Admin ↔ Storefront Wiring Document Pack

This pack covers the **missing functional bridge** between the Laravel admin and the React storefront in the current headless commerce implementation.

## Why this pack exists

The current implementation has:
- a working Laravel admin and commerce backend,
- a separately built React storefront that already consumes several `/api/v2` endpoints,
- but **no complete end-to-end wiring** between admin-managed modules and the new storefront,
- and the public website entry still follows the legacy Blade `route('home')` assumption.

This pack turns that problem into a structured implementation program.

## Documents in this pack

1. **21-admin-to-storefront-functional-wiring-matrix.md**  
   Master matrix showing what is wired, partially wired, or not wired from admin/backend to React storefront.

2. **22-public-storefront-activation-and-admin-linking-spec.md**  
   How to make the React storefront the live public site and decouple admin links from legacy Blade `route('home')`.

3. **23-homepage-catalog-and-merchandising-wiring-spec.md**  
   Detailed wiring requirements for homepage sections, catalog discovery, filters, PLP/PDP, and merchandising blocks.

4. **24-content-settings-navigation-and-seo-wiring-spec.md**  
   Detailed wiring requirements for business settings, header/footer/nav, custom pages, blogs, policies, localization, and SEO.

5. **25-customer-account-checkout-and-marketplace-wiring-spec.md**  
   Detailed wiring requirements for auth, cart, wishlist, account, checkout, orders, and seller/shop features.

6. **26-storefront-wiring-gap-backlog-and-cutover-checklist.md**  
   Prioritized backlog, cutover order, verification checklist, and definition of done.

## Recommended execution order

1. Review the master matrix (`21`) and confirm scope.
2. Fix public-site activation and admin linking (`22`).
3. Complete homepage/catalog/merchandising wiring (`23`).
4. Complete content/settings/navigation/SEO wiring (`24`).
5. Complete customer/account/checkout/marketplace wiring (`25`).
6. Use the backlog and cutover checklist (`26`) to track closure.

## Key implementation principle

The admin panel does **not** wire directly to storefront UI components. The correct chain is:

**Laravel Admin → Database / config → Public API contract → React Storefront → Customer-visible UI**

Anything that breaks that chain is considered **not wired**.
