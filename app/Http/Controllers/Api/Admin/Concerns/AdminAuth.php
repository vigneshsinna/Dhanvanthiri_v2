<?php

namespace App\Http\Controllers\Api\Admin\Concerns;

use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;

trait AdminAuth
{
    protected function ensureAdmin(Request $request): User
    {
        $user = $request->user();
        if (!$user) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401));
        }

        if (!in_array($user->user_type, ['admin', 'staff', 'super_admin'], true)) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403));
        }

        return $user;
    }

    protected function ensureSuperAdmin(Request $request): User
    {
        $user = $this->ensureAdmin($request);
        if ($user->user_type !== 'super_admin' && !$user->hasRole('Super Admin')) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403));
        }

        return $user;
    }

    protected function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected function clampPerPage(Request $request, int $default = 15): int
    {
        return max(1, min((int) $request->input('per_page', $default), 100));
    }
}
