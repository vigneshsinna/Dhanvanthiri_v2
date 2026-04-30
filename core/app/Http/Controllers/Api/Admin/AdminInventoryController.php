<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInventoryController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $search = trim((string) $request->input('search', ''));
        $lowStock = $request->boolean('low_stock');

        $query = Product::with('stocks')
            ->where('added_by', 'admin')
            ->where('published', 1)
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        if ($lowStock) {
            $query->whereColumn('current_stock', '<=', \DB::raw('COALESCE(low_stock_quantity, 5)'));
        }

        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $products->getCollection()->map(fn(Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'sku' => $p->stocks->first()?->sku,
                    'stock_quantity' => (int) $p->current_stock,
                    'low_stock_threshold' => (int) ($p->low_stock_quantity ?? 5),
                    'is_low_stock' => $p->current_stock <= ($p->low_stock_quantity ?? 5),
                    'price' => (float) $p->unit_price,
                ])->values(),
                'meta' => $this->paginationMeta($products),
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::with('stocks')->findOrFail($id);
        $product->current_stock = $payload['stock_quantity'];
        if (isset($payload['low_stock_threshold'])) {
            $product->low_stock_quantity = $payload['low_stock_threshold'];
        }
        $product->save();

        // Update primary stock record
        $stock = $product->stocks()->first();
        if ($stock) {
            $stock->qty = $payload['stock_quantity'];
            $stock->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock updated',
            'data' => [
                'stock_quantity' => (int) $product->current_stock,
                'low_stock_threshold' => (int) $product->low_stock_quantity,
            ],
        ]);
    }
}
