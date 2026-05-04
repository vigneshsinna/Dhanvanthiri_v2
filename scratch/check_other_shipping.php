<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Shipping Systems:\n";
print_r(DB::table('shipping_systems')->get()->toArray());

echo "\nCities with costs:\n";
print_r(DB::table('cities')->where('cost', '>', 0)->get()->toArray());

echo "\nAreas with costs:\n";
print_r(DB::table('areas')->where('cost', '>', 0)->get()->toArray());
