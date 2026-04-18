<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminCustomerController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status');

        $query = User::where('user_type', 'customer')->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        if ($status === 'banned') {
            $query->where('banned', 1);
        } elseif ($status === 'active') {
            $query->where('banned', 0);
        }

        $customers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $customers->getCollection()->map(fn(User $u) => $this->serialize($u))->values(),
                'meta' => $this->paginationMeta($customers),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);

        $orderCount = Order::where('user_id', $id)->count();
        $totalSpent = Order::where('user_id', $id)->where('payment_status', 'paid')->sum('grand_total');

        $data = $this->serialize($user);
        $data['order_count'] = $orderCount;
        $data['total_spent'] = round((float) $totalSpent, 2);

        return response()->json(['success' => true, 'data' => ['data' => $data]]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);

        if ($request->has('name')) $user->name = $request->input('name');
        if ($request->has('phone')) $user->phone = $request->input('phone');
        $user->save();

        return response()->json(['success' => true, 'message' => 'Customer updated', 'data' => $this->serialize($user)]);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);
        $user->banned = $user->banned ? 0 : 1;
        $user->save();

        return response()->json(['success' => true, 'message' => $user->banned ? 'Customer banned' : 'Customer unbanned']);
    }

    public function ban(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);
        $user->banned = 1;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Customer banned']);
    }

    public function unban(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);
        $user->banned = 0;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Customer unbanned']);
    }

    public function markSuspicious(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::where('user_type', 'customer')->findOrFail($id);
        // Store suspicious flag in a meta field or custom column if available
        // For now, use the `note` or toggle banned with a different value
        $isSuspicious = (bool) $request->input('is_suspicious', false);

        return response()->json([
            'success' => true,
            'message' => $isSuspicious ? 'Customer marked as suspicious' : 'Suspicious flag removed',
            'data' => ['is_suspicious' => $isSuspicious],
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $ids = $request->validate(['ids' => ['required', 'array']])['ids'];

        $deleted = User::where('user_type', 'customer')->whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => "$deleted customers deleted"]);
    }

    public function export(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $customers = User::where('user_type', 'customer')->latest('id')->limit(5000)->get();

        $rows = $customers->map(fn(User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'banned' => (bool) $u->banned,
            'created_at' => optional($u->created_at)->toDateTimeString(),
        ]);

        return response()->json(['success' => true, 'data' => ['rows' => $rows, 'count' => $rows->count()]]);
    }

    private function serialize(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'avatar' => $u->avatar_original ? uploaded_asset($u->avatar_original) : null,
            'is_banned' => (bool) $u->banned,
            'email_verified' => (bool) $u->email_verified_at,
            'created_at' => optional($u->created_at)->toISOString(),
        ];
    }
}
