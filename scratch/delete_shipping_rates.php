<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$idsToDelete = [9, 10, 12, 13, 15, 16, 18, 19];

echo "Deleting DTDC prices for Tamil Nadu (Zone 1) and South India (Zone 2)...\n";
$deletedCount = DB::table('carrier_range_prices')
    ->whereIn('id', $idsToDelete)
    ->delete();

echo "Deleted $deletedCount records.\n";

echo "\nVerifying ST Courier for North India (Zone 3)...\n";
$stNorthCount = DB::table('carrier_range_prices')
    ->join('carrier_ranges', 'carrier_range_prices.carrier_range_id', '=', 'carrier_ranges.id')
    ->where('carrier_ranges.carrier_id', 1)
    ->where('carrier_range_prices.zone_id', 3)
    ->count();

if ($stNorthCount === 0) {
    echo "Confirmed: ST Courier has no North India (Zone 3) prices.\n";
} else {
    echo "WARNING: ST Courier still has $stNorthCount North India prices. Something is wrong.\n";
}
