<?php

/**
 * Mega Debug script for Dhanvanthiri Foods
 * This script checks everything about the user and the environment.
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

echo "--- ENVIRONMENT INFO ---\n";
echo "Laravel Version: " . app()->version() . "\n";
echo "DB Connection: " . DB::connection()->getDatabaseName() . "\n";
echo "Table Prefix: " . DB::getTablePrefix() . "\n";

echo "\n--- SEARCHING FOR USER: $email ---\n";

// Search with exact case
$userExact = DB::table('users')->where('email', $email)->get();
echo "Found " . $userExact->count() . " records with exact email: $email\n";
foreach ($userExact as $u) {
    echo "ID: {$u->id}, Name: {$u->name}, Type: {$u->user_type}, Email: {$u->email}\n";
}

// Search with case-insensitive (just in case)
$userLower = DB::table('users')->whereRaw('LOWER(email) = ?', [strtolower($email)])->get();
if ($userLower->count() > $userExact->count()) {
    echo "Found " . ($userLower->count() - $userExact->count()) . " ADDITIONAL records with case-insensitive search!\n";
    foreach ($userLower as $u) {
        if (!$userExact->contains('id', $u->id)) {
            echo "ID: {$u->id}, Name: {$u->name}, Type: {$u->user_type}, Email: {$u->email}\n";
        }
    }
}

echo "\n--- CHECKING MODEL ATTRIBUTES ---\n";
$userModel = User::where('email', $email)->first();
if ($userModel) {
    echo "Model ID: " . $userModel->id . "\n";
    echo "Model Name attribute: " . $userModel->name . "\n";
    echo "Raw Name in database: " . $userModel->getAttributes()['name'] . "\n";
    
    if (method_exists($userModel, 'getNameAttribute')) {
        echo "WARNING: User model has a getNameAttribute() accessor!\n";
    }
} else {
    echo "No User model found for this email.\n";
}

echo "\n--- CHECKING ADMIN USERS ---\n";
$admins = DB::table('users')->whereIn('user_type', ['admin', 'staff', 'super_admin'])->get();
echo "Total Admin/Staff users: " . $admins->count() . "\n";
foreach ($admins as $a) {
    echo "ID: {$a->id}, Name: {$a->name}, Email: {$a->email}, Type: {$a->user_type}\n";
}

echo "\n--- CHECKING FOR HARDCODED VALUES IN CONFIG ---\n";
echo "APP_NAME: " . config('app.name') . "\n";
// Sometimes people hardcode things in auth config
echo "Auth Default Guard: " . config('auth.defaults.guard') . "\n";

echo "\n--- SUGGESTED ACTION ---\n";
if ($userModel && $userModel->user_type !== 'customer') {
    echo "RUN THIS SQL: UPDATE users SET user_type = 'customer', name = 'Your Name' WHERE email = '$email';\n";
} else if ($userModel && $userModel->name === 'Admin') {
    echo "The role is customer, but the name is still 'Admin'.\n";
    echo "RUN THIS SQL: UPDATE users SET name = 'Your Name' WHERE email = '$email';\n";
}
