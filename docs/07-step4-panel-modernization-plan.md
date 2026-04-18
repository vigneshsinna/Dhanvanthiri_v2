# 07 — Step 4 Panel Modernization Plan

## Document Purpose

This document defines the modernization plan for internal and authenticated panels after the storefront and API layers are stable enough to support the next phase.

Step 4 focuses on:
- panel SPA conversion,
- internal UX consistency,
- runtime performance and developer productivity,
- safer reuse of the headless commerce core across customer and operational surfaces.

This step does **not** replace the commerce core. It modernizes the surfaces that operate on top of it.

---

## 1. Why Step 4 Comes After Step 3

Step 1 and Step 2 established:
- a decoupled storefront architecture,
- a reusable API contract.

Step 3 productizes the customer-facing storefront.

Step 4 then addresses the operational side:
- customer account area maturity,
- seller-facing workflows,
- admin-facing workflows,
- internal dashboard modernization,
- shared component and state patterns.

This order matters because Step 4 should build on already-stabilized contracts rather than inventing them.

---

## 2. Panel Scope

## In scope
- customer self-service panel refinement where applicable
- seller panel modernization
- admin panel modernization
- shared SPA shell patterns
- route/module partitioning
- design system reuse for authenticated panels
- state management and data-fetch patterns
- migration and rollout strategy

## Out of scope
- backend commerce logic replacement
- complete ERP/OMS re-architecture
- non-panel public storefront pages
- CDN and low-level cache tuning (covered separately)

---

## 3. Panel Categories

## 3.1 Customer account panel
Purpose:
- self-service order visibility
- address/profile management
- post-purchase retention actions

Status:
- partly covered by Step 3 / account docs
- should reuse storefront auth and API client rules

## 3.2 Seller panel
Purpose:
- manage catalog
- manage orders
- manage payouts / withdrawals
- shop settings
- promotions
- tickets or conversations where applicable

Status:
- backend APIs exist broadly
- current UX may still be server-rendered / legacy-driven
- ideal candidate for phased SPA migration

## 3.3 Admin panel
Purpose:
- platform operations
- product/catalog control
- order oversight
- customer/seller management
- content/promotion configuration
- reporting and settings

Status:
- large legacy surface
- should be modernized in phases, not rewritten all at once

---

## 4. Modernization Goals

1. **Reduce backend-template coupling**  
   Panels should not rely on tightly mixed presentation and backend concerns.

2. **Increase reuse of API contracts**  
   Panels should consume the same normalized or standardized APIs where possible.

3. **Improve operator productivity**  
   Faster tables, filters, forms, and workflows.

4. **Create consistent UX patterns**  
   Shared nav, list pages, detail pages, forms, errors, and bulk actions.

5. **Enable incremental rollout**  
   One module at a time, with rollback paths.

---

## 5. Target Architecture

## Frontend
- route-based SPA per panel domain
- shared UI primitives
- domain-specific modules
- typed API client
- query/mutation patterns
- protected-route shells

## Backend
- API-first contract for panel workflows
- keep legacy endpoints available during migration
- use adapters where required
- preserve permission and business-rule ownership in backend

## Deployment model
Choose one of:
1. separate SPA per panel domain
2. single authenticated operations SPA with role-gated sections

### Recommendation
Use a modular single SPA shell when:
- there is strong component reuse,
- teams are shared,
- deployment simplicity matters.

Use separate SPAs when:
- admin and seller domains diverge heavily,
- release cadence or ownership differs significantly.

---

## 6. Migration Strategy

## 6.1 Module-by-module strangler pattern
Do not rewrite every panel screen together.

Use this sequence:
1. identify high-value, low-complexity panels;
2. expose or standardize required APIs;
3. build SPA version in parallel;
4. route selected users/roles to the new panel;
5. observe;
6. expand.

## 6.2 Coexistence period
During migration:
- legacy server-rendered panels may remain active,
- new SPA modules coexist,
- both consume the same backend truths.

---

## 7. Suggested Modernization Priority

## Wave 1 — Customer account completion
- account shell
- orders
- addresses
- wishlist/profile
- post-checkout views

Why first:
- aligned with Step 3
- strong API reuse
- lower internal operational risk

## Wave 2 — Seller essentials
- seller dashboard
- product list
- product create/edit
- order management
- payout / withdrawal view
- shop settings

Why next:
- revenue-critical
- easier to scope than full admin panel
- strong business value

## Wave 3 — Admin operational tables
- order oversight
- product moderation / management
- customer list
- seller management
- support/ticket views where needed

Why third:
- large but high-value
- strongest benefit from better filters/tables/actions

## Wave 4 — Advanced admin modules
- promotions and campaigns
- content management
- analytics/reporting dashboards
- settings/configuration
- bulk operations

---

## 8. Shared Panel Design System

Authenticated panels should share:
- shell layout
- side navigation
- top navigation
- table system
- form system
- modal system
- confirmations
- badges/status chips
- pagination/filter patterns
- inline bulk action patterns
- notification patterns

This can reuse and extend the storefront design system but should introduce panel-specific patterns:
- denser information displays
- table filters
- permissions-aware actions
- destructive action flows

---

## 9. Data and State Patterns

## Query/data strategy
- use a typed SDK for panel APIs
- use server-state tooling for lists/details/mutations
- keep mutation side effects centralized
- avoid scattering backend shape knowledge across screens

## Local state strategy
- local component state for UI-only concerns
- centralized state only when cross-route persistence is needed
- cache invalidation rules documented by module

---

## 10. Permissions and Role Model

All authorization remains backend-owned.

Frontend responsibilities:
- hide obviously unavailable actions,
- show permissions-aware UI,
- never replace backend authorization with client logic.

Every panel module must define:
- visible roles,
- allowed actions,
- read-only vs editable states,
- destructive action protection.

---

## 11. Quality and Rollout Controls

## Required
- route-based monitoring
- module-level error tracking
- role-based feature flags
- rollback path to legacy view
- contract test coverage for key APIs

## Recommended
- usage analytics for operator pain points
- screen performance monitoring
- table load benchmarks
- mutation success/failure dashboards

---

## 12. Risks

- attempting full panel rewrite too early
- mixing legacy and new UI patterns without clear boundaries
- incomplete API contracts blocking module migration
- insufficient permission modeling
- regressions in high-volume admin workflows

---

## 13. Acceptance Criteria

Step 4 planning is ready when:
1. panel domains are identified;
2. migration priority is approved;
3. target frontend architecture is chosen;
4. coexistence model is defined;
5. shared panel design system scope is defined;
6. role/permission handling rules are defined;
7. rollout and rollback rules are defined.

---

## 14. Recommended Next Execution Docs After This

When Step 4 begins, create:
- `07a-seller-panel-module-inventory.md`
- `07b-admin-panel-module-inventory.md`
- `07c-panel-shared-ui-and-table-patterns.md`
- `07d-role-permission-ui-contract.md`

This plan keeps Step 4 incremental and commercially safe.
