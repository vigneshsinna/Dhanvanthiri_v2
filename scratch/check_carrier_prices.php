<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Carrier;

$carriers = Carrier::with('carrier_ranges.carrier_range_prices.zone')->get();
foreach ($carriers as $c) {
    echo "Carrier: " . $c->name . " (ID: " . $c->id . ")\n";
    if ($c->free_shipping) {
        echo "  Free Shipping: Yes\n";
    }
    foreach ($c->carrier_ranges as $r) {
        echo "  Range: " . $r->delimiter1 . " to " . $r->delimiter2 . " (" . $r->billing_type . ")\n";
        foreach ($r->carrier_range_prices as $p) {
            echo "    Zone: " . ($p->zone->name ?? 'Unknown') . " - Price: " . $p->price . "\n";
        }
    }
    echo "\n";
}
