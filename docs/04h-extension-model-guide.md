# 04h — Extension Model Guide

> Step 2 · Sprint 2D · Headless API Contract Stabilization

## Purpose
Defines how new features, addons, and third-party integrations should extend the API contract without breaking existing storefront consumers.

---

## 1. Extension Principles

1. **Additive only**: New fields/endpoints are added, existing ones never removed or renamed
2. **Capability-gated**: Every new feature gets a capability flag before the storefront depends on it
3. **Backward compatible**: Unknown fields are ignored by older clients; missing flags are assumed `false`
4. **Namespaced**: Vendor/addon-specific data goes under a namespace key, not at root

---

## 2. Adding a New Endpoint

### Checklist

1. Create controller extending `Controller` and `use ApiResponseTrait`
2. Use storefront-safe DTO (JsonResource) — never return Eloquent models directly
3. Register route in `routes/api.php` under `v2` prefix
4. Add capability flag to `CapabilityController` if feature is toggleable
5. Add TypeScript types to `storefront/src/api/types.ts`
6. Add API module to `storefront/src/api/`
7. Add contract test to `tests/Feature/Api/V2/ApiContractTest.php`
8. Document in domain inventory (`docs/04a-api-domain-inventory.md`)

### Example: Adding a prescription upload feature

```php
// 1. Controller
class PrescriptionController extends Controller
{
    use ApiResponseTrait;

    public function upload(Request $request)
    {
        // ... handle upload ...
        return $this->createdResponse($prescription, 'Prescription uploaded');
    }
}

// 2. Capability flag
'prescription_upload' => (bool) get_setting('prescription_upload'),

// 3. Route
Route::post('prescriptions/upload', [PrescriptionController::class, 'upload'])
    ->middleware('auth:sanctum');
```

---

## 3. Adding Fields to Existing DTOs

### Rules

- **DO**: Add new optional fields with sensible defaults
- **DON'T**: Rename existing fields
- **DON'T**: Change field types (e.g. string → number)
- **DON'T**: Remove fields without a deprecation period

### Example: Adding `sku` to ProductSummaryResource

```php
// In ProductSummaryResource.php — just add the field
return [
    // ... existing fields ...
    'sku' => $this->sku ?? '',  // New field, defaults to empty string
];
```

```typescript
// In types.ts — add as optional
export interface ProductSummary {
  // ... existing fields ...
  sku?: string;  // New, optional for backward compat
}
```

---

## 4. Addon Data Namespacing

When addons provide extra fields, namespace them to avoid collision:

```json
{
  "id": 123,
  "name": "Wireless Headphones",
  "price": "$29.99",
  "extensions": {
    "wholesale": {
      "tiers": [{"min_qty": 10, "price": "$25.00"}]
    },
    "auction": {
      "is_auction": true,
      "current_bid": "$32.00"
    }
  }
}
```

---

## 5. Versioning Strategy

### Current: V2 (living version)

The V2 API evolves in-place with the following rules:
- Breaking changes require a 30-day deprecation notice
- Deprecated fields/endpoints emit `X-Deprecated: true` header
- New versions (V3) only created for fundamental contract changes

### Deprecation Process

1. Add `X-Deprecated: true` header to response
2. Add `X-Sunset-Date: YYYY-MM-DD` header
3. Log usage of deprecated endpoint
4. Document in `docs/04j-versioning-deprecation-policy.md`
5. After sunset date, return `410 Gone` with migration instructions

---

## 6. Third-Party Integration Points

| Integration Type | Extension Method |
|-----------------|------------------|
| New payment gateway | Add controller, map webhook events to `PaymentStatus` enum |
| New shipping carrier | Add carrier to `shipping_cost` calculation, return in `delivery-info` |
| New notification channel | Add to notification service, no API change needed |
| New authentication provider | Add to `social-login` endpoint's provider list |
| Custom product attributes | Use `extensions` namespace in product DTOs |
