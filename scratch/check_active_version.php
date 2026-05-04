<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$version = DB::table('business_settings')->where('type', 'current_version')->value('value');
echo "Current Version in Dhanvathiri_v2: $version\n";
