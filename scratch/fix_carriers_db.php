<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Carrier;

// 1. Rename Professional Courier to ST Courier
$c1 = Carrier::find(1);
if ($c1) {
    $c1->name = 'ST Courier';
    $c1->status = 1;
    $c1->save();
    echo "Renamed Carrier 1 to ST Courier\n";
}

// 2. Ensure DTDC is active
$c2 = Carrier::find(2);
if ($c2) {
    $c2->status = 1;
    $c2->save();
    echo "Ensured DTDC is active\n";
}

// 3. Deactivate other carriers
Carrier::whereNotIn('id', [1, 2])->update(['status' => 0]);
echo "Deactivated other carriers\n";
