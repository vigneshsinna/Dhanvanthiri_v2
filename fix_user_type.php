<?php

/**
 * Fix User Type script for Dhanvanthiri Foods
 * This script changes a user's type to 'customer' to resolve unwanted admin access.
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

$email = 'nanoroboticsai@gmail.com';

echo "Updating user: $email\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found.\n";
    exit;
}

echo "Current User Type: " . $user->user_type . "\n";

if ($user->user_type !== 'customer') {
    $user->user_type = 'customer';
    $user->save();
    echo "SUCCESS: User type has been changed to 'customer'.\n";
    echo "Please log out and log back in on the website to see the changes.\n";
} else {
    echo "User is already a customer. No changes needed.\n";
}
