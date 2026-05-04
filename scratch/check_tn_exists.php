<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\State;

$states = State::where('name', 'Tamil Nadu')->get();
echo "Count: " . $states->count() . "\n";
foreach ($states as $s) {
    echo "ID: " . $s->id . ", Status: " . $s->status . ", Zone ID: " . $s->zone_id . "\n";
}
