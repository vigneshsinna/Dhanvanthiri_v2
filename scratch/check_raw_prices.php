<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$allPrices = DB::table('carrier_range_prices')->get();
foreach ($allPrices as $p) {
    echo "ID: {$p->id}, RangeID: {$p->carrier_range_id}, ZoneID: {$p->zone_id}, Price: {$p->price}\n";
}
