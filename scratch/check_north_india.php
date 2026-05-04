<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$prices = DB::table('carrier_range_prices')
    ->join('carrier_ranges', 'carrier_range_prices.carrier_range_id', '=', 'carrier_ranges.id')
    ->join('carriers', 'carrier_ranges.carrier_id', '=', 'carriers.id')
    ->where('carrier_range_prices.zone_id', 3) // North India
    ->select('carriers.name', 'carrier_range_prices.*')
    ->get();

echo "Carrier prices for North India (Zone 3):\n";
foreach ($prices as $p) {
    echo "ID: {$p->id}, Carrier: {$p->name}, Price: {$p->price}\n";
}
