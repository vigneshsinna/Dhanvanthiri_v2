# 04c — JSON Contract Standard

> Step 2 · Sprint 2B · Headless API Contract Stabilization

## Purpose
Defines the universal JSON envelope, pagination conventions, filtering, sorting, and search standards for all V2 API endpoints.

---

## 1. Universal Response Envelope

Every API response MUST use this shape:

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": { ... },
  "meta": { ... },
  "error": null
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | `boolean` | Always | `true` for 2xx, `false` for 4xx/5xx |
| `message` | `string` | Always | Human-readable, translatable message |
| `data` | `object\|array\|null` | Always | Response payload |
| `meta` | `object\|null` | Optional | Pagination, filter context |
| `error` | `object\|null` | On error | Error details (see Error Envelope) |

### Error Envelope

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "email": ["The email field is required."],
      "password": ["The password must be at least 6 characters."]
    },
    "details": {}
  }
}
```

---

## 2. HTTP Status Code Rules

| Status | When |
|--------|------|
| `200 OK` | Successful read or update |
| `201 Created` | Resource created (order, address, review) |
| `204 No Content` | Successful delete |
| `400 Bad Request` | Malformed request |
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | Valid token but insufficient permissions |
| `404 Not Found` | Resource or endpoint not found |
| `409 Conflict` | Business rule violation (out of stock, coupon expired) |
| `422 Unprocessable Entity` | Validation errors |
| `429 Too Many Requests` | Rate limited |
| `500 Internal Server Error` | Unexpected server failure |

**Rule**: Never return `200` with `success: false`. Match HTTP status to outcome.

---

## 3. Pagination Standard

All paginated endpoints use offset-based pagination:

```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 142,
    "has_more": true
  }
}
```

### Query Parameters

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Current page number |
| `per_page` | 20 | 100 | Items per page |

### Implementation

```php
use App\Traits\ApiResponseTrait;

class ProductController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $products = Product::paginate($request->input('per_page', 20));
        return $this->paginatedResponse($products, function ($product) {
            return new ProductSummaryResource($product);
        });
    }
}
```

---

## 4. Filtering Standard

Filters are passed as query parameters. Collections support:

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `category_id` | int | `?category_id=5` | Filter by category |
| `brand_id` | int | `?brand_id=12` | Filter by brand |
| `min_price` | float | `?min_price=10.00` | Minimum price |
| `max_price` | float | `?max_price=100.00` | Maximum price |
| `in_stock` | bool | `?in_stock=1` | Only in-stock items |

---

## 5. Sorting Standard

| Param | Values | Default |
|-------|--------|---------|
| `sort_by` | `newest`, `oldest`, `price_asc`, `price_desc`, `rating`, `sales` | `newest` |

```
GET /api/v2/products?sort_by=price_asc&page=2&per_page=20
```

---

## 6. Search Standard

| Param | Type | Description |
|-------|------|-------------|
| `keyword` | string | Full-text search term |
| `category_id` | int | Narrow search to category |
| `brand_id` | int | Narrow search to brand |
| `sort_by` | string | Sort results |

```
GET /api/v2/products/search?keyword=wireless+headphones&sort_by=rating&page=1
```

---

## 7. Date/Time Format

All timestamps use ISO 8601: `2024-01-15T14:30:00+00:00`

Never use:
- Unix timestamps in responses
- Custom date formats like `d-m-Y`
- `diffForHumans()` — let the client localize

---

## 8. Money Format

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `*_price` (display) | string | `"$29.99"` | Formatted with currency symbol |
| `calculable_price` | float | `29.99` | Raw numeric for calculations |
| `currency_symbol` | string | `"$"` | Symbol for client-side formatting |

---

## 9. Image URLs

All image fields return absolute URLs:
```json
{
  "thumbnail_image": "https://example.com/uploads/products/thumb_abc123.jpg",
  "photos": [
    {"variant": "", "path": "https://example.com/uploads/products/photo1.jpg"}
  ]
}
```

Never return relative paths or upload IDs.

---

## 10. Null vs Missing Fields

- Use `null` for optional fields that have no value
- Never omit a documented field — always include it (even as `null`)
- Empty arrays: `[]` (not `null`)
- Empty strings: `""` (not `null`) for text fields

---

## Implementation Trait

See `app/Traits/ApiResponseTrait.php` for the PHP implementation providing:
- `successResponse($data, $message, $status)`
- `collectionResponse($data, $meta, $message)`
- `paginatedResponse($paginator, $transformer)`
- `actionResponse($data, $message)`
- `createdResponse($data, $message)`
- `validationErrorResponse($fields, $message)`
- `businessErrorResponse($code, $message, $details)`
- `notFoundResponse($message)`
- `unauthorizedResponse($message)`
- `forbiddenResponse($message)`
- `serverErrorResponse($message)`
- `rateLimitedResponse($message)`
