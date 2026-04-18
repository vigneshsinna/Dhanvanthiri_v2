# Dark Premium Admin Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Laravel admin panel into a dark, premium, high-density workspace for power users while preserving existing backend behavior.

**Architecture:** Replace the shared admin shell first so the visual system propagates broadly, then refit the busiest admin page types to the new command-page pattern. Keep all business logic, routes, and permissions intact by limiting changes to Blade structure and shared CSS.

**Tech Stack:** Laravel Blade, existing AIZ admin assets, custom admin CSS, Bootstrap-era layout classes, jQuery-driven interactions

---

### Task 1: Save the approved design documentation

**Files:**
- Create: `docs/plans/2026-04-17-admin-dark-premium-design.md`
- Create: `docs/plans/2026-04-17-admin-dark-premium.md`

**Step 1: Write the approved design doc**

Capture the dark premium visual direction, responsive behavior, shared shell strategy, key page patterns, and non-goals in `docs/plans/2026-04-17-admin-dark-premium-design.md`.

**Step 2: Write the implementation plan**

Capture the concrete implementation sequence, affected files, and verification focus in `docs/plans/2026-04-17-admin-dark-premium.md`.

**Step 3: Quick verify docs exist**

Run: `Get-ChildItem docs\plans`
Expected: Both new 2026-04-17 admin redesign docs are listed.

### Task 2: Rebuild the shared admin shell

**Files:**
- Modify: `resources/views/backend/layouts/app.blade.php`
- Modify: `resources/views/backend/inc/admin_nav.blade.php`
- Modify: `resources/views/backend/inc/admin_sidenav.blade.php`
- Modify: `public/assets/css/admin-redesign.css`

**Step 1: Update the shared layout wrappers if needed**

Keep the current shell hooks but make sure the layout supports the denser topbar, rail, content shell, and footer spacing.

**Step 2: Refactor the topbar**

Turn the existing topbar into a darker command surface with:
- page context
- quick action cluster
- utility controls
- stronger responsive wrapping

**Step 3: Refactor the sidebar**

Turn the left nav into a darker command rail with:
- stronger branding
- clearer search
- better submenu readability
- stronger active and hover states

**Step 4: Rewrite the shared admin CSS**

Replace the light glass system in `public/assets/css/admin-redesign.css` with:
- dark palette tokens
- denser spacing tokens
- shell, nav, topbar, page-header, stats, card, form, table, badge, and mobile styles
- compatibility styling for reused legacy admin components

**Step 5: Verify broad CSS hooks still match Blade structure**

Run: `rg -n "admin-(hero|page-header|stats-grid|command-bar|section-intro|stat-card|chip|page-stat)" resources\views\backend -g "*.blade.php"`
Expected: The targeted pages still reference the shared admin redesign classes.

### Task 3: Refactor the high-traffic admin pages

**Files:**
- Modify: `resources/views/backend/dashboard.blade.php`
- Modify: `resources/views/backend/sales/index.blade.php`
- Modify: `resources/views/backend/sellers/index.blade.php`
- Modify: `resources/views/backend/product/products/index.blade.php`
- Modify: `resources/views/backend/website_settings/appearance.blade.php`

**Step 1: Rebuild the dashboard around denser premium panels**

Keep existing metrics and charts, but reorganize the page into a stronger hero, compact metric strip, and darker modules that feel coherent with the new shell.

**Step 2: Improve the orders page**

Keep filtering and bulk actions intact while tightening the header, queue stats, filter bar, and table rhythm.

**Step 3: Improve the sellers page**

Preserve seller management actions while strengthening the scanability of seller states, metrics, and command controls.

**Step 4: Improve the products page**

Refit the product page into the shared command-page system so the high-density catalog workflow feels native to the new shell.

**Step 5: Improve the appearance settings page**

Keep existing forms intact while reframing the settings groups into cleaner dark panels with stronger visual hierarchy.

### Task 4: Verify and try to start the local apps

**Files:**
- Modify: none

**Step 1: Syntax-adjacent verification**

Run focused file reads and searches to confirm Blade sections and shared class hooks remain structurally sound.

**Step 2: Try Laravel verification commands**

Run: `php artisan view:clear`
Expected: Success if PHP is available; otherwise capture the exact blocker.

Run: `php artisan view:cache`
Expected: Success if PHP is available; otherwise capture the exact blocker.

**Step 3: Try starting the backend**

Run: `php artisan serve`
Expected: Local Laravel dev server starts if PHP is available; otherwise report the runtime blocker.

**Step 4: Try starting the frontend**

Run: `npm run dev`
Workdir: `frontend`
Expected: Frontend dev server starts if Node dependencies and runtime are available.

**Step 5: Summarize outcomes**

Report:
- what changed
- which verification steps passed
- which runtime steps were blocked by the environment
