# Detailed Admin Module Test Cases

## General Test Rules for Every Module

For each module, verify:

- menu opens without 404/500
- list page loads without SQL error
- search/filter/sort/pagination work
- create form opens
- validation works
- save works
- edit works
- delete/deactivate/restore works where applicable
- success/error toast/message appears
- browser console has no JS errors
- network requests return expected status
- permission restrictions work
- relevant React storefront/API reflects admin changes

---

## 1. Dashboard Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| DASH-001 | Open dashboard | Login as admin and open `/admin` | Dashboard loads with charts/widgets | P1 |
| DASH-002 | Sales analytics | Change date range if available | Sales chart updates without JS/SQL error | P2 |
| DASH-003 | Order statistics | Compare widget count with order list filters | Counts are consistent | P2 |
| DASH-004 | Top products/categories | Verify top lists render | Data appears or empty state shown | P2 |

## 2. Product Management Module

### All Products

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PROD-001 | Product list loads | Open All Products | Table loads and spinner stops | P0 |
| PROD-002 | Option column edit | Click Edit in option column | Product edit page opens | P0 |
| PROD-003 | Option column delete | Click Delete | Confirmation appears, delete succeeds/cancels safely | P0 |
| PROD-004 | Clone product | Click Clone/Duplicate | Clone is created or clone page opens | P0 |
| PROD-005 | Quick price edit | Change price from list if supported | Price saves and React PDP/cart reflect new price | P0 |
| PROD-006 | Quick stock edit | Change stock from list if supported | Stock saves and React PDP/cart reflect new stock | P0 |
| PROD-007 | Product create | Create required product fields | Product saves and appears in list | P0 |
| PROD-008 | Product storefront reflection | Open React PDP/listing | Name, price, stock, images, publish status are correct | P0 |
| PROD-009 | Product image upload | Upload image | Image saves and displays in admin and storefront | P1 |
| PROD-010 | SEO fields | Update meta title/description | React PDP receives SEO data where supported | P2 |

### Categories / Brands / Attributes / Colors

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| CAT-001 | Category CRUD | Create/edit/delete category | Category flow works without error | P0 |
| CAT-002 | Category hierarchy | Create subcategory | Hierarchy displays correctly | P1 |
| CAT-003 | Category storefront | Open React category page | Products and category data reflect admin changes | P0 |
| BRAND-001 | Brand CRUD | Create/edit/delete brand | Brand flow works without error | P1 |
| ATTR-001 | Attribute CRUD | Create/edit/delete attribute | Attribute appears in product variation flow | P1 |
| COLOR-001 | Color CRUD | Create/edit/delete color | Color swatch saves and appears in product form | P2 |

### Bulk Import / Reviews / Warranty / Size Charts

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| BULK-001 | Product import template | Download template | File downloads successfully | P2 |
| BULK-002 | Product import validation | Upload invalid file | Clear error report appears | P1 |
| REVIEW-001 | Review moderation | Approve/hide/delete review | Review status updates and reflects on PDP | P2 |
| WARRANTY-001 | Warranty CRUD | Create/edit warranty | Warranty available in product setup | P2 |
| SIZE-001 | Size chart CRUD | Create/edit size chart | Size chart available on product/PDP | P2 |

## 3. Sales & Order Management Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| ORD-001 | All orders list | Open all orders | Orders load without SQL/JS error | P0 |
| ORD-002 | Order details | Open order detail | Products, payment, shipping, customer data show | P0 |
| ORD-003 | Delivery status update | Change delivery status | Success message and status persists | P0 |
| ORD-004 | Payment status update | Change payment status if allowed | Success message and payment state persists | P0 |
| ORD-005 | Tracking update | Add/update tracking code | Customer tracking page reflects it | P1 |
| ORD-006 | Invoice download | Download invoice | PDF/file generated correctly | P1 |
| ORD-007 | React account reflection | Open customer order detail/tracking | Updated status appears | P0 |

## 4. Seller Management Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SELL-001 | Seller list | Open seller list | List loads correctly | P1 |
| SELL-002 | Seller approve/verify | Approve pending seller | Status changes and persists | P1 |
| SELL-003 | Seller ban/unban | Toggle ban state | Seller access/status updates | P1 |
| SELL-004 | Withdrawal requests | Open and process withdrawal | Request status updates safely | P1 |
| SELL-005 | Commission settings | Update commission | New commission applies to future orders | P1 |

## 5. Customer Management Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| CUST-001 | Customer list | Open customers | List loads and search works | P1 |
| CUST-002 | Customer details | Open customer record | Profile and order history show correctly | P1 |
| CUST-003 | Customer status | Ban/deactivate if supported | Confirmation and persistence work | P1 |
| CUST-004 | Customer packages | Create/edit package | Package appears and works as configured | P2 |

## 6. Marketing & Promotions Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| MKT-001 | Coupons list | Open coupons | List loads without error | P0 |
| MKT-002 | Coupon create | Create cart/product/shipping coupon | Coupon applies correctly in checkout | P0 |
| MKT-003 | Flash deals list | Open flash deals | Page loads and shows data/empty state | P0 |
| MKT-004 | Flash deal create | Create flash deal with product discount | React storefront reflects promotion | P0 |
| MKT-005 | Dynamic popup | Open/create/edit popup | Popup config saves and storefront shows it | P1 |
| MKT-006 | Email templates | Open templates | Template list loads and edit saves | P1 |
| MKT-007 | Newsletter send | Send test newsletter if safe | Mail job/log is created without error | P2 |
| MKT-008 | Subscribers | Add/export subscriber | List/export works | P2 |
| MKT-009 | Custom alerts | Create/edit alert | Alert appears on storefront if enabled | P1 |

