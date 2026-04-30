<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    use AdminAuth;

    public function revenue(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $period = $request->input('period', 'month');
        $groupBy = $request->input('group_by', 'day');

        $from = match ($period) {
            'week' => now()->subWeek(),
            'year' => now()->subYear(),
            'quarter' => now()->subQuarter(),
            default => now()->subMonth(),
        };

        $dateFormat = match ($groupBy) {
            'month' => '%Y-%m',
            'week' => '%Y-%u',
            default => '%Y-%m-%d',
        };

        $data = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $from)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '$dateFormat') as period_label"),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('period_label')
            ->orderBy('period_label')
            ->get();

        $totalRevenue = $data->sum('revenue');
        $totalOrders = $data->sum('order_count');

        return response()->json([
            'success' => true,
            'data' => [
                'chart' => $data->map(fn($row) => [
                    'label' => $row->period_label,
                    'revenue' => round((float) $row->revenue, 2),
                    'order_count' => (int) $row->order_count,
                ])->values(),
                'summary' => [
                    'total_revenue' => round((float) $totalRevenue, 2),
                    'total_orders' => $totalOrders,
                    'average_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                ],
            ],
        ]);
    }

    public function exportAnalytics(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        // Return an export job ID (simulated since no queue system)
        return response()->json([
            'success' => true,
            'data' => [
                'export_id' => rand(1000, 9999),
                'status' => 'completed',
                'message' => 'Export ready',
            ],
        ]);
    }

    public function exportStatus(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'status' => 'completed',
                'download_url' => null,
                'created_at' => now()->toISOString(),
            ],
        ]);
    }

    public function stockReport(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $totalProducts = Product::where('added_by', 'admin')->where('published', 1)->count();
        $lowStock = Product::where('added_by', 'admin')
            ->where('published', 1)
            ->whereColumn('current_stock', '<=', DB::raw('COALESCE(low_stock_quantity, 5)'))
            ->count();
        $outOfStock = Product::where('added_by', 'admin')
            ->where('published', 1)
            ->where('current_stock', '<=', 0)
            ->count();

        $lowStockItems = Product::where('added_by', 'admin')
            ->where('published', 1)
            ->whereColumn('current_stock', '<=', DB::raw('COALESCE(low_stock_quantity, 5)'))
            ->select('id', 'name', 'current_stock', 'low_stock_quantity')
            ->limit(20)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'stock' => (int) $p->current_stock,
                'threshold' => (int) ($p->low_stock_quantity ?? 5),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_products' => $totalProducts,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
                'low_stock_items' => $lowStockItems,
            ],
        ]);
    }

    public function wishlistReport(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $topWishlisted = Wishlist::select('product_id', DB::raw('COUNT(*) as count'))
            ->groupBy('product_id')
            ->orderByDesc('count')
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $product = Product::find($row->product_id);
                return [
                    'product_id' => $row->product_id,
                    'product_name' => $product?->name ?? 'Unknown',
                    'wishlist_count' => (int) $row->count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_wishlisted_items' => Wishlist::count(),
                'unique_products' => Wishlist::distinct('product_id')->count('product_id'),
                'top_wishlisted' => $topWishlisted,
            ],
        ]);
    }

    public function categoryReport(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $categories = \App\Models\Category::withCount('products')
            ->orderByDesc('products_count')
            ->limit(20)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->getTranslation('name'),
                'product_count' => $c->products_count,
            ]);

        return response()->json([
            'success' => true,
            'data' => ['categories' => $categories],
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $orders = Order::whereNotNull('payment_type')
            ->where('payment_status', 'paid')
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $orders->getCollection()->map(fn(Order $o) => [
                    'id' => $o->id,
                    'order_code' => $o->code,
                    'payment_type' => $o->payment_type,
                    'amount' => (float) $o->grand_total,
                    'status' => $o->payment_status,
                    'customer_name' => $o->user?->name,
                    'created_at' => optional($o->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($orders),
            ],
        ]);
    }
}
