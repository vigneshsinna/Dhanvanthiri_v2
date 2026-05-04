<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Carrier;
use App\Models\Product;

echo "--- Carriers ---\n";
$carriers = Carrier::all();
foreach ($carriers as $c) {
    echo "ID: " . $c->id . ", Name: " . $c->name . ", Status: " . $c->status . "\n";
}

echo "\n--- Product Weights (first 10) ---\n";
$products = Product::select('id', 'name', 'weight')->limit(10)->get();
foreach ($products as $p) {
    echo "ID: " . $p->id . ", Name: " . $p->name . ", Weight: " . $p->weight . "\n";
}
