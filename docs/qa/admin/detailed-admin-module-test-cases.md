# Detailed Admin Module Test Cases

## General Rules

For each module, verify:

- menu opens without 404/500
- list page loads without SQL error
- search/filter/sort/pagination work
- create form opens
- validation works
- save works
- edit works
- delete/deactivate/restore works where applicable
- success/error feedback appears
- browser console has no JS errors
- network requests return expected status
- permission restrictions work
- relevant React storefront/API reflects admin changes

## P0 Automated Regression Cases

| Test ID | Module | Scenario | Automation |
|---|---|---|---|
| DASH-001 | Dashboard | Login and open `/admin` | `blade-admin-navigation.spec.ts` |
| NAV-001 | Navigation | Sidebar search finds Products, Orders, Categories, Brands, CMS Pages, Business Settings, Uploaded Files, Coupons, Reports | `blade-admin-navigation.spec.ts` |
| PROD-001 | Products | All Products AJAX table loads, spinner disappears, rows or empty state render | `admin-products.spec.ts` |
| PROD-002 | Products | Option column edit action points to edit page | `admin-products.spec.ts` |
| PROD-003 | Products | Option column delete action opens confirmation without deleting in read-only mode | `admin-products.spec.ts` |
| PROD-004 | Products | Clone action is present; clone execution requires disposable mutation DB | `admin-products.spec.ts` |
| PROD-008 | Products | Admin product data reflects on React product/listing pages | `product-admin-storefront.spec.ts` |
| ORD-001 | Orders | All orders list loads | `orders-admin-storefront.spec.ts` |
| ORD-002 | Orders | First order detail opens | `orders-admin-storefront.spec.ts` |
| ORD-007 | Orders | Status/tracking reflects through storefront API on disposable DB | `orders-admin-storefront.spec.ts` |
| MKT-001 | Marketing | Coupons list loads | `admin-marketing.spec.ts` |
| MKT-003 | Marketing | Flash Deals page loads with table/form/empty state | `admin-marketing.spec.ts` |
| MKT-005 | Marketing | Dynamic Popup page loads with table/form/empty state | `admin-marketing.spec.ts` |
| MKT-006 | Marketing | Email Templates page loads with table/form/empty state | `admin-marketing.spec.ts` |
| REP-001 | Reports | In-house sale report loads without SQL/500 | `admin-reports.spec.ts` |
| REP-002 | Reports | Stock report loads without SQL/500 | `admin-reports.spec.ts` |
| REP-006 | Reports | Earning/payout report loads without unknown `amount` column SQL error | `admin-reports.spec.ts` |
| WEB-002 | Website | Custom pages load and guarded mutation reflects in React page route | `admin-cms-settings.spec.ts`, `cms-banners-settings.spec.ts` |
| WEB-003 | Website | Header/footer admin pages load safely | `admin-cms-settings.spec.ts` |
| SET-001 | Setup | Business settings load safely | `admin-cms-settings.spec.ts` |
| SHIP-001 | Shipping | Country/state/city pages load safely | `admin-shipping.spec.ts` |
| ROLE-001 | Permissions | Staff/roles pages load safely | `admin-permissions.spec.ts` |
| UTIL-001 | Uploads | Uploaded files page loads safely | `admin-uploads-utilities.spec.ts` |

## Manual Coverage Still Required

The smoke suites prove page health and known regression coverage. Full manual verification is still required for:

- seller approval/ban/withdrawal workflows
- customer ban/package workflows
- support tickets, conversations, product queries, and contacts
- blog CRUD and storefront blog reflection if enabled
- POS product search, sale creation, and receipt generation
- report export file contents
- email/newsletter send behavior in a safe mail environment
