# Codex Prompt: Complete Storefront User Flow Automation

You are working on a Laravel backend + React storefront ecommerce codebase.

Your task is to create automated Playwright E2E tests and QA documentation for the complete customer journey.

Architecture:
- React owns storefront and customer-facing pages.
- Laravel owns APIs, product/catalog data, cart, checkout, payment, orders, account, CMS, and admin-managed data.
- Laravel Blade Admin remains the production admin.
- Do not migrate admin to React.
- Do not make broad rewrites.
- Only fix application bugs after reproducing them with a focused test.

Create documentation under `docs/qa/storefront-user-flow/`:
1. `user-flow-test-matrix.md`
2. `detailed-storefront-e2e-test-cases.md`
3. `react-ui-ux-resilience-checklist.md`
4. `playwright-automation-plan.md`

Then implement Playwright E2E tests for the customer journey.

Phases to automate:
1. Discovery & Evaluation: search, auto-suggest/recent searches, category browsing, filters, sorting, PDP images, descriptions/specs, reviews, variants, wishlist.
2. Cart & Authentication: add to cart, cart management, login/signup, forgot password, social login, guest checkout, cart merge.
3. Checkout Funnel: address, shipping, coupon, pricing formula, payment, order review, double-submit prevention.
4. Post-Purchase: confirmation, email/SMS logs, tracking, returns, support, reviews.
5. React UX: refresh persistence, loading states, disabled payment buttons, clear error handling.

Implementation rules:
- Inspect existing test setup first.
- Use Playwright unless another E2E framework exists.
- Use env-based test credentials and URLs.
- Add stable `data-testid` attributes only where necessary.
- Mutating tests require `E2E_ALLOW_MUTATION=true` and `E2E_DB_IS_DISPOSABLE=true`.
- Do not weaken assertions to pass broken behavior.
- If a real bug is found, report it and only fix it when scoped and safe.
- Run tests if the environment supports it.

Final response must include:
- docs created
- test files added
- test coverage matrix
- tests run and results
- bugs found
- bugs fixed
- bugs remaining
- how to run the tests
- required env variables
- manual checks still needed
