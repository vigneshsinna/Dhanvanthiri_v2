<?php
/**
 * Laravel Cache Clearing Script for Hostinger
 * Place this in your public_html folder.
 * URL: https://yourdomain.com/clear_cache.php?key=your_secret_key
 */

// --- CONFIGURATION ---
// 1. Set a secret key for security so random people can't clear your cache.
$secretKey = 'dhanvanthiri2026'; 

// 2. Set the path to your Laravel root. 
// If this file is inside public_html and your Laravel is in public_html/core, then use __DIR__ . '/core'
// If this file is in the same folder as artisan, use __DIR__
$laravelRoot = __DIR__ . '/core'; 
if (!file_exists($laravelRoot . '/artisan')) {
    $laravelRoot = __DIR__; // Fallback to current directory
}

// --- SECURITY CHECK ---
if (!isset($_GET['key']) || $_GET['key'] !== $secretKey) {
    header('HTTP/1.0 403 Forbidden');
    die('Unauthorized access.');
}

echo "<h1>Laravel Cache Clear Tool</h1>";
echo "<pre>";

// 1. ATTEMPT ARTISAN COMMANDS (The cleanest way)
if (file_exists($laravelRoot . '/bootstrap/app.php')) {
    try {
        echo "Bootstrapping Laravel... \n";
        require $laravelRoot . '/vendor/autoload.php';
        $app = require_once $laravelRoot . '/bootstrap/app.php';

        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        echo "Running 'config:clear'... ";
        \Illuminate\Support\Facades\Artisan::call('config:clear');
        echo "Done.\n";

        echo "Running 'route:clear'... ";
        \Illuminate\Support\Facades\Artisan::call('route:clear');
        echo "Done.\n";

        echo "Running 'view:clear'... ";
        \Illuminate\Support\Facades\Artisan::call('view:clear');
        echo "Done.\n";

        echo "Running 'cache:clear'... ";
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
        echo "Done.\n";

        echo "Running 'event:clear'... ";
        \Illuminate\Support\Facades\Artisan::call('event:clear');
        echo "Done.\n";

    } catch (Exception $e) {
        echo "Note: Artisan commands failed (likely due to broken cache). Proceeding with manual file deletion...\n";
    }
}

// 2. MANUAL FILE DELETION (Specific files requested)
$filesToDelete = [
    $laravelRoot . '/bootstrap/cache/routes-v7.php',
    $laravelRoot . '/bootstrap/cache/routes.php',
    $laravelRoot . '/bootstrap/cache/config.php',
    $laravelRoot . '/bootstrap/cache/events.php', // Often good to clear too
];

echo "\n--- Manual File Deletion ---\n";
foreach ($filesToDelete as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            echo "Successfully deleted: " . basename($file) . "\n";
        } else {
            echo "Failed to delete: " . basename($file) . " (Check permissions)\n";
        }
    } else {
        echo "File already gone: " . basename($file) . "\n";
    }
}

// 3. CLEAR VIEW CACHE MANUALLY (Optional but helpful)
$viewCachePath = $laravelRoot . '/storage/framework/views';
if (is_dir($viewCachePath)) {
    echo "\nCleaning view cache directory... ";
    $files = glob($viewCachePath . '/*');
    foreach ($files as $file) {
        if (is_file($file) && basename($file) !== '.gitignore') {
            unlink($file);
        }
    }
    echo "Done.\n";
}

echo "\n--- All Operations Completed ---";
echo "</pre>";
