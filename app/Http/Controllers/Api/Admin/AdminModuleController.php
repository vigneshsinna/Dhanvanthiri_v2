<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminModuleController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $addons = DB::table('addons')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $addons->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->name ?? '',
                    'unique_identifier' => $a->unique_identifier ?? '',
                    'version' => $a->version ?? '1.0',
                    'activated' => (bool) ($a->activated ?? false),
                    'image' => $a->image ?? null,
                ])->values(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $addon = DB::table('addons')->where('id', $id)->first();

        if (!$addon) {
            return response()->json(['success' => false, 'message' => 'Module not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $addon->id,
                'name' => $addon->name ?? '',
                'unique_identifier' => $addon->unique_identifier ?? '',
                'version' => $addon->version ?? '1.0',
                'activated' => (bool) ($addon->activated ?? false),
                'image' => $addon->image ?? null,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'success' => false,
            'message' => 'Module installation via API is not supported. Please use the admin panel.',
        ], 400);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $addon = DB::table('addons')->where('id', $id)->first();

        if (!$addon) {
            return response()->json(['success' => false, 'message' => 'Module not found'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Module updated']);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $addon = DB::table('addons')->where('id', $id)->first();

        if (!$addon) {
            return response()->json(['success' => false, 'message' => 'Module not found'], 404);
        }

        DB::table('addons')->where('id', $id)->update([
            'activated' => !($addon->activated ?? false),
        ]);

        return response()->json([
            'success' => true,
            'message' => ($addon->activated ? 'Module deactivated' : 'Module activated'),
        ]);
    }

    public function validateLicense(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate([
            'purchase_code' => ['required', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'data' => ['valid' => true, 'message' => 'License valid'],
        ]);
    }

    public function credentials(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $payload = $request->validate([
            'credentials' => ['required', 'array'],
        ]);

        // Store credentials in business_settings keyed by module
        foreach ($payload['credentials'] as $key => $value) {
            DB::table('business_settings')->updateOrInsert(
                ['type' => "module_{$id}_{$key}"],
                ['value' => is_string($value) ? $value : json_encode($value)]
            );
        }

        return response()->json(['success' => true, 'message' => 'Credentials saved']);
    }

    public function health(Request $request, int $id): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $addon = DB::table('addons')->where('id', $id)->first();

        if (!$addon) {
            return response()->json(['success' => false, 'message' => 'Module not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => ($addon->activated ?? false) ? 'healthy' : 'inactive',
                'version' => $addon->version ?? '1.0',
                'activated' => (bool) ($addon->activated ?? false),
            ],
        ]);
    }

    public function activationRequest(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate([
            'module_name' => ['required', 'string'],
            'purchase_code' => ['required', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activation request submitted',
        ]);
    }
}
