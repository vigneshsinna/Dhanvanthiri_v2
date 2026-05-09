<?php
/**
 * Diagnostic tool to list all registered routes on Hostinger.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

header('Content-Type: text/plain');
echo "Registered Routes:\n";
echo str_pad("Method", 10) . " | " . str_pad("URI", 50) . " | " . "Name\n";
echo str_repeat("-", 80) . "\n";

foreach (Route::getRoutes() as $route) {
    echo str_pad(implode('|', $route->methods()), 10) . " | " . str_pad($route->uri(), 50) . " | " . $route->getName() . "\n";
}
