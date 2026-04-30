<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AdminSystemController extends Controller
{
    use AdminAuth;

    public function info(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'os' => PHP_OS,
                'db_driver' => config('database.default'),
                'timezone' => config('app.timezone'),
                'locale' => config('app.locale'),
                'debug_mode' => config('app.debug'),
                'env' => config('app.env'),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
            ],
        ]);
    }

    public function health(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $checks = [];

        // DB connectivity
        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Storage writable
        $storagePath = storage_path('app');
        $checks['storage'] = [
            'status' => is_writable($storagePath) ? 'ok' : 'error',
            'message' => is_writable($storagePath) ? 'Writable' : 'Not writable',
        ];

        // Cache writable
        $cachePath = storage_path('framework/cache');
        $checks['cache'] = [
            'status' => is_writable($cachePath) ? 'ok' : 'error',
            'message' => is_writable($cachePath) ? 'Writable' : 'Not writable',
        ];

        $allOk = collect($checks)->every(fn($c) => $c['status'] === 'ok');

        return response()->json([
            'success' => true,
            'data' => [
                'overall' => $allOk ? 'healthy' : 'degraded',
                'checks' => $checks,
            ],
        ]);
    }

    public function dbStats(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $tables = DB::select('SHOW TABLE STATUS');

        $totalRows = 0;
        $totalSize = 0;
        $tableStats = [];

        foreach ($tables as $table) {
            $rows = (int) ($table->Rows ?? 0);
            $size = (int) ($table->Data_length ?? 0) + (int) ($table->Index_length ?? 0);
            $totalRows += $rows;
            $totalSize += $size;

            $tableStats[] = [
                'name' => $table->Name,
                'rows' => $rows,
                'size_bytes' => $size,
            ];
        }

        // Sort by size descending, top 20
        usort($tableStats, fn($a, $b) => $b['size_bytes'] <=> $a['size_bytes']);

        return response()->json([
            'success' => true,
            'data' => [
                'total_tables' => count($tables),
                'total_rows' => $totalRows,
                'total_size_bytes' => $totalSize,
                'top_tables' => array_slice($tableStats, 0, 20),
            ],
        ]);
    }

    public function clearCache(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        return response()->json(['success' => true, 'message' => 'All caches cleared']);
    }

    public function maintenance(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $payload = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        if ($payload['enabled']) {
            Artisan::call('down', ['--secret' => 'admin-bypass-' . time()]);
        } else {
            Artisan::call('up');
        }

        return response()->json([
            'success' => true,
            'message' => $payload['enabled'] ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        ]);
    }
}
