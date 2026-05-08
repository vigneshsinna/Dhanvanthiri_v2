<?php

/**
 * User Info Debug
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
$user = User::where('email', $email)->first();

echo "--- USER DEBUG: $email ---\n\n";

if (!$user) {
    echo "User not found.\n";
    exit;
}

echo "ID: " . $user->id . "\n";
echo "Name: " . $user->name . "\n";
echo "Avatar (RAW): " . ($user->avatar ?? 'NULL') . "\n";
echo "Avatar Original (RAW): " . ($user->avatar_original ?? 'NULL') . "\n";

// Check if avatar is a number (ID from uploads table) or a string
if (is_numeric($user->avatar)) {
    $upload = \App\Models\Upload::find($user->avatar);
    if ($upload) {
        echo "Avatar Upload found: " . $upload->file_name . "." . $upload->extension . "\n";
        echo "Full Path: " . asset($upload->file_name) . "\n";
    } else {
        echo "Avatar ID set but upload record missing.\n";
    }
}

echo "\n--- SYSTEM URLS ---\n";
echo "APP_URL: " . env('APP_URL') . "\n";
echo "ASSET_URL: " . env('ASSET_URL') . "\n";
echo "Base Asset Path: " . asset('') . "\n";

echo "\n--- UPLOAD PATHS ---\n";
$uploadPath = public_path('uploads/all');
echo "Uploads Path: " . $uploadPath . "\n";
echo "Uploads Dir Exists: " . (is_dir($uploadPath) ? 'YES' : 'NO') . "\n";

echo "\n--- DEBUG COMPLETE ---\n";
