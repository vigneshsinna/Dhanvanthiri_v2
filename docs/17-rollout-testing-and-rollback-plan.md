# 17 — Rollout, Testing, and Rollback Plan

## Objective
Release the old-frontend-to-new-headless migration safely in phases, with measurable readiness and rollback control.

## Release principles
- migrate read-only before transactional
- keep a feature-level rollback path
- instrument before exposing traffic
- do not cut over checkout until lower-risk domains are stable

## Rollout phases
### Phase A — Internal validation
- developer and QA verification
- staging environment check
- contract mismatch logging
- admin/support dry run

### Phase B — Read-only production cutover
- home, categories, brands, search, PDP, CMS
- observe API performance, error rate, SEO health

### Phase C — Auth/account cutover
- login, profile, addresses, wishlist, orders
- verify session stability and customer support readiness

### Phase D — Cart cutover
- move cart and totals to new backend
- monitor conversion funnel and cart mismatch incidents

### Phase E — Checkout cutover
- limited user cohort first
- payment monitoring in real time
- clear rollback/no-rollback thresholds

## Testing layers
- unit tests for adapters
- integration tests for feature API modules
- end-to-end tests for critical journeys
- manual QA for payment and order flows
- cross-browser and responsive coverage

## Key monitoring signals
- frontend error rate
- API latency
- auth failure rate
- cart mismatch incidents
- checkout abandonment changes
- payment failure spikes
- order creation discrepancies

## Rollback rules
### Allowed rollback
- read-only pages
- auth/account pages before checkout migration is live
- cart if checkout is still on old backend

### Restricted rollback
- once checkout is fully cut over, rollback must be planned carefully and usually not immediate

## Release checklist
- feature flags configured
- logging dashboards ready
- payment sandbox verified
- support team briefed
- rollback owner assigned
- release communication prepared

## Acceptance criteria
- each phase has entry and exit criteria
- rollback ownership is assigned
- production observability exists before cutover
- no phase advances without verified metrics
