<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CarrierRange;
use App\Models\CarrierRangePrice;

// ST Courier is ID 1
$ranges = CarrierRange::where('carrier_id', 1)->get();

foreach ($ranges as $range) {
    // Check if price for Zone 3 (North India) exists
    $exists = CarrierRangePrice::where('carrier_range_id', $range->id)
        ->where('zone_id', 3)
        ->exists();
    
    if (!$exists) {
        // Get price from Zone 2 (South India) as a baseline for "Pan India"
        $southPrice = CarrierRangePrice::where('carrier_range_id', $range->id)
            ->where('zone_id', 2)
            ->first();
            
        if ($southPrice) {
            $newPrice = new CarrierRangePrice();
            $newPrice->carrier_range_id = $range->id;
            $newPrice->zone_id = 3;
            $newPrice->price = $southPrice->price;
            $newPrice->save();
            echo "Added ST Courier price for Zone 3 (Range: {$range->delimiter1}-{$range->delimiter2}) -> Rs {$southPrice->price}\n";
        }
    } else {
        echo "ST Courier price for Zone 3 already exists for range {$range->delimiter1}-{$range->delimiter2}\n";
    }
}
