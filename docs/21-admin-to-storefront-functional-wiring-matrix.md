# Admin to Storefront Functional Wiring Matrix

## Scope

This matrix assesses the **current end-to-end wiring** between:
- Laravel admin / backend-managed commerce data,
- public API exposure,
- React storefront consumption,
- and public customer visibility.

## Status legend

- **Wired** — admin/backend data has a public API and the React storefront actively consumes and renders it.
- **Partial** — API exists and/or React has some support, but the module is incomplete, hardcoded, mismatched, or not customer-complete.
- **Not wired** — admin/backend capability exists, but the React storefront does not consume it or the public site still routes to legacy Blade.

---

## 1. Public-site activation and shell wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Public website root (`/`) | Legacy website/home configuration | Blade `route('home')` | React storefront not mounted as public site | **Not wired** | Admin “Browse Website” still points to `route('home')`; public home remains legacy Blade | Make React storefront the live root site |
| Admin “Browse Website” button | `resources/views/backend/inc/admin_nav.blade.php` | `route('home')` | None | **Not wired** | Button still opens legacy home | Replace with configurable `FRONTEND_URL` |
| Seller “Browse Website” button | `resources/views/seller/inc/seller_nav.blade.php` | `route('home')` | None | **Not wired** | Seller nav still opens legacy home | Point to public storefront URL |
| SPA fallback routing | Web server / deployment | N/A | React router | **Not wired** | No evidence that public domain routes unknown paths to React | Add root SPA fallback except `/api`, `/admin`, storage |
| Header logo / site name | Business settings / branding | `/api/v2/business-settings` exists | Header currently hardcoded | **Partial** | `useBusinessSettings` hook exists, but `Header` shows static “Store” | Drive logo/name from backend settings |
| Footer legal / branding block | Business settings / CMS | `/api/v2/business-settings` exists | Footer currently hardcoded | **Partial** | Footer shows generic text only | Bind footer branding + copy to backend settings |
| Navigation menu | Website settings / CMS / categories | category APIs exist; no menu API consumed | `Header.tsx` hardcoded links | **Not wired** | Desktop/mobile nav is static | Introduce menu/navigation contract or map existing settings |
| Footer links and info blocks | Pages/policies/content settings | policies/blog endpoints exist; generic pages not wired | `Footer.tsx` hardcoded | **Partial** | Links are static and some point to missing routes | Replace with API-driven/footer-config model |

---

## 2. Homepage and merchandising wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Homepage hero sliders | Slider management | `/api/v2/sliders` | `HomePage` via `useSliders()` | **Wired** | Home hero renders first slider image | Expand to proper carousel / multiple slides if needed |
| Homepage banner blocks | Banner management | `/api/v2/banners`, `banners-one`, `banners-two`, `banners-three` | No consumer found | **Not wired** | `contentApi.banners()` exists but not rendered on homepage | Map banner slots to homepage sections |
| Featured categories | Category management | `/api/v2/categories/featured` | `HomePage` via `useFeaturedCategories()` | **Wired** | Featured category grid is rendered | Add ordering/fallback rules if needed |
| Top categories | Category management | `/api/v2/categories/top` | No consumer found | **Not wired** | API exists but is unused in storefront | Decide whether to surface or remove |
| Flash deal list on home | Flash deal management | `/api/v2/flash-deals` | `HomePage` + `FlashDealsPage` | **Wired** | Home shows first 3 deals; listing page exists | Add countdown/availability if required |
| Flash deal detail and products | Flash deal management | `/api/v2/flash-deals/info/{slug}`, `/api/v2/flash-deal-products/{id}` | `FlashDealDetailPage` | **Wired** | Deal page loads deal meta and products | Validate stock/promo labels |
| Today’s deal products | Product merchandising flags | `/api/v2/products/todays-deal` | `HomePage` | **Wired** | Product grid rendered | Confirm admin flag semantics and empty state |
| Featured products | Product merchandising flags | `/api/v2/products/featured` | `HomePage`, `FeaturedPage` | **Wired** | Featured grid and page exist | Add admin preview / order if required |
| Best-selling products | Product analytics/flags | `/api/v2/products/best-seller` | `HomePage`, `BestSellingPage` | **Wired** | Best-selling grid and page exist | Confirm sorting logic |
| Home featured products from sellers | Seller/product merchandising | `/api/v2/products/featured-from-seller/{id}` exists | No consumer found | **Not wired** | API exists but storefront doesn’t use it | Decide if marketplace home sections need it |
| Campaign / promo strips / announcement bars | Website settings / CMS | No active consumer found | None | **Not wired** | No storefront module found | Add if admin uses them |

