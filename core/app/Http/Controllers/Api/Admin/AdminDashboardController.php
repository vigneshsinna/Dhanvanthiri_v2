<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\CombinedOrder;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    use AdminAuth;

    public function summary(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $period = $request->input('period', 'month');
        $from = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $orders = Order::where('created_at', '>=', $from);
        $totalOrders = (clone $orders)->count();
        $totalRevenue = (clone $orders)->where('payment_status', 'paid')->sum('grand_total');
        $pendingOrders = (clone $orders)->where('delivery_status', 'pending')->count();
        $completedOrders = (clone $orders)->where('delivery_status', 'delivered')->count();

        $newCustomers = User::where('user_type', 'customer')
            ->where('created_at', '>=', $from)->count();

        $lowStockProducts = Product::where('added_by', 'admin')
            ->whereColumn('current_stock', '<=', DB::raw('COALESCE(low_stock_quantity, 5)'))
            ->where('published', 1)
            ->count();

        $topProducts = Order::join('order_details', 'orders.id', '=', 'order_details.order_id')
            ->where('orders.created_at', '>=', $from)
            ->select('order_details.product_id', DB::raw('SUM(order_details.quantity) as total_sold'), DB::raw('SUM(order_details.price * order_details.quantity) as total_revenue'))
            ->groupBy('order_details.product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $product = Product::find($row->product_id);
                return [
                    'product_id' => $row->product_id,
                    'name' => $product?->name ?? 'Unknown',
                    'total_sold' => (int) $row->total_sold,
                    'total_revenue' => round((float) $row->total_revenue, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'total_orders' => $totalOrders,
                'total_revenue' => round((float) $totalRevenue, 2),
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'new_customers' => $newCustomers,
                'low_stock_products' => $lowStockProducts,
                'top_products' => $topProducts,
            ],
        ]);
    }
}
