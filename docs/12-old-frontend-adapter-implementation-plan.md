# 12 — Old Frontend Adapter Implementation Plan

## Objective
Connect the old frontend to the new headless backend without rewriting the entire UI. The adapter layer should absorb contract differences between the old frontend expectations and the new backend responses.

## Why an adapter layer is needed
The old frontend is already modular and API-driven, but the new headless backend differs in:
- endpoint paths
- auth token handling
- payload shapes
- error envelopes
- cart and checkout semantics
- order and payment lifecycle states

The adapter layer lets the old UI continue working while the new backend becomes the source of truth.

## Target architecture
Old React frontend  
→ feature API modules  
→ adapter layer  
→ shared HTTP client  
→ new headless backend APIs

## Scope
### In scope
- feature-level request/response adapters
- DTO normalization
- error normalization
- auth token/session handling
- capability flags for conditional rollout
- fallback support during phased migration

### Out of scope
- redesigning UI pages
- replacing route structure unless required
- rewriting component library
- mixing old and new backend in checkout after transactional cutover

## Adapter design principles
1. Keep adapters close to each feature module.
2. Normalize all backend responses before they reach page components.
3. Convert backend errors into one consistent frontend error model.
4. Use typed DTOs for old UI expectations and new backend payloads.
5. Add observability on every adapted module during rollout.

## Suggested folder structure
```text
src/
  features/
    auth/
      api.ts
      adapter.ts
      types.ts
    catalog/
      api.ts
      adapter.ts
      types.ts
    cart/
      api.ts
      adapter.ts
      types.ts
  lib/
    api/
      client.ts
      errors.ts
      interceptors.ts
      capabilities.ts
```

## Work packages
### WP1 — Shared client hardening
- base URL by environment
- auth header injection
- token refresh handling
- request tracing headers
- normalized error parser
- retry rules for safe GET calls only

### WP2 — Response normalization
Create mappers for:
- product summary
- product detail
- category tree
- cart line item
- order summary
- order detail
- address object
- CMS page object

### WP3 — Feature adapters
Implement adapters for:
- auth
- catalog
- CMS
- wishlist
- addresses
- cart
- checkout
- orders

### WP4 — Feature flags
Add runtime capability switches for:
- read-only catalog from new backend
- auth from new backend
- cart from new backend
- checkout from new backend

## Example adapter pattern
```ts
export function mapProduct(dto: NewBackendProduct): OldUiProduct {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    thumbnail: dto.thumbnail_image || dto.main_image,
    price: dto.price?.display ?? dto.main_price,
    rating: dto.rating ?? 0,
    inStock: dto.stock_status !== "out_of_stock",
  };
}
```

## Delivery phases
### Phase A — Read-only
Catalog, CMS, search, brands, categories, product detail

### Phase B — Logged-in non-transactional
Auth, account basics, addresses, wishlist, order history

### Phase C — Transactional
Cart, checkout, payments, orders

## Risks
- hidden assumptions in old UI state shape
- duplicate cart identity rules
- token lifecycle mismatch
- payment callback assumptions
- inconsistent error handling

## Acceptance criteria
- no page should consume raw new-backend DTOs directly
- all adapted features compile with strict typing
- adapters have unit tests for happy path and null/edge cases
- feature flags allow partial rollout by module
- old frontend can switch environments without code changes
