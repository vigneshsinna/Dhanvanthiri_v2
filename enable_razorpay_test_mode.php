<?php

/**
 * Enable Razorpay Test Mode and Clear Cache
 */

use App\Models\BusinessSetting;
use Illuminate\Support\Facades\Cache;

// Include Laravel bootstrap
$root = __DIR__;
if (file_exists($root . '/core/vendor/autoload.php')) {
    $root .= '/core';
}

require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Enabling Razorpay Test Mode...\n";

BusinessSetting::updateOrCreate(
    ['type' => 'razorpay_test_mode'],
    ['value' => '1']
);

echo "Clearing business_settings cache...\n";
Cache::forget('business_settings');

echo "Razorpay Test Mode has been ENABLED (set to 1).\n";
