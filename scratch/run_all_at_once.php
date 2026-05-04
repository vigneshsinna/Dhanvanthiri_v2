<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$sqlFile = 'v:\pers\Freelance\Dhanvathiri_v2\all_combined_updates.sql';
echo "Reading $sqlFile...\n";
$sql = file_get_contents($sqlFile);

echo "Executing SQL (5.3MB)...\n";
try {
    DB::unprepared($sql);
    echo "Success!\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
