# Storefront Wiring Gap Backlog and Cutover Checklist

## Priority backlog

### P0 — Must close before public cutover

1. **Public site activation**
   - Mount React storefront at `/`
   - Route `/api/*` and `/admin/*` to Laravel
   - Add SPA fallback rules

2. **Admin / seller browse-link decoupling**
   - Replace `route('home')` usage with configurable `FRONTEND_URL`

3. **Broken public links**
   - Fix `/wishlist` route mismatch
   - Implement or remove `/track-order`
   - Implement or remove `/page/about-us`
   - Implement or remove `/page/contact`

4. **Payment callback target strategy**
   - Ensure enabled gateways land on React success/failure/account pages

5. **Business settings in storefront shell**
   - Header logo/name
   - Footer legal/branding

### P1 — Should close in same release cycle

6. **Homepage banners / promotional slots**
7. **Navigation + footer config wiring**
8. **Generic CMS page support**
9. **Top brands / top categories / top sellers decision**
10. **Structured data + canonical SEO**

### P2 — Can follow after stable cutover

11. **Language/currency selectors**
12. **Seller brands section**
13. **Digital / in-house product routes if required**
14. **Compare feature if required for parity**

## Cutover checklist

### Environment and config
- [ ] `FRONTEND_URL` added and used in backend helpers/views
- [ ] React build deployed to public root
- [ ] API base URL configured correctly in React storefront
- [ ] Same-domain / cookie / token strategy validated

### Public routing
- [ ] `/` serves React storefront
- [ ] `/api/*` still reaches Laravel
- [ ] `/admin/*` still reaches Laravel admin
- [ ] direct refresh on React routes works

### Core public journeys
- [ ] home page loads slider/categories/products correctly
- [ ] category page works
- [ ] brand page works
- [ ] search works
- [ ] product detail works
- [ ] cart works
- [ ] checkout works
- [ ] account works
- [ ] blog works
- [ ] policy pages work
- [ ] seller list/shop works

### Broken-link closure
- [ ] wishlist link resolves to real route
- [ ] track-order behavior resolved
- [ ] about/contact pages resolved
- [ ] footer/header contain only valid routes

### Payment and orders
- [ ] COD completes and lands on React success page
- [ ] wallet completes and lands on React success page
- [ ] each enabled gateway callback returns to React flow
- [ ] order history shows new orders after checkout

### Admin validation
- [ ] admin product changes appear in storefront
- [ ] admin category/brand changes appear in storefront
- [ ] admin slider changes appear in storefront
- [ ] admin flash deal changes appear in storefront
- [ ] admin blog and policy updates appear in storefront
- [ ] business setting changes appear in storefront shell

## Definition of done

The admin↔storefront wiring is complete only when:
- Laravel admin is the source of truth,
- public APIs expose the right data,
- React storefront consumes and renders that data,
- the public domain points to React,
- no critical admin-managed module still depends on legacy Blade storefront rendering,
- no customer-facing navigation points to missing or legacy-only routes.
