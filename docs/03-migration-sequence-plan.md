# Migration Sequence Plan
## Route-by-Route Storefront Decoupling Rollout

**Date:** 2026-04-05  
**Status:** Step 1 — Foundation Complete  
**Strategy:** Strangler pattern — parallel React storefront alongside existing Blade

---

## 1. Current Progress (Phase A + B + C Foundation)

### Completed Deliverables

| Deliverable | Status | Location |
|------------|--------|----------|
| Storefront decoupling strategy | Done | `01-generic-headless-commerce-core-storefront-decoupling.md` |
| Capability ownership matrix | Done | `docs/02-capability-ownership-matrix.md` |
| Migration sequence plan | Done | `docs/03-migration-sequence-plan.md` (this document) |
| React storefront scaffold | Done | `storefront/` |
| API SDK layer (typed) | Done | `storefront/src/api/` |
| Redux store (auth + cart) | Done | `storefront/src/store/` |
| React Query hooks | Done | `storefront/src/hooks/` |
| Reusable components | Done | `storefront/src/components/` |
| Storefront shell + layout | Done | `storefront/src/layouts/` |
| Route structure | Done | `storefront/src/router.tsx` |

### Implemented Pages (Phase C Read-Only)

| Page | Route | API Dependencies | Status |
|------|-------|-----------------|--------|
| Home | `/` | sliders, featured categories, featured/best/deals products | Built |
| All Categories | `/categories` | categories | Built |
| Category Products | `/category/:slug` | category info, sub-categories, products by category | Built |
| All Brands | `/brands` | brands | Built |
| Brand Products | `/brand/:slug` | products by brand | Built |
| Search Results | `/search?keyword=` | product search | Built |
| Product Detail | `/product/:slug` | product detail, reviews | Built |
| Cart | `/cart` | cart list, summary, count | Built |
| Login | `/login` | auth/login | Built |

---

## 2. API Coverage Assessment

The existing V2 API has **100% coverage** for all storefront needs. No backend modifications are required for Phase C or D.

| Domain | Endpoints | Storefront Ready |
|--------|-----------|-----------------|
| Products (list, detail, search, filters) | 15+ | Yes |
| Categories | 6 | Yes |
| Brands | 3 | Yes |
| Cart operations | 7 | Yes |
| Checkout + orders | 10+ | Yes |
| Auth + profile | 10+ | Yes |
| Addresses | 5 | Yes |
| Wishlist | 4 | Yes |
| Reviews | 2 | Yes |
| Content (blogs, banners, deals) | 8+ | Yes |
| Settings / config | 6+ | Yes |
| Payments (20+ gateways) | 30+ | Yes |

---

## 3. Remaining Migration Phases

### Phase C — Complete Read-Only Pages (Next)

| Page | Route | Priority | Effort |
|------|-------|----------|--------|
| Flash Deals listing | `/flash-deals` | Medium | Low |
| Flash Deal detail | `/flash-deal/:slug` | Medium | Low |
| Featured products | `/featured` | Low | Low |
| Best Selling products | `/best-selling` | Low | Low |
| Today's Deals | `/todays-deal` | Low | Low |
| All Sellers | `/sellers` | Medium | Low |
| Seller Shop | `/shop/:slug` | Medium | Medium |
| Blog listing | `/blog` | Low | Low |
| Blog post | `/blog/:slug` | Low | Low |
| Static pages | `/page/:slug` | Low | Low |
| Policy pages | `/policy/:type` | Low | Low |

### Phase D — Customer Interaction Pages

| Page | Route | Priority | Effort |
|------|-------|----------|--------|
| Registration | `/register` | High | Medium |
| Forgot Password | `/forgot-password` | High | Low |
| Account Dashboard | `/account` | High | Medium |
| Order History | `/account/orders` | High | Medium |
| Order Detail | `/account/orders/:id` | High | Medium |
| Profile Settings | `/account/profile` | Medium | Low |
| Address Book | `/account/addresses` | Medium | Medium |
| Wishlist | `/wishlist` | Medium | Low |
| Order Tracking | `/track-order` | Medium | Medium |
| Review Submission | (modal on product) | Low | Low |

### Phase E — Cart + Checkout UI Decoupling

| Page | Route | Priority | Effort |
|------|-------|----------|--------|
| Checkout flow | `/checkout` | Critical | High |
| Shipping selection | (step in checkout) | Critical | High |
| Payment selection | (step in checkout) | Critical | High |
| Coupon application | (in cart/checkout) | High | Medium |
| Order success | `/order/confirmed` | High | Low |
| Order failure | `/order/failed` | High | Low |
| Payment redirects | Various | Critical | High |

