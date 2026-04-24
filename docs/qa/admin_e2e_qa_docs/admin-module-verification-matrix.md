# Admin Module Verification Matrix

Use this matrix to track module readiness.

| # | Module | Key Routes | Admin Check | Storefront/API Reflection | Priority | Status | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Dashboard | `admin.dashboard` | Analytics, order stats, member stats load | N/A | P1 | Not Tested |  |
| 2 | Product Management | `products.*`, `categories.*`, `brands.*`, `attributes.*`, `digitalproducts.*`, `reviews.*`, `warranties.*`, `size-charts.*` | Product CRUD, option column, clone, delete, quick edit, imports | PDP, listing, cart, category, brand pages | P0 | Not Tested |  |
| 3 | Sales & Orders | `all_orders.*`, `inhouse_orders.*`, `seller_orders.*`, `orders.details`, `invoice.download` | Order list/detail/status/invoice | Customer order detail/tracking | P0 | Not Tested |  |
| 4 | Seller Management | `sellers.*`, `withdraw_requests.*`, `sellers.payment_histories` | Seller approve/ban/payment/withdrawal | Seller storefront/vendor info if applicable | P1 | Not Tested |  |
| 5 | Customer Management | `customers.*`, `customer_packages.*`, `classified_products` | Customer list/details/packages | Account/order state if applicable | P1 | Not Tested |  |
| 6 | Marketing & Promotions | `coupon.*`, `flash_deals.*`, `newsletters.*`, `subscribers.*`, `dynamic-popups.*` | Coupons, flash deals, popup, alerts, subscribers | Coupon checkout, banners/popups, promotions | P0 | Not Tested |  |
| 7 | Support & Communications | `support_ticket.*`, `conversations.*`, `product_query.*`, `contacts` | Tickets, conversations, contact messages | Contact form/product queries | P1 | Not Tested |  |
| 8 | Reports & Analytics | `in_house_sale_report.*`, `seller_sale_report.*`, `stock_report.*`, `earning_payout_report.*` | Report pages load and export correctly | N/A | P1 | Not Tested | Check `amount` SQL issue |
| 9 | Website & Content | `website.*`, `custom-pages.*`, `elements.*`, `top_banner.*` | Pages, header/footer, banners, elements | React pages/header/footer/homepage | P0 | Not Tested |  |
| 10 | Setup & Configurations | `business_settings.*`, `languages.*`, `currency.*`, `tax.*` | Settings, activation, payment, shipping, currency | Storefront settings, payment, checkout | P0 | Not Tested |  |
| 11 | Staff & Permissions | `staffs.*`, `roles.*` | Staff/roles/permissions | Admin access control | P0 | Not Tested |  |
| 12 | Blog System | `blog.*`, `blog-category.*` | Blog CRUD/category | React blog pages if enabled | P2 | Not Tested |  |
| 13 | POS | `poin-of-sales.*` | POS flow, product search, order creation | Inventory/order records | P1 | Not Tested |  |
| 14 | Shipping & Logistics | `countries.*`, `states.*`, `cities.*`, `carriers.*`, `zones.*`, `pick_up_points.*` | Zones, carriers, pickup, geography | Checkout shipping/address | P0 | Not Tested |  |
| 15 | System Utilities & Uploads | `uploaded-files.*`, `cache.clear`, `sitemap_generator` | Uploads, cache, sitemap, system update | Media URLs, SEO sitemap | P1 | Not Tested |  |