---

## 3. Catalog discovery wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Category index page | Category management | `/api/v2/categories` | `CategoriesPage` | **Wired** | Categories route exists and consumes API | None |
| Category detail / PLP | Category + product mapping | `/api/v2/category/info/{slug}`, `/api/v2/products/category/{slug}` | `CategoryPage` | **Wired** | Category landing + product list exists | Validate filters/sort parity |
| Brand index page | Brand management | `/api/v2/brands` | `BrandsPage` | **Wired** | Brands route exists | None |
| Brand detail / PLP | Brand + product mapping | `/api/v2/products/brand/{slug}` | `BrandPage` | **Wired** | Brand page exists and consumes API | Validate sort/filter parity |
| Top brands | Brand management | `/api/v2/brands/top` | No consumer found | **Not wired** | API exists but unused | Decide whether to add a top-brands section |
| Search page | Product search | `/api/v2/products/search` | `SearchPage`, header search | **Wired** | Header navigates to `/search`; page consumes search API | Add empty-search and no-result tuning |
| Generic product listing | Product management | `/api/v2/products` | Hooks/API support | **Partial** | `productApi.list()` exists, but no dedicated all-products page wired in router | Add `/products` or keep category/brand/search only |
| Product detail | Product management | `/api/v2/products/{slug}/{userId}` | `ProductDetailPage` | **Wired** | Full PDP exists | None |
| Product variant pricing | Product variants / attributes | `/api/v2/products/variant/price` | `ProductDetailPage` | **Wired** | Variant recalculation effect present | Confirm color + choice payload matches all products |
| Product reviews | Review management | `/api/v2/reviews/product/{id}` | `ProductDetailPage` | **Wired** | Reviews tab consumes endpoint | Add review submission if needed |
| Product tags | Product tags | Product detail payload contains tags | PDP only | **Partial** | Tags display on PDP but do not link to tag pages | Add tag search/listing or render as static labels only |
| Digital products | Product type support | `/api/v2/products/digital` | No consumer found | **Not wired** | API exists but no page/route uses it | Add if digital catalog is in scope |
| In-house products | Product type support | `/api/v2/products/inhouse` | No consumer found | **Not wired** | API exists but no page/route uses it | Add if needed |
| Compare products | Legacy storefront feature | No React consumer found | None | **Not wired** | No compare route/module in React storefront | Implement only if business requires parity |
| Track order | Order tracking | Legacy Blade page exists; no React route | Footer links to `/track-order` | **Not wired** | Footer link points to missing route | Add route/API or remove link |

---

## 4. Content and CMS wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Blog listing | Blog management | `/api/v2/blog-list` | `BlogListPage` | **Wired** | Blog grid exists | None |
| Blog detail | Blog management | `/api/v2/blog-details/{slug}` | `BlogDetailPage` | **Wired** | Blog detail page exists | None |
| Policy pages | Page management | `/api/v2/policies/{type}` | `PolicyPage` | **Wired** | Terms/privacy/return/seller/support routes mapped | Ensure admin page type mapping is stable |
| Generic custom pages | Website pages | No React page API consumer found | Footer links to `/page/about-us` etc. | **Not wired** | Footer links target routes absent from router | Add generic page route + API contract |
| Contact page | Website pages | No React page/API consumer found | Footer static link only | **Not wired** | `/page/contact` does not exist in router | Add contact page route/API |
| About page | Website pages | No React page/API consumer found | Footer static link only | **Not wired** | `/page/about-us` does not exist in router | Add generic CMS page support |
| Banner-based content blocks | Banner management | `/api/v2/banners` and `banners-*` | None | **Not wired** | API exists, no rendering | Define slot model and map to components |

---

