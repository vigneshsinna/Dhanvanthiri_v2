# Blade Admin to React Storefront QA Checklist

Use this checklist after deploying the Laravel Blade admin and React storefront together.

## Admin Navigation

- [ ] `/admin` opens the Laravel Blade dashboard.
- [ ] Topbar **Browse Website** opens `FRONTEND_URL`, not the legacy Blade home route.
- [ ] Sidebar search finds Products, Orders, Categories, Brands, CMS Pages, Business Settings, Uploaded Files, Coupons, and Reports.
- [ ] Product, category, brand, order, CMS, banner, coupon, and settings pages show the expected breadcrumb/title.

## Products

- [ ] Create a product, publish it, and verify it appears on the React product listing.
- [ ] Edit product name, price, stock, images, SEO fields, and published status.
- [ ] Use product list quick edit for price and stock; verify the React PDP and cart use the new values.
- [ ] Use **View on Storefront** from the product table; confirm it opens `/products/{slug}` on React.
- [ ] Delete and bulk-delete prompts require confirmation.

## Categories and Brands

- [ ] Create/edit category and brand records in Blade admin.
- [ ] Toggle featured/hot category state where applicable.
- [ ] Confirm React category and brand listing pages reflect name, slug, image, and product membership changes.

## Orders

- [ ] Open order list and detail views.
- [ ] Change delivery/payment/tracking statuses and confirm clear success/error feedback.
- [ ] Confirm customer React order detail/tracking views reflect status changes.

## CMS, Banners, and Settings

- [ ] Update homepage slider and banner 1 images/links in Blade admin.
- [ ] Confirm the React homepage hero/banner updates after refresh.
- [ ] Update a CMS/legal page and confirm the React route updates.
- [ ] Update logo, footer text, contact details, and social links in business/website settings.
- [ ] Confirm React header/footer/settings-driven content refreshes within about one minute.

## Safety and Accessibility

- [ ] Required form fields are marked and validation errors render beside fields.
- [ ] Icon-only actions have tooltips or accessible labels.
- [ ] Keyboard tabbing reaches topbar, sidebar, table filters, row actions, and form controls.
- [ ] Destructive actions have confirmation and clear feedback.
- [ ] Laptop-width and smaller desktop layouts do not clip filters, table actions, or form save buttons.

## Cache and Deployment

- [ ] `FRONTEND_URL` is set correctly.
- [ ] `/api/*` reaches Laravel APIs.
- [ ] `/admin/*` remains Laravel Blade admin.
- [ ] React route refreshes work for `/products/*`, `/categories/*`, `/brands/*`, `/pages/*`, cart, checkout, and account pages.
