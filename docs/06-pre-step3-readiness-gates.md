# 06a — Pre-Step 3 Readiness Gates

## Purpose

This document defines the three mandatory readiness gates that must be completed before full Step 3 execution begins.

Step 3 is focused on responsive storefront productization for a generic headless commerce core. Before moving into broader storefront expansion, the platform must first:

1. Reinstall frontend dependencies cleanly and verify a real production build
2. Finish the remaining high-priority Step 2 API contract tests
3. Decide whether Step 3 will consume only normalized endpoints or temporarily allow a mixed legacy/normalized adapter layer

These three items are not optional cleanup tasks. They are execution gates required to reduce delivery risk, avoid rework, and stabilize the platform before broader storefront rollout.

---

## Scope

This document covers:

- build verification and dependency reset for the storefront
- Step 2 contract-test completion priorities
- Step 3 integration strategy decision
- acceptance criteria for declaring Step 3 ready to proceed

This document does not replace the Step 3 execution plan. It is a readiness document that must be completed first.

---

## Why these gates are required

During verification, the following conditions were identified:

- the storefront source structure is present and aligned to the target architecture
- TypeScript verification passed
- the packaged frontend dependencies were not reliable enough to prove a clean production build from the uploaded archive
- Step 2 standards were implemented, but contract normalization was not yet fully rolled out across all live APIs
- Step 3 cannot move efficiently without a clear integration rule for normalized versus legacy endpoints

Because of this, Step 3 should only proceed after the following gates are completed.

---

# Gate 1 — Reinstall frontend dependencies and verify a real production build

## Objective

Establish that the storefront can be installed, built, and shipped from a clean environment without relying on packaged `node_modules` from an archive.

## Problem being addressed

A zip archive may carry broken binary permissions, incomplete native dependencies, or environment-specific artifacts. This means a source tree may look complete, but the build may still fail in a real CI/CD or production environment.

## Required actions

### 1. Remove packaged dependency artifacts

Delete the following from the storefront project:

- `node_modules/`
- any generated build output such as `dist/`
- any cached package manager files if present

### 2. Confirm package manager and runtime baseline

Record and standardize:

- Node.js version
- npm version
- operating system used for build verification

Recommended practice:

- create or update `.nvmrc` or equivalent runtime note
- ensure the team uses one agreed Node major version

### 3. Perform a clean install

From the storefront root:

```bash
rm -rf node_modules dist
npm install
```

If lockfile drift exists, validate whether `package-lock.json` is correct and committed.

### 4. Run validation commands

Run the following at minimum:

```bash
npm run lint
npm run typecheck
npm run build
```

If no `typecheck` script exists, use:

```bash
npx tsc --noEmit
```

### 5. Verify build output quality

Validate that:

- build completes without manual patching
- generated assets are present in `dist/`
- no critical warnings remain unresolved
- environment variables required for runtime are documented
- routing works correctly for SPA deployment assumptions

### 6. Verify deployment readiness

Test build output in a production-like serve mode, for example:

```bash
npm run preview
```

Or serve the generated static build through the intended web server/CDN path.

### 7. Capture evidence

Document the following in the implementation log:

- exact Node and npm versions used
- command outputs summary
- build success status
- unresolved warnings, if any
- final artifact size summary
- any environment variables required for runtime

## Deliverables

- cleanly installed storefront dependencies
- successful production build from source
- updated runtime/setup notes
- build verification record

## Acceptance criteria

Gate 1 is complete only when:

- frontend dependencies are installed from scratch successfully
- TypeScript validation passes
- linting passes or only accepted warnings remain documented
- production build succeeds from a clean environment
- build output is verified usable for deployment
- setup instructions are updated so another developer can reproduce the build

## Risks if skipped

- Step 3 begins on an unstable frontend baseline
- CI/CD failures appear late in the rollout
- deployment issues are mistaken for application bugs
- engineering time is wasted on environment-specific failures

---

# Gate 2 — Finish the remaining high-priority Step 2 contract tests

## Objective

Complete the most important contract tests needed to trust the API layer during Step 3 storefront expansion.

## Problem being addressed

Step 2 established the API contract direction, but incomplete contract coverage creates risk. When Step 3 starts consuming more flows, frontend teams may face inconsistent responses, missing envelope rules, and unverified checkout or account behaviors.

## Testing priority principle

Do not attempt full platform-wide completion before Step 3. Instead, finish the highest-value contract tests first.

These are the tests that directly protect the storefront rollout.

## Priority tiers

### Tier 1 — Must complete before Step 3 starts

These flows are mandatory.

