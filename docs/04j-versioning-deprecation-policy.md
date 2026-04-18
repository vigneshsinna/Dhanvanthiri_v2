# 04j — Versioning & Deprecation Policy

> Step 2 · Sprint 2E · Headless API Contract Stabilization

## Purpose
Defines how the API versioning works, what constitutes a breaking change, and the process for deprecating endpoints.

---

## 1. Current Version

**V2** — the living version. All storefront-facing endpoints live under `/api/v2/`.

V2 is a "living version" that evolves in-place with strict backward compatibility rules. We do NOT create V3 for additive changes.

---

## 2. What is a Breaking Change?

### Breaking (requires new version or deprecation cycle)

- Removing a field from a response
- Changing a field's type (e.g., `string` → `number`)
- Renaming a field
- Changing HTTP method (e.g., `GET` → `POST`)
- Changing URL path
- Removing an endpoint
- Changing authentication requirements (public → auth required)
- Changing error code for a specific scenario

### Non-Breaking (allowed in-place)

- Adding new fields to responses
- Adding new optional query parameters
- Adding new endpoints
- Adding new error codes for new scenarios
- Adding new capability flags
- Changing human-readable `message` text
- Performance improvements

---

## 3. Deprecation Process

### Timeline

```
Day 0:  Announce deprecation (add header + docs)
Day 30: Log usage warnings for deprecated endpoint
Day 60: Return warning in response body
Day 90: Return 410 Gone (endpoint removed)
```

### HTTP Headers

When an endpoint is deprecated, add these headers to every response:

```http
X-Deprecated: true
X-Sunset-Date: 2025-06-01
X-Replacement: /api/v2/new-endpoint
```

### Response Body Warning (Day 60+)

```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "meta": {
    "deprecation": {
      "deprecated": true,
      "sunset_date": "2025-06-01",
      "replacement": "/api/v2/new-endpoint",
      "message": "This endpoint will be removed on 2025-06-01. Use /api/v2/new-endpoint instead."
    }
  }
}
```

### Gone Response (Day 90+)

```json
{
  "success": false,
  "message": "This endpoint has been removed",
  "error": {
    "code": "ENDPOINT_DEPRECATED",
    "details": {
      "replacement": "/api/v2/new-endpoint",
      "removed_on": "2025-06-01"
    }
  }
}
```

---

## 4. Version Negotiation

Currently only V2 exists. If V3 is ever needed:

- V2 endpoints continue to work during migration period
- V3 endpoints live under `/api/v3/`
- `Accept-Version` header can optionally select version
- Default version is always the latest stable

---

## 5. Changelog Convention

All API changes are documented in `CHANGELOG.md` with:

```markdown
## [2025-01-15] API Changes

### Added
- `GET /api/v2/capabilities` — Runtime feature flags endpoint
- `ProductSummaryResource` DTO for normalized product listings
- `ApiResponseTrait` for standardized response envelopes

### Changed
- Exception handler now returns standardized JSON for API requests

### Deprecated
- None

### Removed
- None
```
