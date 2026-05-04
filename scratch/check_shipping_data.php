<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Carriers:\n";
$carriers = DB::table('carriers')->get();
foreach ($carriers as $carrier) {
    echo "ID: {$carrier->id}, Name: {$carrier->name}\n";
}

echo "\nZones:\n";
$zones = DB::table('zones')->get();
foreach ($zones as $zone) {
    echo "ID: {$zone->id}, Name: {$zone->name}\n";
}

echo "\nCarrier Ranges:\n";
$ranges = DB::table('carrier_ranges')->get();
foreach ($ranges as $range) {
    echo "ID: {$range->id}, Carrier ID: {$range->carrier_id}, Range: {$range->delimiter1} - {$range->delimiter2}\n";
}

echo "\nCarrier Range Prices:\n";
$rangePrices = DB::table('carrier_range_prices')
    ->join('carrier_ranges', 'carrier_range_prices.carrier_range_id', '=', 'carrier_ranges.id')
    ->join('carriers', 'carrier_ranges.carrier_id', '=', 'carriers.id')
    ->join('zones', 'carrier_range_prices.zone_id', '=', 'zones.id')
    ->select('carriers.name as carrier_name', 'zones.name as zone_name', 'carrier_range_prices.*', 'carrier_ranges.delimiter1', 'carrier_ranges.delimiter2')
    ->get();

foreach ($rangePrices as $rp) {
    echo "ID: {$rp->id}, Carrier: {$rp->carrier_name}, Zone: {$rp->zone_name}, Price: {$rp->price}, Range: {$rp->delimiter1} - {$rp->delimiter2}\n";
}
