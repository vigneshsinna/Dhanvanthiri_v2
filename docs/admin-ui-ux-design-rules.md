# Admin Panel – UI/UX Design Rules

> Canonical reference for all admin panel views. Every new page or component must follow these rules.

## 1. Page Structure

- Every page starts with `@include('backend.partials._breadcrumb', ['items' => [...]])`.
- Page title uses `<h2 class="page-title">` via `@include('backend.partials._page_title')` or directly.
- Primary action button sits in the title bar, right-aligned: `btn btn-primary` with `la-plus` icon for "Add New" actions.

## 2. Typography

| Element | Tag/Class | Size |
|---|---|---|
| Page title | `h2.page-title` | 1.375rem / 700 |
| Card title | `h5.mb-0.h6` | 0.875rem / 600 |
| Table header | `th` | default |
| Body text | `p` / `td` | default |

- Never use `h1` in admin pages (reserved for the storefront).
- Never use inline `style=` for font sizing or color.

## 3. Status Badges

Use the shared partial for all status indicators:

```blade
@include('backend.partials._status_badge', ['status' => $model->status])
```

Supported statuses and their colors:
- `pending` → warning (yellow)
- `confirmed`, `picked_up` → info (blue)
- `on_the_way` → primary
- `delivered`, `paid`, `active`, `approved`, `verified`, `published` → success (green)
- `cancelled`, `unpaid`, `rejected`, `expired` → danger (red)
- `inactive`, `draft` → secondary (gray)
- `unverified`, `un_verified` → warning

## 4. Empty States

Every table must include an empty state after `@endforeach`:

```blade
@if($collection->isEmpty())
    @include('backend.partials._empty_state', [
        'message' => 'No items found.',
        'icon'    => 'la-box',
    ])
@endif
```

## 5. Action Buttons

| Context | Class | Example |
|---|---|---|
| Primary action (Add New) | `btn btn-primary` | `<a class="btn btn-primary"><i class="las la-plus mr-1"></i>Add New</a>` |
| Danger action (Delete) | `btn btn-soft-danger btn-icon btn-circle btn-sm` | Delete icon button |
| Edit action | `btn btn-soft-primary btn-icon btn-circle btn-sm` | Edit icon button |
| Bulk action | `btn border dropdown-toggle` | Dropdown trigger |

## 6. Forms & Labels

- Every `<label>` must have a `for="inputId"` attribute.
- Every `<input>`, `<select>`, `<textarea>` must have a matching `id` attribute.
- Required fields show `<span class="text-danger">*</span>` inside the label.
- Validation errors use Laravel's `@error('field')` directive with `invalid-feedback` class.

## 7. Tables

- Use `aiz-table` class on all tables.
- Use `data-breakpoints="lg"` for columns that should hide on smaller screens.
- Use Bootstrap `d-none d-{breakpoint}-table-cell` for responsive column visibility (not custom `hide-*` classes).
- Column headers should be concise: "Price" not "Price Details", "Stock" not "Info".
- Sortable columns get `data-sortable` attribute.

## 8. Navigation & Breadcrumbs

- Sidebar items with identical names must be disambiguated with a prefix (e.g., "Seller: All Products", "GST: Wholesale Products").
- Breadcrumbs appear on every page via `@section('breadcrumb')`.
- Breadcrumb items: `['label' => 'Name', 'url' => route('...')]` — last item has no URL.

## 9. Confirmations & Feedback

- Destructive or state-changing actions (delete, status change) require confirmation via SweetAlert (`Swal.fire`) with `confirm()` fallback.
- Flash messages use `AIZ.plugins.notify()` — never compare translated flash text strings.
- Use `session()->flash('flash_type', 'action_name')` for programmatic flash detection.
- All forms have double-submit protection (handled globally in `app.blade.php`).

## 10. Accessibility

- Sidebar search has `aria-label`.
- Sidebar toggle has `aria-label`, `aria-expanded`, `aria-controls`.
- Interactive elements (buttons, links) must have descriptive text or `aria-label`.
- Color-coded indicators must also have text labels (don't rely on color alone).
- Use semantic HTML: `nav`, `main`, `header`, `footer` where appropriate.

## 11. Responsive Design

- Filter bars use `flex-wrap` and responsive column classes (`col-md-3 col-lg-2`).
- Date filter inputs get at least `col-md-3 col-lg-2` width.
- Use Bootstrap responsive utilities (`d-none d-md-*`) instead of custom visibility classes.

## 12. CSS Guidelines

- All shared styles live in `public/assets/css/admin-utilities.css`.
- Page-specific styles live in `public/assets/css/admin-redesign.css`.
- No inline `style=` attributes — use utility classes or the CSS files above.
- CSS custom properties (`var(--primary)`, `var(--secondary)`) preferred over hard-coded colors.