#### A. Authentication contract tests

Cover:

- login success response structure
- login failure response format
- logout response format
- unauthenticated access behavior
- token/identity envelope consistency

#### B. Catalog listing contract tests

Cover:

- products listing envelope
- product detail response structure
- category listing structure
- brand listing structure
- pagination metadata consistency
- image/media field consistency
- pricing field consistency

#### C. Cart contract tests

Cover:

- add to cart response structure
- cart summary structure
- quantity update response structure
- remove item response structure
- guest vs authenticated behavior if applicable

#### D. Checkout contract tests

Cover:

- address submission contract
- delivery/shipping option response
- order summary response
- checkout phase/state transition response

#### E. Payment initiation contract tests

Cover:

- payment initiation response envelope
- required payment fields for frontend handoff
- failure response structure
- unsupported payment method behavior

#### F. Error contract tests

Cover:

- validation errors
- business rule failures
- not found responses
- unauthorized/forbidden responses
- standard error codes and messages

### Tier 2 — Strongly recommended immediately after Tier 1

- wishlist contracts
- customer profile contracts
- address book contracts
- orders list/detail contracts
- blog/content contracts
- seller listing/shop contracts, if Step 3 uses them early

### Tier 3 — Can continue in parallel with Step 3

- long-tail seller APIs
- admin-facing contract tests
- optional add-on modules
- lower-traffic legacy endpoints not used in the storefront yet

## Required actions

### 1. Build a remaining-test inventory

Create a simple tracker with:

- domain
- endpoint
- current status
- priority tier
- assigned owner
- target completion sprint

### 2. Complete Tier 1 tests first

Do not move to Step 3 full execution until all Tier 1 tests pass.

### 3. Add failure-case coverage

For every important success-path test, ensure there is matching failure-path verification where relevant.

### 4. Align tests to normalized contract rules

Validate:

- success envelope
- error envelope
- data object structure
- pagination object structure
- enums/status fields
- nullability rules

### 5. Capture test evidence

For each domain, record:

- passing status
- sample response shape
- known exceptions
- endpoints still pending migration

## Deliverables

- updated contract test tracker
- all Tier 1 tests passing
- documented Tier 2 and Tier 3 backlog
- verified response snapshots or examples

## Acceptance criteria

Gate 2 is complete only when:

- all Tier 1 contract tests are implemented and passing
- failures use the expected normalized error format
- contract gaps affecting Step 3 flows are documented
- remaining lower-priority tests are explicitly deferred and tracked

## Risks if skipped

- Step 3 storefronts are built on unstable API assumptions
- frontend work slows down due to response inconsistency
- checkout and payment issues surface late
- API regressions are found only during manual testing

---

# Gate 3 — Decide Step 3 integration mode

## Objective

Make a clear platform decision on whether Step 3 will consume only normalized endpoints or temporarily allow a mixed legacy/normalized adapter layer.

## Problem being addressed

Step 2 created normalized API standards, but not every endpoint may yet be migrated. Step 3 needs a clear execution rule so frontend development remains predictable.

Without this decision, teams may mix response shapes informally, leading to:

- duplicated mapping logic
- inconsistent typing
- hidden technical debt
- harder maintenance across future storefronts

## Decision options

### Option A — Normalized endpoints only

#### Description

Step 3 storefront code may consume only fully normalized API contracts.
Legacy endpoints must be migrated before the storefront can use them.

#### Advantages

- strongest contract discipline
- clean frontend types
- lower long-term technical debt
- easier reuse across client storefronts

#### Disadvantages

- may slow Step 3 delivery if endpoint migration is incomplete
- backend normalization work becomes a hard dependency

#### Best fit when

Choose this if:

- most required endpoints are already normalized
- backend team can finish remaining migrations quickly
- product prefers cleaner architecture over short-term speed

### Option B — Mixed mode with temporary adapter layer

#### Description

Step 3 may consume both normalized and legacy endpoints, but all legacy responses must pass through a strict frontend adapter/mapping layer before entering page components or shared state.

#### Advantages

- faster Step 3 delivery
- allows incremental migration
- reduces backend bottlenecks

#### Disadvantages

- adds temporary frontend complexity
- mapping layer must be maintained carefully
- risk of temporary code becoming permanent

#### Best fit when

Choose this if:

- a few critical endpoints remain legacy
- storefront delivery cannot wait for full migration
- the team can enforce adapter discipline strongly

## Recommended decision rule

Use the following rule:

- if more than 85–90% of Step 3 required endpoints are already normalized, prefer **Option A**
- if a small number of high-value Step 3 endpoints remain legacy and would block delivery, use **Option B** with strong expiry rules