## 7. Support & Communications Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SUP-001 | Support tickets | Open tickets | List loads and filters work | P1 |
| SUP-002 | Ticket reply | Reply to ticket | Reply saves and customer can see it | P1 |
| SUP-003 | Conversations | Open conversations | Thread loads without error | P2 |
| SUP-004 | Product queries | Answer product query | Reply appears on product/customer side | P2 |
| SUP-005 | Contact messages | Open contact messages | Messages load and status updates | P2 |

## 8. Reports & Analytics Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| REP-001 | Sale report | Open sale report | Loads without SQL error | P0 |
| REP-002 | Stock report | Open stock report | Loads low stock/current stock data | P1 |
| REP-003 | Wishlist report | Open wishlist report | Loads wishlist data | P2 |
| REP-004 | User search report | Open search report | Loads search keywords | P2 |
| REP-005 | Commission history | Open commission report | Loads commission data | P1 |
| REP-006 | Earning/payout report | Open earning/payout | No SQL error such as unknown column `amount` | P0 |
| REP-007 | Report filters | Apply date/seller/category filters | Results update correctly | P1 |
| REP-008 | Export | Export report if available | File downloads with correct columns | P2 |

## 9. Website & Content Management Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| WEB-001 | Appearance settings | Update theme/color/logo if available | React reflects supported settings | P1 |
| WEB-002 | Custom page CRUD | Create/edit About/Terms page | React page route shows updated content | P0 |
| WEB-003 | Header/footer | Update nav/footer/contact | React header/footer updates | P0 |
| WEB-004 | Elements | Update homepage element | React homepage reflects it if wired | P1 |
| WEB-005 | Top banners/sliders | Update banner/slider | React homepage updates image/link | P0 |

## 10. Setup & Configurations Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SET-001 | General settings | Update site name/logo/timezone | Saves and reflects where expected | P0 |
| SET-002 | Activation settings | Toggle guest checkout/wallet/etc. | Feature behavior changes correctly | P0 |
| SET-003 | Payment methods | Open and update payment config | Saves safely, no secrets exposed | P0 |
| SET-004 | Shipping config | Update shipping cost/free shipping | Checkout shipping reflects settings | P0 |
| SET-005 | Languages | Add/edit language | Admin/storefront language behavior works | P2 |
| SET-006 | Currency | Update currency/rate | Storefront prices reflect currency behavior | P1 |
| SET-007 | SMTP/third-party | Save config/test mail where safe | Test works or clear error shown | P1 |
| SET-008 | Social login | Verify config page | Saves without breaking auth | P2 |

## 11. Staff & Permissions Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| STAFF-001 | Staff CRUD | Create/edit staff | Staff can login if active | P0 |
| ROLE-001 | Role CRUD | Create/edit role | Permissions save correctly | P0 |
| ROLE-002 | Permission enforcement | Login as limited staff | Hidden/restricted pages are blocked | P0 |
| ROLE-003 | Unauthorized access | Direct URL restricted page | Access denied, not 500 | P0 |

## 12. Blog System Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| BLOG-001 | Blog category CRUD | Create/edit category | Category saves | P2 |
| BLOG-002 | Blog CRUD | Create/edit/publish blog | Blog appears on storefront if wired | P2 |
| BLOG-003 | SEO | Update meta fields | Storefront uses metadata if wired | P3 |

## 13. POS Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| POS-001 | Open POS | Open POS interface | UI loads and product search works | P1 |
| POS-002 | Add product | Add product to POS cart | Cart total updates | P1 |
| POS-003 | Complete POS order | Complete sale in test mode | Order/inventory update correctly | P1 |
| POS-004 | Receipt | Print/download receipt | Receipt generated correctly | P2 |

## 14. Shipping & Logistics Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SHIP-001 | Country/state/city CRUD | Create/edit geography records | Saves and appears in address forms | P0 |
| SHIP-002 | Carrier CRUD | Create/edit carrier | Carrier available for shipping setup | P1 |
| SHIP-003 | Zone CRUD | Create/edit shipping zone | Checkout shipping uses zone logic | P0 |
| SHIP-004 | Pickup point CRUD | Create/edit pickup point | Checkout pickup option shows | P1 |
| SHIP-005 | Box size CRUD | Create/edit box size | Shipping calculation uses data if applicable | P2 |

## 15. System Utilities & Uploads

| Test ID | Scenario | Steps | Expected Result | Priority |
|---|---|---|---|---|
| UTIL-001 | Uploaded files | Upload image/file | File appears and usable in product/CMS | P0 |
| UTIL-002 | Media delete | Delete file if safe | Confirmation appears and delete succeeds | P2 |
| UTIL-003 | Cache clear | Clear cache | Success message and no route breakage | P1 |
| UTIL-004 | Sitemap | Generate sitemap | XML generated successfully | P1 |
| UTIL-005 | Server status | Open status page | PHP/extensions info loads | P2 |
| UTIL-006 | System update | Open update page | Page loads; do not run update in production test | P2 |
