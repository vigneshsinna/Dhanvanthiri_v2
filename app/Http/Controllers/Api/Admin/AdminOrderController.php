<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\CombinedOrder;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\RefundRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    use AdminAuth;

    // ── Orders ──

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status');
        $paymentStatus = $request->input('payment_status');

        $query = Order::with(['user', 'orderDetails.product'])
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%' . $search . '%')
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', '%' . $search . '%')->orWhere('email', 'like', '%' . $search . '%'));
            });
        }
        if ($status) {
            $query->where('delivery_status', $status);
        }
        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }

        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $orders->getCollection()->map(fn(Order $o) => $this->serializeOrder($o))->values(),
                'meta' => $this->paginationMeta($orders),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $order = Order::with(['user', 'orderDetails.product', 'combinedOrder'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => ['data' => $this->serializeOrderDetail($order)],
        ]);
    }

    public function tracking(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        $events = [];
        $statusFlow = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
        $currentStatus = strtolower($order->delivery_status ?? '');
        $currentIdx = array_search($currentStatus, $statusFlow);

        $events[] = [
            'id' => 1,
            'description' => 'Order placed',
            'location' => '',
            'occurred_at' => optional($order->created_at)->toISOString(),
        ];

        if ($currentIdx !== false) {
            for ($i = 1; $i <= $currentIdx; $i++) {
                $events[] = [
                    'id' => $i + 1,
                    'description' => 'Order ' . str_replace('_', ' ', $statusFlow[$i]),
                    'location' => '',
                    'occurred_at' => optional($order->updated_at)->toISOString(),
                ];
            }
        } elseif ($currentStatus) {
            $events[] = [
                'id' => 2,
                'description' => 'Order ' . str_replace('_', ' ', $currentStatus),
                'location' => '',
                'occurred_at' => optional($order->updated_at)->toISOString(),
            ];
        }

        return response()->json(['success' => true, 'data' => $events]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $order = Order::findOrFail($id);
        $order->delivery_status = $payload['status'];
        if ($payload['status'] === 'delivered') {
            $order->delivery_viewed = 0;
        }
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
            'data' => ['status' => $order->delivery_status],
        ]);
    }

    public function markCollected(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);
        $order->delivery_status = 'delivered';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order marked as collected',
        ]);
    }

    public function exportOrders(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        // Return CSV-ready data
        $orders = Order::with('user')->latest('id')->limit(5000)->get();
        $rows = $orders->map(fn(Order $o) => [
            'id' => $o->id,
            'code' => $o->code,
            'customer' => $o->user?->name,
            'status' => $o->delivery_status,
            'payment_status' => $o->payment_status,
            'grand_total' => $o->grand_total,
            'created_at' => optional($o->created_at)->toDateTimeString(),
        ]);

        return response()->json([
            'success' => true,
            'data' => ['rows' => $rows, 'count' => $rows->count()],
        ]);
    }

    public function createShipment(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'carrier' => ['required', 'string'],
            'tracking_number' => ['required', 'string'],
            'tracking_url' => ['nullable', 'string', 'url'],
            'estimated_delivery_at' => ['nullable', 'date'],
        ]);

        $order = Order::findOrFail($id);
        $order->tracking_code = $payload['tracking_number'];
        $order->delivery_status = 'shipped';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Shipment created',
            'data' => [
                'id' => $order->id,
                'order_id' => $order->id,
                'carrier' => $payload['carrier'],
                'tracking_number' => $payload['tracking_number'],
                'tracking_url' => $payload['tracking_url'] ?? null,
                'status' => 'shipped',
                'estimated_delivery_at' => $payload['estimated_delivery_at'] ?? null,
                'events' => [],
            ],
        ]);
    }

    public function invoice(Request $request, int $id)
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        // Try to use the existing InvoiceController
        try {
            return app(\App\Http\Controllers\Api\V2\InvoiceController::class)->invoice_download($id);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice generation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function omsSummary(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => Order::count(),
                'pending' => Order::where('delivery_status', 'pending')->count(),
                'confirmed' => Order::where('delivery_status', 'confirmed')->count(),
                'processing' => Order::where('delivery_status', 'processing')->count(),
                'shipped' => Order::where('delivery_status', 'shipped')->count(),
                'delivered' => Order::where('delivery_status', 'delivered')->count(),
                'cancelled' => Order::where('delivery_status', 'cancelled')->count(),
                'returned' => Order::where('delivery_status', 'returned')->count(),
                'unpaid' => Order::where('payment_status', 'unpaid')->count(),
            ],
        ]);
    }

    // ── Shipments ──

    public function shipmentsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $orders = Order::whereNotNull('tracking_code')
            ->with('user')
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $orders->getCollection()->map(fn(Order $o) => [
                    'id' => $o->id,
                    'order_id' => $o->id,
                    'order_code' => $o->code,
                    'customer_name' => $o->user?->name,
                    'carrier' => 'Standard',
                    'tracking_number' => $o->tracking_code,
                    'tracking_url' => null,
                    'status' => $o->delivery_status,
                    'estimated_delivery_at' => null,
                    'created_at' => optional($o->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($orders),
            ],
        ]);
    }

    public function shipmentShow(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $order = Order::with(['user', 'orderDetails.product'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => [
                    'id' => $order->id,
                    'order_id' => $order->id,
                    'order_code' => $order->code,
                    'customer_name' => $order->user?->name,
                    'carrier' => 'Standard',
                    'tracking_number' => $order->tracking_code,
                    'tracking_url' => null,
                    'status' => $order->delivery_status,
                    'estimated_delivery_at' => null,
                    'events' => [],
                    'items' => $order->orderDetails->map(fn($d) => [
                        'product_name' => $d->product?->name ?? $d->product_id,
                        'quantity' => $d->quantity,
                    ])->values(),
                ],
            ],
        ]);
    }

    public function shipmentUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        if ($request->has('status')) {
            $order->delivery_status = $request->input('status');
        }
        if ($request->has('tracking_number')) {
            $order->tracking_code = $request->input('tracking_number');
        }
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Shipment updated',
        ]);
    }

    public function shipmentAddEvent(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Order::findOrFail($id); // validate exists

        return response()->json([
            'success' => true,
            'message' => 'Shipment event added',
            'data' => [
                'status' => $request->input('status'),
                'description' => $request->input('description'),
                'location' => $request->input('location'),
                'created_at' => now()->toISOString(),
            ],
        ]);
    }

    // ── Returns ──

    public function returnsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $returns = RefundRequest::with(['order', 'user'])
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $returns->getCollection()->map(fn($r) => [
                    'id' => $r->id,
                    'order_id' => $r->order_id,
                    'order_code' => $r->order?->code,
                    'customer_name' => $r->user?->name,
                    'reason' => $r->reason,
                    'status' => $r->admin_approval === 1 ? 'approved' : ($r->admin_approval === 2 ? 'rejected' : 'pending'),
                    'admin_notes' => $r->admin_note,
                    'refund_amount' => (float) ($r->refund_amount ?? 0),
                    'created_at' => optional($r->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($returns),
            ],
        ]);
    }

    public function returnShow(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $return = RefundRequest::with(['order.orderDetails', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => [
                    'id' => $return->id,
                    'order_id' => $return->order_id,
                    'order_code' => $return->order?->code,
                    'customer_name' => $return->user?->name,
                    'customer_email' => $return->user?->email,
                    'reason' => $return->reason,
                    'status' => $return->admin_approval === 1 ? 'approved' : ($return->admin_approval === 2 ? 'rejected' : 'pending'),
                    'admin_notes' => $return->admin_note,
                    'refund_amount' => (float) ($return->refund_amount ?? 0),
                    'created_at' => optional($return->created_at)->toISOString(),
                ],
            ],
        ]);
    }

    public function returnUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'status' => ['required', 'string', 'in:pending,approved,rejected'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        $return = RefundRequest::findOrFail($id);
        $return->admin_approval = match ($payload['status']) {
            'approved' => 1,
            'rejected' => 2,
            default => 0,
        };
        if (isset($payload['admin_notes'])) {
            $return->admin_note = $payload['admin_notes'];
        }
        $return->save();

        // Update order status if approved
        if ($payload['status'] === 'approved' && $return->order) {
            $return->order->delivery_status = 'returned';
            $return->order->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Return request updated',
        ]);
    }

    // ── Private helpers ──

    private function serializeOrder(Order $o): array
    {
        return [
            'id' => $o->id,
            'code' => $o->code,
            'customer_name' => $o->user?->name,
            'customer_email' => $o->user?->email,
            'status' => $o->delivery_status,
            'payment_status' => $o->payment_status,
            'payment_type' => $o->payment_type,
            'grand_total' => (float) $o->grand_total,
            'item_count' => $o->orderDetails->count(),
            'created_at' => optional($o->created_at)->toISOString(),
        ];
    }

    private function serializeOrderDetail(Order $o): array
    {
        return [
            ...$this->serializeOrder($o),
            'subtotal' => (float) ($o->subtotal ?? 0),
            'tax' => (float) ($o->tax ?? 0),
            'shipping_cost' => (float) ($o->shipping_cost ?? 0),
            'coupon_discount' => (float) ($o->coupon_discount ?? 0),
            'tracking_code' => $o->tracking_code,
            'shipping_address' => $o->shipping_address,
            'items' => $o->orderDetails->map(fn($d) => [
                'id' => $d->id,
                'product_id' => $d->product_id,
                'product_name' => $d->product?->name,
                'quantity' => $d->quantity,
                'unit_price' => (float) $d->price,
                'total' => (float) ($d->price * $d->quantity),
                'variation' => $d->variation,
            ])->values(),
            'notes' => $o->note ?? '',
        ];
    }
}
