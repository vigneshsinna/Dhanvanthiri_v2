# Capability Ownership Matrix
## Backend-Owned vs Storefront-Owned Responsibilities

**Generated From:** Codebase audit of animazon v10.2.2  
**Date:** 2026-04-05  
**Purpose:** Define clear separation boundary for headless decoupling

---

## 1. Backend-Owned Capabilities (Commerce Core)

These capabilities remain in the Laravel backend and are consumed via `/api/v2/*` endpoints.

| Domain | Capability | Current API Endpoint | Status |
|--------|-----------|---------------------|--------|
| **Catalog** | Product listing (paginated) | `GET /v2/products` | ✅ Ready |
| | Product detail | `GET /v2/products/{slug}/{user_id}` | ✅ Ready |
| | Product search | `GET /v2/products/search` | ✅ Ready |
| | Variant pricing | `POST /v2/products/variant/price` | ✅ Ready |
| | Featured products | `GET /v2/products/featured` | ✅ Ready |
| | Best sellers | `GET /v2/products/best-seller` | ✅ Ready |
| | Today's deals | `GET /v2/products/todays-deal` | ✅ Ready |
| | Digital products | `GET /v2/products/digital` | ✅ Ready |
| | In-house products | `GET /v2/products/inhouse` | ✅ Ready |
| | Recently viewed | `GET /v2/products/last-viewed` | ✅ Ready |
| **Categories** | All categories | `GET /v2/categories` | ✅ Ready |
| | Featured categories | `GET /v2/categories/featured` | ✅ Ready |
| | Home categories | `GET /v2/categories/home` | ✅ Ready |
| | Top categories | `GET /v2/categories/top` | ✅ Ready |
| | Category info | `GET /v2/category/info/{slug}` | ✅ Ready |
| | Sub-categories | `GET /v2/sub-categories/{id}` | ✅ Ready |
| | Filter categories | `GET /v2/filter/categories` | ✅ Ready |
| **Brands** | All brands | `GET /v2/brands` | ✅ Ready |
| | Top brands | `GET /v2/brands/top` | ✅ Ready |
| | Filter brands | `GET /v2/filter/brands` | ✅ Ready |
| **Cart** | Add to cart | `POST /v2/carts/add` | ✅ Ready |
| | Update quantity | `POST /v2/carts/change-quantity` | ✅ Ready |
| | Cart summary | `POST /v2/cart-summary` | ✅ Ready |
| | Cart count | `POST /v2/cart-count` | ✅ Ready |
| | List cart items | `POST /v2/carts` | ✅ Ready |
| | Remove from cart | `DELETE /v2/carts/{id}` | ✅ Ready |
| | Process cart | `POST /v2/carts/process` | ✅ Ready |
| **Checkout** | Apply coupon | `POST /v2/coupon-apply` | ✅ Ready |
| | Remove coupon | `POST /v2/coupon-remove` | ✅ Ready |
| | Coupon list | `GET /v2/coupon-list` | ✅ Ready |
| | Delivery info | `POST /v2/delivery-info` | ✅ Ready |
| | Shipping cost | `POST /v2/shipping_cost` | ✅ Ready |
| | Create order | `POST /v2/order/store` | ✅ Ready |
| | Cancel order | `GET /v2/order/cancel/{id}` | ✅ Ready |
| **Payments** | Payment types | `GET /v2/payment-types` | ✅ Ready |
| | Wallet payment | `POST /v2/payments/pay/wallet` | ✅ Ready |
| | COD | `POST /v2/payments/pay/cod` | ✅ Ready |
| | Manual payment | `POST /v2/payments/pay/manual` | ✅ Ready |
| | Stripe | `POST /v2/stripe` | ✅ Ready |
| | PayPal | `GET /v2/paypal/payment/url` | ✅ Ready |
| | Razorpay | `POST /v2/razorpay/pay-with-razorpay` | ✅ Ready |
| | 15+ more gateways | Various | ✅ Ready |
| **Customer** | Login | `POST /v2/auth/login` | ✅ Ready |
| | Register | `POST /v2/auth/signup` | ✅ Ready |
| | Social login | `POST /v2/auth/social-login` | ✅ Ready |
| | Profile info | `GET /v2/customer/info` | ✅ Ready |
| | Update profile | `POST /v2/profile/update` | ✅ Ready |
| | Password reset | `POST /v2/auth/password/forget_request` | ✅ Ready |
| **Addresses** | List addresses | `GET /v2/user/shipping/address` | ✅ Ready |
| | Create address | `POST /v2/user/shipping/create` | ✅ Ready |
| | Update address | `POST /v2/user/shipping/update` | ✅ Ready |
| | Set default | `POST /v2/user/shipping/make_default` | ✅ Ready |
| | Delete address | `GET /v2/user/shipping/delete/{id}` | ✅ Ready |
| **Orders** | Purchase history | `GET /v2/purchase-history` | ✅ Ready |
| | Order details | `GET /v2/purchase-history-details/{id}` | ✅ Ready |
| | Order items | `GET /v2/purchase-history-items/{id}` | ✅ Ready |
| | Reorder | `GET /v2/re-order/{id}` | ✅ Ready |
| | Invoice | `GET /v2/invoice/download/{id}` | ✅ Ready |
| **Wishlist** | List | `GET /v2/wishlists` | ✅ Ready |
| | Add | `GET /v2/wishlists-add-product/{slug}` | ✅ Ready |
| | Remove | `GET /v2/wishlists-remove-product/{slug}` | ✅ Ready |
| | Check | `GET /v2/wishlists-check-product/{slug}` | ✅ Ready |
| **Reviews** | Product reviews | `GET /v2/reviews/product/{id}` | ✅ Ready |
| | Submit review | `POST /v2/reviews/submit` | ✅ Ready |
| **Shops** | All shops | `GET /v2/shops` | ✅ Ready |
| | Shop details | `GET /v2/shops/details/{id}` | ✅ Ready |
| | Shop products | `GET /v2/shops/products/all/{id}` | ✅ Ready |
| | Top sellers | `GET /v2/seller/top` | ✅ Ready |
| **Content** | Blog list | `GET /v2/blog-list` | ✅ Ready |
| | Blog details | `GET /v2/blog-details/{slug}` | ✅ Ready |
| | Flash deals | `GET /v2/flash-deals` | ✅ Ready |
| | Banners | `GET /v2/banners` | ✅ Ready |
| | Sliders | `GET /v2/sliders` | ✅ Ready |
| **Settings** | Business settings | `GET /v2/business-settings` | ✅ Ready |
| | Languages | `GET /v2/languages` | ✅ Ready |
| | Currencies | `GET /v2/currencies` | ✅ Ready |
| | Countries/States/Cities | `GET /v2/countries`, etc. | ✅ Ready |
| | Policies | `GET /v2/policies/*` | ✅ Ready |

