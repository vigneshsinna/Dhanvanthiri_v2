<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSettingsController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        // Business settings are stored in the business_settings table
        $settings = DB::table('business_settings')->pluck('value', 'type');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $payload = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($payload['settings'] as $key => $value) {
            DB::table('business_settings')->updateOrInsert(
                ['type' => $key],
                ['value' => is_array($value) ? json_encode($value) : (string) $value]
            );
        }

        return response()->json(['success' => true, 'message' => 'Settings updated']);
    }
}