### Phase F — Cutover + Hardening

| Task | Priority | Effort |
|------|----------|--------|
| Route-based nginx/Apache proxy config | Critical | Medium |
| A/B traffic splitting | High | Medium |
| Performance monitoring setup | High | Medium |
| Error tracking (Sentry) | High | Low |
| SEO verification (meta, sitemap, structured data) | High | Medium |
| Conversion rate comparison | High | Medium |
| Legacy Blade route decommission | Medium | Low |

---

## 4. Recommended Execution Order

### Sprint 1 (Current — Complete)
- Foundation, shell, API SDK, read-only pages

### Sprint 2
- Complete Phase C remaining read-only pages
- Registration page
- Forgot password flow

### Sprint 3
- Phase D — all account pages (dashboard, orders, profile, addresses, wishlist)

### Sprint 4
- Phase E — Checkout flow (shipping, payment, order confirmation)
- Coupon application

### Sprint 5
- Payment gateway integration testing
- Phase F — proxy configuration and traffic splitting

### Sprint 6
- Monitoring, SEO, performance optimization
- Legacy route deprecation

---

## 5. Proxy Configuration (Phase F)

During the strangler migration, nginx routes traffic based on path:

```nginx
# New React storefront (all customer-facing)
location / {
    proxy_pass http://localhost:3000;
}

# API — always to Laravel
location /api/ {
    proxy_pass http://localhost:8000;
}

# Admin panel — stays on Laravel
location /admin {
    proxy_pass http://localhost:8000;
}

# Seller panel — stays on Laravel
location /seller {
    proxy_pass http://localhost:8000;
}

# Payment callbacks — stays on Laravel (critical)
location ~ ^/(paypal|stripe|razorpay|sslcommerz|bkash|nagad) {
    proxy_pass http://localhost:8000;
}
```

---

## 6. Rollback Strategy

- React storefront is deployed independently (`storefront/dist/`)
- Reverting to legacy Blade is a proxy configuration change
- Both systems can run simultaneously
- No backend changes required — same API serves both
- Database unchanged — zero migration risk

---

## 7. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Laravel 10 + PHP 8.2 | Headless commerce core (unchanged) |
| API | REST v2 + Sanctum | Contract boundary |
| Frontend | React 18 + TypeScript | Storefront UI |
| Bundler | Vite 8 | Fast dev/build |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| State | Redux Toolkit | Auth + cart global state |
| Data fetching | React Query (TanStack) | Server state + caching |
| Routing | React Router v7 | Client-side routing |
| Forms | React Hook Form + Zod | Validation |
| Icons | Lucide React | UI icons |

---

## 8. Storefront Project Structure

```
storefront/
├── .env                    # Environment variables
├── index.html              # SPA entry
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── src/
│   ├── main.tsx            # React mount point
│   ├── App.tsx             # Providers + router
│   ├── index.css           # Tailwind import
│   ├── router.tsx          # All routes
│   ├── api/                # API SDK layer
│   │   ├── client.ts       # Axios instance + interceptors
│   │   ├── types.ts        # TypeScript interfaces (mirrors backend)
│   │   ├── products.ts     # Product endpoints
│   │   ├── categories.ts   # Category endpoints
│   │   ├── brands.ts       # Brand endpoints
│   │   ├── cart.ts         # Cart endpoints
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── checkout.ts     # Checkout + order endpoints
│   │   ├── content.ts      # Content endpoints
│   │   ├── customer.ts     # Wishlist + address endpoints
│   │   └── index.ts        # Barrel export
│   ├── store/              # Redux store
│   │   ├── index.ts        # Store config
│   │   ├── hooks.ts        # Typed dispatch/selector
│   │   ├── authSlice.ts    # Auth state
│   │   └── cartSlice.ts    # Cart state
│   ├── hooks/              # React Query hooks
│   │   ├── useProducts.ts  # Product queries
│   │   └── useCatalog.ts   # Category, brand, content queries
│   ├── components/         # Reusable UI components
│   │   ├── Header.tsx      # Navigation header
│   │   ├── Footer.tsx      # Footer
│   │   ├── ProductCard.tsx  # Product card
│   │   └── ProductGrid.tsx # Product grid
│   ├── layouts/            # Page layouts
│   │   └── StorefrontLayout.tsx
│   └── pages/              # Page components
│       ├── HomePage.tsx
│       ├── CategoryPage.tsx
│       ├── CategoriesPage.tsx
│       ├── ProductDetailPage.tsx
│       ├── SearchPage.tsx
│       ├── BrandsPage.tsx
│       ├── BrandPage.tsx
│       ├── CartPage.tsx
│       └── LoginPage.tsx
```
