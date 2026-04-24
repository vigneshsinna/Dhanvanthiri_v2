# Codex Prompt: Generate Admin End-to-End Verification Documents and Tests

You are working on a Laravel Blade Admin + React Storefront ecommerce codebase.

The admin panel has many modules and several known issues:
- All Products option column actions such as edit/delete/clone do not work.
- Reports throw SQL error such as `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'amount' in 'field list'`.
- Marketing pages like Flash Deals, Dynamic Popup, and Email Templates show blank or missing content.
- Product AJAX table spinner remains loading.
- Sidebar search may not find CMS Pages.

Your task is to create a complete admin verification system.

Do the following:

1. Inspect the codebase and map every admin module:
   - routes
   - controllers
   - Blade views
   - models
   - JavaScript/AJAX endpoints
   - React storefront reflection points where applicable

2. Create documentation under `docs/qa/admin/`:
   - `admin-module-verification-matrix.md`
   - `detailed-admin-module-test-cases.md`
   - `admin-bug-report-template.md`
   - `admin-automation-test-plan.md`

3. Implement automated E2E tests using Playwright unless another E2E framework already exists.

4. Prioritize tests for:
   - All Products option column edit/delete/clone
   - Reports SQL errors
   - Marketing blank pages
   - Product AJAX spinner
   - Sidebar search
   - Admin-to-React storefront reflection

5. Add safe test guards:
   - mutating tests only run when `E2E_ALLOW_MUTATION=true`
   - destructive tests only run when `E2E_DB_IS_DISPOSABLE=true`

6. Fix verified issues only after reproducing them:
   - fix route/controller/view/JS mismatch
   - fix SQL query column mismatch
   - fix AJAX response shape
   - fix blank marketing page causes
   - fix option column event/action routes
   - fix sidebar search indexing

7. Run tests if possible and provide:
   - files added/changed
   - tests run
   - pass/fail result
   - bugs fixed
   - bugs remaining
   - manual verification still needed

Do not make broad rewrites.
Do not migrate Blade admin to React.
Keep Laravel Blade admin as the production admin.
Prefer safe incremental fixes with file-level evidence.
