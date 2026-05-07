<?php

/**
 * Revoke Admin Sessions script for Dhanvanthiri Foods
 * This script deletes all Sanctum tokens for the Admin user (ID 1)
 * to resolve stale session issues on the frontend.
 */

use App\Models\User;

// Include Laravel bootstrap
$root = __DIR__;
if (file_exists($root . '/core/vendor/autoload.php')) {
    $root .= '/core';
}

require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$adminId = 1;

echo "Revoking sessions for User ID: $adminId (Admin)\n\n";

$user = User::find($adminId);

if (!$user) {
    echo "Admin user not found.\n";
    exit;
}

$tokenCount = $user->tokens()->count();
echo "Found $tokenCount active tokens.\n";

if ($tokenCount > 0) {
    $user->tokens()->delete();
    echo "SUCCESS: All admin tokens have been revoked.\n";
    echo "Any browser currently logged in as Admin will be forced to log out.\n";
} else {
    echo "No active tokens found for Admin.\n";
}