## If Option B is chosen, mandatory constraints apply

A mixed-mode approach is acceptable only if all of the following are enforced:

### 1. No raw legacy responses inside pages/components

Legacy response mapping must happen only in:

- `src/api/adapters/`
- service-layer transformers
- domain mappers

Pages, hooks, store slices, and UI components must consume normalized frontend-safe types only.

### 2. Every adapter must have an owner

Each adapter should specify:

- source endpoint
- normalized target type
- migration owner
- planned removal milestone

### 3. Adapters must be temporary

Each adapter must include:

- a removal condition
- a target sprint or release for deletion
- a linked backend migration item

### 4. Type definitions must remain canonical

Canonical frontend types must live in one place. Legacy shapes must not spread throughout the app.

### 5. Contract-test parity must remain visible

If a legacy endpoint is used through an adapter, the team must still track whether the backend endpoint is normalized or pending.

## Decision template

Use this template to record the final platform decision.

### Step 3 Integration Decision

- Decision date:
- Decision owner:
- Selected option: Normalized only / Mixed mode with adapters
- Reason for decision:
- Endpoints still legacy but required for Step 3:
- Adapter owners:
- Adapter removal target:
- Risks accepted:
- Review date:

## Deliverables

- documented Step 3 integration decision
- endpoint classification list for Step 3 consumption
- adapter rules, if mixed mode is allowed
- removal plan for temporary adapter debt

## Acceptance criteria

Gate 3 is complete only when:

- a written decision is approved
- all Step 3 required endpoints are classified as normalized or legacy
- if mixed mode is used, adapter rules and removal targets are documented
- frontend team has one clear rule for all new development

## Risks if skipped

- unstructured technical debt enters the storefront
- shared component contracts drift over time
- future client storefronts become harder to scale
- Step 2 normalization loses authority

---

# Recommended execution order

Complete the gates in this order:

1. Gate 1 — clean install and production build verification
2. Gate 2 — Tier 1 Step 2 contract tests
3. Gate 3 — Step 3 integration mode decision

Reason:

- Gate 1 proves the frontend baseline is deployable
- Gate 2 proves the API baseline is trustworthy
- Gate 3 sets the rule for how Step 3 will consume the API

---

# Owner model

## Suggested ownership

### Frontend lead

Owns:

- Gate 1 execution
- storefront build validation
- adapter architecture if mixed mode is selected

### Backend/API lead

Owns:

- Gate 2 contract test completion
- endpoint normalization status
- migration status for remaining high-priority APIs

### Platform or architecture owner

Owns:

- Gate 3 decision approval
- exception handling
- ensuring temporary adapter debt does not become permanent

---

# Readiness checklist

Use this checklist before Step 3 full execution begins.

## Gate 1 checklist

- [ ] `node_modules` removed and reinstalled from scratch
- [ ] Node/npm versions recorded
- [ ] lint passed
- [ ] TypeScript validation passed
- [ ] production build passed
- [ ] build output verified
- [ ] setup/build notes updated

## Gate 2 checklist

- [ ] remaining test inventory prepared
- [ ] Tier 1 auth tests passed
- [ ] Tier 1 catalog tests passed
- [ ] Tier 1 cart tests passed
- [ ] Tier 1 checkout tests passed
- [ ] Tier 1 payment-init tests passed
- [ ] Tier 1 error contract tests passed
- [ ] pending Tier 2 and Tier 3 tests documented

## Gate 3 checklist

- [ ] Step 3 endpoint list classified
- [ ] integration mode decision documented
- [ ] adapter policy documented if mixed mode is allowed
- [ ] removal targets defined for temporary adapters
- [ ] platform owner approved the decision

---

# Final readiness rule

Step 3 may begin in full only when:

- Gate 1 is complete
- Gate 2 Tier 1 coverage is complete
- Gate 3 decision is documented and approved

If any of these remain incomplete, Step 3 may proceed only in a limited or preparatory mode, not in full production execution.

---

# Recommended immediate next actions

1. Reinstall dependencies and run a clean production build from the storefront source
2. Create a live tracker for remaining Tier 1 contract tests
3. Hold a short architecture decision session and finalize normalized-only versus mixed-mode strategy
4. Update the Step 3 execution plan to reference the outcome of this document

---

## Suggested output artifacts from this document

Create the following supporting files during execution:

- `06a-build-verification-report.md`
- `06b-step2-tier1-contract-test-tracker.md`
- `06c-step3-integration-decision-record.md`

These supporting artifacts will provide evidence that the readiness gates have been completed.
