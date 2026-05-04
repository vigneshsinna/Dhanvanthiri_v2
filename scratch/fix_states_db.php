<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\State;
use App\Models\Zone;
use App\Models\Country;

// 1. Get IDs
$india = Country::where('name', 'India')->first();
$tnZone = Zone::where('name', 'Tamil Nadu')->first();

if (!$india || !$tnZone) {
    die("Country or Zone not found\n");
}

echo "India ID: " . $india->id . "\n";
echo "TN Zone ID: " . $tnZone->id . "\n";

// 2. Add "Tamil Nadu" as a state if it doesn't exist
$tnState = State::where('name', 'Tamil Nadu')->first();
if (!$tnState) {
    $tnState = new State();
    $tnState->name = 'Tamil Nadu';
    $tnState->country_id = $india->id;
    $tnState->zone_id = $tnZone->id;
    $tnState->status = 1;
    $tnState->save();
    echo "Added Tamil Nadu state (ID: " . $tnState->id . ")\n";
} else {
    $tnState->status = 1;
    $tnState->zone_id = $tnZone->id;
    $tnState->save();
    echo "Updated Tamil Nadu state status to 1\n";
}

// 3. Deactivate districts in TN Zone
$districtsCount = State::where('zone_id', $tnZone->id)
    ->where('id', '!=', $tnState->id)
    ->update(['status' => 0]);

echo "Deactivated $districtsCount districts in Zone " . $tnZone->id . "\n";
