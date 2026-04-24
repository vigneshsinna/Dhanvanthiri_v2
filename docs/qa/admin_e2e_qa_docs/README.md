# Admin Panel End-to-End Verification Pack

## Purpose

This pack is designed to verify whether every Laravel Blade Admin module works correctly from end to end and whether admin-managed data reflects properly in the React storefront where applicable.

Use this after every major admin/backend/storefront wiring update.

## Architecture Assumption

- Laravel Blade Admin remains the production admin.
- React storefront owns customer-facing pages.
- Laravel backend/API connects admin-managed data to storefront.
- Admin testing must cover both:
  1. Internal admin workflow correctness
  2. Storefront reflection where applicable

## Priority Levels

| Priority | Meaning |
|---|---|
| P0 | Blocks production or core commerce operations |
| P1 | Major admin workflow broken |
| P2 | Functional but weak UX, validation, feedback, or consistency |
| P3 | Polish or improvement |

## Recommended Test Order

1. Admin login and dashboard
2. Product management
3. Orders and sales
4. Marketing and promotions
5. Website/content management
6. Setup/configurations
7. Reports and analytics
8. Shipping/logistics
9. Customer/seller/staff modules
10. Blog, POS, uploads, utilities

## Known Example Issues to Validate

| Area | Example Issue | Expected Verification |
|---|---|---|
| All Products | Option column actions such as edit/delete/clone not working | Verify every row action opens the expected page/modal and completes successfully |
| Reports | SQL error: unknown column `amount` in field list | Verify report query columns exist and report page loads without SQL error |
| Marketing | Flash Deals, Dynamic Popup, Email Templates showing blank/empty | Verify routes, controller data, views, permissions, feature flags, and DB tables |
| Product AJAX table | Spinner remains loading | Verify datatable AJAX response shape and JS error handling |
| Sidebar Search | CMS Pages not found | Verify sidebar search index includes all visible admin sections |

## Completion Rule

A module is considered complete only when:

- menu item opens correctly
- list page loads correctly
- create flow works
- edit flow works
- delete/deactivate flow works where applicable
- filters/search/pagination work
- success/error messages are clear
- permissions are respected
- no SQL/500/404/JS console errors occur
- relevant storefront/API reflection works
- manual and automated tests are updated