## 5. Business settings, localization, and SEO wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Business settings | Business settings admin | `/api/v2/business-settings`, `/api/v2/business-settings` (POST config endpoint also exists) | Hook exists, currently unused in UI | **Partial** | `useBusinessSettings()` exists but no page/layout uses it | Use for store name, logo, currency, support info |
| Languages | Localization settings | `/api/v2/languages` | No consumer found | **Not wired** | API exists but unused | Add language selector only if multi-language required |
| Currencies | Currency settings | `/api/v2/currencies` | No consumer found | **Not wired** | API exists but unused | Add currency selector + price display policy |
| SEO metadata | Product/blog page data + SEO helpers | Page-level data already available | `useSeoMeta()` on many pages | **Partial** | SEO hook is used on PDP/blog/sellers/auth pages | Need admin-driven defaults, org-level metadata, sitemap, structured data parity |
| Canonical URLs | Site config | Not centrally managed | Not found | **Not wired** | No central canonical manager found | Add canonical policy for category/product/blog/custom pages |
| Structured data / JSON-LD | SEO layer | Product/blog/category data available | Not found | **Not wired** | No JSON-LD implementation found in storefront | Add product/category/blog schema |
| Robots / sitemap integration | Deployment/public layer | Legacy Laravel has robots/sitemap assets | React storefront not shown to own this | **Partial** | Assets exist in backend, but public root not cut over | Decide final owner after public-site activation |

---

## 6. Customer, cart, and account wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Login | Customer auth | `/api/v2/auth/login` | `LoginPage`, auth slice | **Wired** | Working auth flow is implemented | None |
| Register | Customer auth | `/api/v2/auth/signup` | `RegisterPage` | **Wired** | Register page implemented | Confirm OTP/phone scenarios |
| Forgot password | Customer auth | `/api/v2/auth/password/forget_request` | `ForgotPasswordPage` | **Wired** | Page/API exists | None |
| Reset password | Customer auth | `/api/v2/auth/password/confirm_reset` | `ResetPasswordPage` | **Wired** | Page/API exists | None |
| Current user/profile bootstrap | Customer auth/profile | `/api/v2/auth/user`, `/api/v2/profile/update` | auth slice, `ProfilePage` | **Wired** | Current user + profile update APIs consumed | None |
| Cart list/summary/count | Cart management | `/api/v2/carts`, `/api/v2/cart-summary`, `/api/v2/cart-count` | cart slice, `CartPage`, checkout hook | **Wired** | Cart page and count badge implemented | None |
| Add to cart | Cart management | `/api/v2/carts/add` | PDP + cart state | **Wired** | PDP add-to-cart flow implemented | None |
| Change cart quantity | Cart management | `/api/v2/carts/change-quantity` | `CartPage` | **Wired** | Quantity controls implemented | None |
| Remove cart item | Cart management | `DELETE /api/v2/carts/{id}` | `CartPage` | **Wired** | Remove action implemented | None |
| Wishlist data | Wishlist management | `/api/v2/wishlists*` | PDP toggle + account wishlist page | **Partial** | API consumed; PDP toggle exists; footer/header link uses nonexistent `/wishlist` route | Route mismatch: point header/footer to `/account/wishlist` or add `/wishlist` route |
| Addresses | Customer addresses | `/api/v2/user/shipping/*` | `AddressesPage`, checkout hook | **Wired** | CRUD + default address logic implemented | None |
| Account dashboard | Customer account | order/wishlist/address/profile APIs | `DashboardPage` | **Wired** | Dashboard route exists | Consider richer admin metrics later |
| Orders list | Orders | `/api/v2/purchase-history` | `OrdersPage` | **Wired** | Orders page implemented | None |
| Order detail | Orders | `/api/v2/purchase-history-details/{id}`, `/items/{id}` | `OrderDetailPage` | **Wired** | Detail page implemented | None |
| Reorder / invoice | Orders | `/api/v2/re-order/{id}`, `/invoice/download/{id}` | Partial support | **Partial** | APIs exist in client; UI parity may be limited | Add explicit actions/buttons if required |

---