---

## 2. Storefront-Owned Capabilities (React Frontend)

These are presentation and UX concerns that move to the new decoupled React storefront.

| Domain | Capability | Owner |
|--------|-----------|-------|
| **Layout** | Homepage composition & hero sections | Storefront |
| | Header / navigation / mega-menu | Storefront |
| | Footer layout | Storefront |
| | Responsive breakpoints (desktop / tablet / mobile) | Storefront |
| | Theme / design tokens / branding | Storefront |
| **Discovery** | Category page layout & filters UI | Storefront |
| | Product listing grid/list view toggle | Storefront |
| | Search bar UI & autocomplete presentation | Storefront |
| | Brand landing page layout | Storefront |
| | Flash deal countdown UI | Storefront |
| | Banner/slider carousel rendering | Storefront |
| **Product** | Product detail page layout | Storefront |
| | Image gallery / zoom behavior | Storefront |
| | Variant picker UI | Storefront |
| | Related products carousel | Storefront |
| | Review display / rating stars | Storefront |
| | Tab navigation (description / specs / reviews) | Storefront |
| **Cart** | Cart drawer / page presentation | Storefront |
| | Quantity stepper UI | Storefront |
| | Cart summary display | Storefront |
| **Checkout** | Checkout step wizard UI | Storefront |
| | Address form presentation | Storefront |
| | Shipping method selector UI | Storefront |
| | Payment method selector UI | Storefront |
| | Order review layout | Storefront |
| | Success / failure page | Storefront |
| **Account** | Dashboard layout | Storefront |
| | Order history table | Storefront |
| | Profile form UI | Storefront |
| | Address book UI | Storefront |
| | Wishlist grid | Storefront |
| **Content** | Blog listing layout | Storefront |
| | Blog detail page | Storefront |
| | Static pages (terms, policy) | Storefront |
| **SEO** | Meta tags / Open Graph | Storefront |
| | Structured data (JSON-LD) | Storefront |
| | Sitemap generation | Storefront |
| | Canonical URLs | Storefront |

---

## 3. API Coverage Assessment

### Ready for Immediate Frontend Use
- Product catalog (listing, detail, search, filters) — **100% covered**
- Categories & brands — **100% covered**
- Cart operations — **100% covered**
- Checkout & order creation — **100% covered**
- Customer auth & profile — **100% covered**
- Addresses — **100% covered**
- Wishlist — **100% covered**
- Reviews — **100% covered**
- Shops/sellers — **100% covered**
- Payments (20+ gateways) — **100% covered**
- Content (blogs, deals, banners) — **100% covered**
- Settings & configuration — **100% covered**

### Gaps to Address in Step 2
| Gap | Description | Priority |
|-----|------------|----------|
| SEO metadata endpoint | Need product/category meta descriptions via API | Medium |
| Structured search filters | Filter options not returned as facets | Medium |
| Content blocks API | Homepage sections need structured content API | Low |
| Menu structure API | Navigation menu not exposed as API | Medium |

---

## 4. Migration Risk Classification

| Route Group | Risk Level | Reason |
|-------------|-----------|--------|
| Homepage | Low | Read-only, API data available |
| Category/Brand pages | Low | Read-only, search API ready |
| Product detail | Low | Full detail API exists |
| Search | Low | Search API with filters exists |
| Cart | Medium | State management, guest handling |
| Checkout | High | Payment flows, redirects, gateway callbacks |
| Auth flows | Medium | Social login, email verification |
| Account pages | Low | CRUD APIs all available |
| Payment callbacks | High | Server-dependent redirect flows |
