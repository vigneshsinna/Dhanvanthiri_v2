<?php
/**
 * Diagnostic tool to clear Laravel cache on Hostinger.
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (file_exists(__DIR__.'/core/vendor/autoload.php')) {
    require __DIR__.'/core/vendor/autoload.php';
    $app = require_once __DIR__.'/core/bootstrap/app.php';
} else {
    require __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
}

use Illuminate\Support\Facades\Artisan;

// Bootstrap the console kernel instead of HTTP kernel
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

header('Content-Type: text/html');
echo "<h2>Laravel Cache Clearing Utility</h2>";

try {
    echo "Clearing all caches (optimize:clear)...<br>";
    $status = Artisan::call('optimize:clear');
    echo "<pre>" . Artisan::output() . "</pre>";
    
    if ($status === 0) {
        echo "<b style='color:green;'>Successfully cleared cache!</b>";
    } else {
        echo "<b style='color:red;'>Failed to clear cache. Status code: $status</b>";
    }
    
} catch (\Exception $e) {
    echo "<b style='color:red;'>Exception occurred:</b><br>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
