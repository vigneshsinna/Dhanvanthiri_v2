<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Zone;
use App\Models\State;

$zones = Zone::all();
foreach ($zones as $zone) {
    echo "Zone: " . $zone->name . " (ID: " . $zone->id . ")\n";
    $states = State::where('zone_id', $zone->id)->pluck('name')->toArray();
    echo "States: " . implode(", ", $states) . "\n\n";
}