## 7. Checkout and payment wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Checkout page | Cart + address + shipping + payment settings | Multiple checkout/cart endpoints | `CheckoutPage`, `useCheckoutSession` | **Wired** | Multi-step checkout exists | None |
| Seller-group cart processing | Multi-vendor checkout logic | `/api/v2/carts/process` | `useCheckoutSession` | **Wired** | Hook processes owner groups before shipping/payment | Confirm all seller scenarios |
| Delivery info | Shipping/checkout | `/api/v2/delivery-info` | `useCheckoutSession` | **Wired** | Hook calls delivery info when advancing from address step | Validate full payload expectations |
| Shipping cost calculation | Shipping/checkout | `/api/v2/shipping_cost` | `useCheckoutSession` | **Wired** | Hook recalculates per owner/address | Confirm carrier selection support |
| Coupon apply/remove | Coupon management | `/api/v2/coupon-apply`, `/coupon-remove` | `useCheckoutSession`, `CheckoutPage` | **Wired** | Coupon UI is present | None |
| Payment method list | Payment settings | `/api/v2/payment-types` | `useCheckoutSession` | **Wired** | Checkout fetches payment types | None |
| Order creation | Order placement | `/api/v2/order/store` | `useCheckoutSession` | **Wired** | Order placement flow implemented | Validate payload parity on all gateways |
| COD payment | Payment settings | `/api/v2/payments/pay/cod` | `useCheckoutSession` | **Wired** | COD branch implemented | None |
| Wallet payment | Payment settings | `/api/v2/payments/pay/wallet` | `useCheckoutSession` | **Wired** | Wallet branch implemented | None |
| External gateway redirect | Payment gateways | gateway callback/init endpoints | `useCheckoutSession` generic redirect handling | **Partial** | Hook supports `payment_redirect_url` / `action_url` | Need verified mapping for each enabled gateway |
| Payment success/failure landing | Order/payment states | query params + redirect outcomes | `OrderSuccessPage`, `OrderFailurePage` | **Wired** | Pages exist | Ensure backend callbacks redirect to React routes after cutover |
| Legacy Blade payment pages | Payment controllers/views | many payment controllers still redirect to `route('home')` or Blade paths | React not authoritative yet | **Not wired** | Payment controllers contain many legacy `route('home')` redirects | Update payment callback target strategy for React public site |

---

## 8. Seller and marketplace wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Sellers listing | Seller/shop admin | `/api/v2/shops`, `/api/v2/seller/top` | `SellersPage` (list), no top-seller home section | **Partial** | Sellers listing works; top sellers endpoint unused | Add top-seller modules if required |
| Seller shop details | Seller/shop admin | `/api/v2/shops/details/{id}` | `SellerShopPage` | **Wired** | Shop header/info displayed | None |
| Seller all products | Seller product data | `/api/v2/shops/products/all/{id}` | `SellerShopPage` | **Wired** | Tab exists | None |
| Seller featured products | Seller product data | `/api/v2/shops/products/featured/{id}` | `SellerShopPage` | **Wired** | Featured tab exists | None |
| Seller top products | Seller product data | `/api/v2/shops/products/top/{id}` | `SellerShopPage` | **Wired** | Top-selling tab exists | None |
| Seller new products | Seller product data | `/api/v2/shops/products/new/{id}` | `SellerShopPage` | **Wired** | New arrivals tab exists | None |
| Seller brands | Seller shop data | `/api/v2/shops/brands/{id}` | No consumer found | **Not wired** | API exists; no UI uses it | Add seller-brand section if needed |
| Seller panel (React SPA) | Seller operations | No real seller CRUD wiring yet | React panel pages | **Not wired for live ops** | Seller panel pages use mock data/placeholders | Treat as separate Step 4 internal project |

---

## 9. React panel wiring versus Laravel admin wiring

| Area | Admin / Backend source | API / data source | React consumer | Status | Evidence | Gap / action |
|---|---|---|---|---|---|---|
| Laravel admin → storefront public site | Laravel admin content/product settings | Public `/api/v2` endpoints | React storefront | **Partial overall** | Many catalog APIs work, but activation + settings + CMS are incomplete | Complete module-by-module wiring |
| React admin panel | Separate SPA panel experiment | Placeholder only | `/panel/admin/*` | **Not wired** | Admin panel pages are “coming soon” placeholders | Do not confuse this with Laravel admin; it is not the live admin |
| React seller panel | Separate SPA panel experiment | Mock/static data | `/panel/seller/*` | **Not wired** | Mock seller data is present | Keep out of public-storefront cutover scope |

---

## Overall conclusion

### Wired well today
- categories, brands, search
- product detail, variant pricing, reviews
- home featured categories, flash deals, featured/best-selling/today’s deal products
- blog and policy pages
- auth, cart, addresses, account, orders
- seller listing and seller shop pages
- checkout core flow with COD/wallet/generic redirect support

### Partial today
- business settings and branding
- footer/header/nav driven by admin
- banners and promotional slotting
- wishlist route parity
- top brands/top categories/top sellers usage
- external payment callback/cutover behavior
- public-site activation itself

### Not wired today
- React storefront as public root site
- admin “Browse Website” → React storefront
- generic CMS pages like About/Contact
- footer links such as `/track-order`, `/page/about-us`, `/page/contact`
- menu/footer config from admin
- language/currency selectors
- structured data / canonical / full SEO configuration
- seller brands section
- React admin/seller panels for live operations
