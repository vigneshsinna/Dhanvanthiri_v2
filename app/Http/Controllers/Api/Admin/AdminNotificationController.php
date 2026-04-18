<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminNotificationController extends Controller
{
    use AdminAuth;

    // ── Notifications ──

    public function notificationsIndex(Request $request): JsonResponse
    {
        $user = $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $notifications = $user->notifications()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $notifications->getCollection()->map(fn($n) => [
                    'id' => $n->id,
                    'type' => class_basename($n->type),
                    'data' => $n->data,
                    'read_at' => $n->read_at?->toISOString(),
                    'created_at' => $n->created_at->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($notifications),
                'unread_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $this->ensureAdmin($request);
        $user->unreadNotifications->markAsRead();

        return response()->json(['success' => true, 'message' => 'All notifications marked as read']);
    }

    // ── Activity Logs ──

    public function activityLogs(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);

        $hasTable = \Schema::hasTable('activity_log');
        if (!$hasTable) {
            return response()->json([
                'success' => true,
                'data' => ['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'total' => 0]],
            ]);
        }

        $logs = DB::table('activity_log')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => collect($logs->items())->map(fn($l) => [
                    'id' => $l->id,
                    'description' => $l->description ?? '',
                    'subject_type' => $l->subject_type ?? '',
                    'subject_id' => $l->subject_id ?? null,
                    'causer_type' => $l->causer_type ?? '',
                    'causer_id' => $l->causer_id ?? null,
                    'properties' => json_decode($l->properties ?? '{}'),
                    'created_at' => $l->created_at ?? null,
                ])->values(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }

    // ── Admin Users ──

    public function adminsIndex(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $admins = User::whereIn('user_type', ['admin', 'staff'])
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $admins->map(fn(User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'user_type' => $u->user_type,
                    'roles' => $u->getRoleNames()->toArray(),
                    'created_at' => optional($u->created_at)->toISOString(),
                ])->values(),
            ],
        ]);
    }

    public function adminsStore(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'string'],
        ]);

        $admin = new User();
        $admin->name = $payload['name'];
        $admin->email = $payload['email'];
        $admin->password = Hash::make($payload['password']);
        $admin->user_type = 'staff';
        $admin->email_verified_at = now();
        $admin->save();

        if (!empty($payload['role'])) {
            $admin->assignRole($payload['role']);
        }

        return response()->json(['success' => true, 'message' => 'Admin user created', 'data' => ['id' => $admin->id]]);
    }

    public function adminsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $admin = User::whereIn('user_type', ['admin', 'staff'])->findOrFail($id);

        if ($admin->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Cannot delete your own account'], 403);
        }

        $admin->delete();

        return response()->json(['success' => true, 'message' => 'Admin user deleted']);
    }
}
