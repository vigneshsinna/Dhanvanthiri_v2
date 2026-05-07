<?php

/**
 * Debug User script for Dhanvanthiri Foods
 * This script checks the user record for a specific email to understand why they have admin roles.
 */

use Illuminate\Support\Facades\DB;
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

$email = 'nanoroboticsai@gmail.com';

echo "Checking user: $email\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found in the database.\n";
    exit;
}

echo "User ID: " . $user->id . "\n";
echo "Name: " . $user->name . "\n";
echo "Email: " . $user->email . "\n";
echo "User Type: " . $user->user_type . "\n";
echo "Email Verified At: " . ($user->email_verified_at ? $user->email_verified_at->toDateTimeString() : 'NULL') . "\n";

if (method_exists($user, 'getRoleNames')) {
    echo "Spatie Roles: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";
}

echo "\n------------------------------------------\n";
echo "Calculated role for Frontend API (v2/auth/user):\n";

$role = $user->hasRole('Super Admin')
    ? 'super_admin'
    : (in_array($user->user_type, ['admin', 'staff']) ? 'admin' : 'customer');

echo "Calculated Role: " . $role . "\n";
echo "------------------------------------------\n";

if ($role === 'admin' || $role === 'super_admin') {
    echo "\nWARNING: This user is still recognized as an ADMIN by the backend.\n";
    echo "This is why the frontend displays 'Admin' links.\n";
    echo "To fix this, you need to update the user_type in the database to 'customer'.\n";
} else {
    echo "\nThis user is a CUSTOMER.\n";
}
