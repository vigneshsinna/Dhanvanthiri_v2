<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Color;
use App\Models\SizeChart;
use App\Models\SizeChartDetail;
use App\Models\Warranty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCatalogController extends Controller
{
    use AdminAuth;

    // ── Categories ──

    public function categoriesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $categories = Category::orderBy('order_level')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $categories->map(fn(Category $c) => [
                    'id' => $c->id,
                    'name' => $c->getTranslation('name'),
                    'slug' => $c->slug,
                    'parent_id' => $c->parent_id,
                    'order_level' => $c->order_level,
                    'icon' => $c->icon,
                    'banner' => uploaded_asset($c->banner),
                    'featured' => (bool) $c->featured,
                    'product_count' => $c->products()->count(),
                ])->values(),
            ],
        ]);
    }

    public function categoriesStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer'],
            'slug' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
            'featured' => ['nullable', 'boolean'],
        ]);

        $category = new Category();
        $category->name = $payload['name'];
        $category->slug = Str::slug($payload['slug'] ?? $payload['name']);
        $category->parent_id = $payload['parent_id'] ?? 0;
        $category->icon = $payload['icon'] ?? null;
        $category->featured = $payload['featured'] ?? false;
        $category->order_level = Category::max('order_level') + 1;
        $category->save();

        return response()->json(['success' => true, 'message' => 'Category created', 'data' => ['id' => $category->id, 'name' => $category->name]]);
    }

    public function categoriesUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $category = Category::findOrFail($id);

        if ($request->has('name')) $category->name = $request->input('name');
        if ($request->has('slug')) $category->slug = Str::slug($request->input('slug'));
        if ($request->has('parent_id')) $category->parent_id = $request->input('parent_id');
        if ($request->has('icon')) $category->icon = $request->input('icon');
        if ($request->has('featured')) $category->featured = $request->boolean('featured');
        $category->save();

        return response()->json(['success' => true, 'message' => 'Category updated']);
    }

    public function categoriesDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Category::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }

    // ── Brands ──

    public function brandsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $brands = Brand::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $brands->map(fn(Brand $b) => [
                    'id' => $b->id,
                    'name' => $b->getTranslation('name'),
                    'slug' => $b->slug,
                    'logo' => uploaded_asset($b->logo),
                    'top' => (bool) $b->top,
                ])->values(),
            ],
        ]);
    }

    public function brandsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $brand = new Brand();
        $brand->name = $payload['name'];
        $brand->slug = Str::slug($payload['slug'] ?? $payload['name']);
        $brand->save();

        return response()->json(['success' => true, 'message' => 'Brand created', 'data' => ['id' => $brand->id, 'name' => $brand->name]]);
    }

    public function brandsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $brand = Brand::findOrFail($id);
        if ($request->has('name')) $brand->name = $request->input('name');
        if ($request->has('slug')) $brand->slug = Str::slug($request->input('slug'));
        $brand->save();

        return response()->json(['success' => true, 'message' => 'Brand updated']);
    }

    public function brandsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Brand::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Brand deleted']);
    }

    // ── Attributes ──

    public function attributesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $attributes = Attribute::with('attribute_values')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $attributes->map(fn(Attribute $a) => [
                    'id' => $a->id,
                    'name' => $a->getTranslation('name'),
                    'values' => $a->attribute_values->map(fn($v) => ['id' => $v->id, 'value' => $v->value])->values(),
                ])->values(),
            ],
        ]);
    }

    public function attributesStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'values' => ['nullable', 'array'],
            'values.*' => ['string'],
        ]);

        $attr = new Attribute();
        $attr->name = $payload['name'];
        $attr->save();

        foreach ($payload['values'] ?? [] as $val) {
            $attr->attribute_values()->create(['value' => $val]);
        }

        return response()->json(['success' => true, 'message' => 'Attribute created', 'data' => ['id' => $attr->id]]);
    }

    public function attributesUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $attr = Attribute::findOrFail($id);
        if ($request->has('name')) $attr->name = $request->input('name');
        $attr->save();

        if ($request->has('values')) {
            $attr->attribute_values()->delete();
            foreach ($request->input('values', []) as $val) {
                $attr->attribute_values()->create(['value' => $val]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Attribute updated']);
    }

    public function attributesDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $attr = Attribute::findOrFail($id);
        $attr->attribute_values()->delete();
        $attr->delete();

        return response()->json(['success' => true, 'message' => 'Attribute deleted']);
    }

    // ── Colors ──

    public function colorsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $colors = Color::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $colors->map(fn(Color $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                ])->values(),
            ],
        ]);
    }

    public function colorsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20'],
        ]);

        $color = Color::create($payload);

        return response()->json(['success' => true, 'message' => 'Color created', 'data' => ['id' => $color->id]]);
    }

    public function colorsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $color = Color::findOrFail($id);
        if ($request->has('name')) $color->name = $request->input('name');
        if ($request->has('code')) $color->code = $request->input('code');
        $color->save();

        return response()->json(['success' => true, 'message' => 'Color updated']);
    }

    public function colorsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Color::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Color deleted']);
    }

    // ── Size Charts ──

    public function sizeChartsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $charts = SizeChart::with('size_chart_details')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $charts->map(fn(SizeChart $sc) => [
                    'id' => $sc->id,
                    'name' => $sc->name,
                    'details' => $sc->size_chart_details->map(fn($d) => [
                        'id' => $d->id,
                        'size' => $d->size ?? '',
                        'measurements' => $d->measurements ?? '',
                    ])->values(),
                ])->values(),
            ],
        ]);
    }

    public function sizeChartsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $chart = SizeChart::create($payload);

        return response()->json(['success' => true, 'message' => 'Size chart created', 'data' => ['id' => $chart->id]]);
    }

    public function sizeChartsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $chart = SizeChart::findOrFail($id);
        if ($request->has('name')) $chart->name = $request->input('name');
        $chart->save();

        return response()->json(['success' => true, 'message' => 'Size chart updated']);
    }

    public function sizeChartsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $chart = SizeChart::findOrFail($id);
        $chart->size_chart_details()->delete();
        $chart->delete();

        return response()->json(['success' => true, 'message' => 'Size chart deleted']);
    }

    // ── Warranties ──

    public function warrantiesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $warranties = Warranty::orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $warranties->map(fn(Warranty $w) => [
                    'id' => $w->id,
                    'name' => $w->getTranslation('name') ?? $w->name,
                    'duration' => $w->duration ?? null,
                    'description' => $w->description ?? null,
                ])->values(),
            ],
        ]);
    }

    public function warrantiesStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $warranty = new Warranty();
        $warranty->name = $payload['name'];
        if (isset($payload['duration'])) $warranty->duration = $payload['duration'];
        if (isset($payload['description'])) $warranty->description = $payload['description'];
        $warranty->save();

        return response()->json(['success' => true, 'message' => 'Warranty created', 'data' => ['id' => $warranty->id]]);
    }

    public function warrantiesUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $warranty = Warranty::findOrFail($id);
        if ($request->has('name')) $warranty->name = $request->input('name');
        if ($request->has('duration')) $warranty->duration = $request->input('duration');
        if ($request->has('description')) $warranty->description = $request->input('description');
        $warranty->save();

        return response()->json(['success' => true, 'message' => 'Warranty updated']);
    }

    public function warrantiesDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Warranty::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Warranty deleted']);
    }

    // ── Product Q&A ──

    public function productQueriesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $queries = \App\Models\ProductQuery::with(['product', 'user'])
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $queries->getCollection()->map(fn($q) => [
                    'id' => $q->id,
                    'product_id' => $q->product_id,
                    'product_name' => $q->product?->name,
                    'customer_name' => $q->user?->name ?? 'Guest',
                    'question' => $q->question,
                    'answer' => $q->reply,
                    'status' => $q->reply ? 'answered' : 'pending',
                    'created_at' => optional($q->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($queries),
            ],
        ]);
    }

    public function productQueryAnswer(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate(['answer' => ['required', 'string']]);

        $query = \App\Models\ProductQuery::findOrFail($id);
        $query->reply = $payload['answer'];
        $query->save();

        return response()->json(['success' => true, 'message' => 'Answer submitted']);
    }

    public function productQueryReject(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $query = \App\Models\ProductQuery::findOrFail($id);
        $query->reply = '[rejected]';
        $query->save();

        return response()->json(['success' => true, 'message' => 'Query rejected']);
    }

    public function productQueryDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        \App\Models\ProductQuery::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Query deleted']);
    }

    // ── Cross-Sells ──

    public function crossSells(Request $request, int $productId): JsonResponse
    {
        $this->ensureAdmin($request);
        $product = \App\Models\Product::findOrFail($productId);

        $related = \App\Models\FrequentlyBoughtProduct::where('product_id', $productId)
            ->with('frequentlyBoughtProduct')
            ->get();

        $items = $related->map(function ($r) {
            $p = $r->frequentlyBoughtProduct;
            return $p ? ['id' => $p->id, 'name' => $p->name, 'slug' => $p->slug] : null;
        })->filter()->values();

        return response()->json(['success' => true, 'data' => ['data' => $items]]);
    }

    public function crossSellsSync(Request $request, int $productId): JsonResponse
    {
        $this->ensureAdmin($request);
        $product = \App\Models\Product::findOrFail($productId);
        $relatedIds = $request->validate(['related_product_ids' => ['required', 'array']])['related_product_ids'];

        \App\Models\FrequentlyBoughtProduct::where('product_id', $productId)->delete();

        foreach ($relatedIds as $relatedId) {
            \App\Models\FrequentlyBoughtProduct::create([
                'product_id' => $productId,
                'frequently_bought_product_id' => $relatedId,
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Cross-sells updated']);
    }
}
