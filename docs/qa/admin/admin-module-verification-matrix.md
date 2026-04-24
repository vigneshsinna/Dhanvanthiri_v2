# Admin Module Verification Matrix

| # | Module | Key Routes | Admin Check | Storefront/API Reflection | Priority | Automation | Status |
|---|---|---|---|---|---|---|---|
| 1 | Dashboard | `admin.dashboard` | Dashboard widgets/charts load | N/A | P1 | `blade-admin-navigation.spec.ts` | Automated smoke |
| 2 | Product Management | `products.*`, `categories.*`, `brands.*`, `attributes.*`, `digitalproducts.*`, `reviews.*`, `warranties.*`, `size-charts.*` | Product CRUD, AJAX table, option column, clone, delete, quick edit | PDP, listing, cart, category, brand pages | P0 | `admin-products.spec.ts`, `product-admin-storefront.spec.ts`, `categories-brands-admin-storefront.spec.ts` | Automated read-only and guarded mutation |
| 3 | Sales & Orders | `all_orders.*`, `inhouse_orders.*`, `seller_orders.*`, `orders.details`, `invoice.download` | Order list/detail/status/invoice | Customer order detail/tracking | P0 | `orders-admin-storefront.spec.ts` | Automated read-only and guarded mutation |
| 4 | Seller Management | `sellers.*`, `withdraw_requests.*`, `sellers.payment_histories` | Seller approve/ban/payment/withdrawal | Seller storefront/vendor info if applicable | P1 | Pending | Manual required |
| 5 | Customer Management | `customers.*`, `customer_packages.*`, `classified_products` | Customer list/details/packages | Account/order state if applicable | P1 | Pending | Manual required |
| 6 | Marketing & Promotions | `coupon.*`, `flash_deals.*`, `newsletters.*`, `subscribers.*`, `dynamic-popups.*`, `email-templates.*` | Coupons, flash deals, popup, alerts, subscribers, templates | Coupon checkout, banners/popups, promotions | P0 | `admin-marketing.spec.ts` | Automated smoke |
| 7 | Support & Communications | `support_ticket.*`, `conversations.*`, `product_query.*`, `contacts` | Tickets, conversations, contact messages | Contact form/product queries | P1 | Pending | Manual required |
| 8 | Reports & Analytics | `in_house_sale_report.*`, `seller_sale_report.*`, `stock_report.*`, `earning_payout_report.*` | Report pages load and export correctly | N/A | P1 | `admin-reports.spec.ts` | Automated SQL/5xx guard |
| 9 | Website & Content | `website.*`, `custom-pages.*`, `elements.*`, `top_banner.*` | Pages, header/footer, banners, elements | React pages/header/footer/homepage | P0 | `admin-cms-settings.spec.ts`, `cms-banners-settings.spec.ts` | Automated read-only and guarded mutation |
| 10 | Setup & Configurations | `business_settings.*`, `languages.*`, `currency.*`, `tax.*` | Settings, activation, payment, shipping, currency | Storefront settings, payment, checkout | P0 | `admin-cms-settings.spec.ts` | Automated smoke |
| 11 | Staff & Permissions | `staffs.*`, `roles.*` | Staff/roles/permissions | Admin access control | P0 | `admin-permissions.spec.ts` | Automated smoke |
| 12 | Blog System | `blog.*`, `blog-category.*` | Blog CRUD/category | React blog pages if enabled | P2 | Pending | Manual required |
| 13 | POS | `poin-of-sales.*` | POS flow, product search, order creation | Inventory/order records | P1 | Pending | Manual required |
| 14 | Shipping & Logistics | `countries.*`, `states.*`, `cities.*`, `zones.*`, `carriers.*`, `pick_up_points.*` | Zones, carriers, pickup, geography | Checkout shipping/address | P0 | `admin-shipping.spec.ts` | Automated smoke |
| 15 | System Utilities & Uploads | `uploaded-files.*`, `cache.clear`, `sitemap_generator` | Uploads, cache, sitemap, system update | Media URLs, SEO sitemap | P1 | `admin-uploads-utilities.spec.ts` | Automated smoke |
