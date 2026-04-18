<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$kernel->handle($request = \Illuminate\Http\Request::capture());

// Fix permissions table schema
$cols = DB::select('SHOW COLUMNS FROM permissions');
$colNames = array_map(fn($c) => $c->Field, $cols);
echo "Permissions columns: " . implode(', ', $colNames) . "\n";

if (!in_array('guard_name', $colNames)) {
    DB::statement("ALTER TABLE permissions ADD COLUMN guard_name VARCHAR(255) NOT NULL DEFAULT 'web' AFTER name");
    echo "Added guard_name column\n";
}
if (!in_array('created_at', $colNames)) {
    DB::statement("ALTER TABLE permissions ADD COLUMN created_at TIMESTAMP NULL");
    echo "Added created_at column\n";
}
if (!in_array('updated_at', $colNames)) {
    DB::statement("ALTER TABLE permissions ADD COLUMN updated_at TIMESTAMP NULL");
    echo "Added updated_at column\n";
}

$user = \App\Models\User::where('user_type', 'admin')->first();
echo "User: {$user->name} (id={$user->id})\n";

// Scan all @can directives from views to get needed permissions
$files = [
    __DIR__ . '/../resources/views/backend/inc/admin_sidenav.blade.php',
    __DIR__ . '/../resources/views/backend/dashboard.blade.php',
    __DIR__ . '/../resources/views/backend/inc/admin_nav.blade.php',
];

$allPerms = [];
foreach ($files as $f) {
    if (file_exists($f)) {
        $c = file_get_contents($f);
        preg_match_all("/@can\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/", $c, $m);
        $allPerms = array_merge($allPerms, $m[1]);
    }
}

$allPerms = array_unique($allPerms);
sort($allPerms);
echo "Found " . count($allPerms) . " permissions: " . implode(', ', $allPerms) . "\n";

foreach ($allPerms as $permName) {
    $exists = DB::table('permissions')->where('name', $permName)->first();
    if (!$exists) {
        DB::table('permissions')->insert([
            'name' => $permName,
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $perm = DB::table('permissions')->where('name', $permName)->first();

    $hasIt = DB::table('model_has_permissions')
        ->where('permission_id', $perm->id)
        ->where('model_type', 'App\\Models\\User')
        ->where('model_id', $user->id)
        ->first();

    if (!$hasIt) {
        DB::table('model_has_permissions')->insert([
            'permission_id' => $perm->id,
            'model_type' => 'App\\Models\\User',
            'model_id' => $user->id,
        ]);
    }
}

echo "Admin now has " . DB::table('model_has_permissions')->where('model_id', $user->id)->count() . " permissions.\n";

app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
echo "Permission cache cleared.\n";
