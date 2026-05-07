<?php

/**
 * Razorpay Configuration Audit
 */

use App\Support\Checkout\PaymentGatewayConfig;

// Include Laravel bootstrap
$root = __DIR__;
if (file_exists($root . '/core/vendor/autoload.php')) {
    $root .= '/core';
}

require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- RAZORPAY CONFIGURATION AUDIT ---\n\n";

try {
    $config = app(PaymentGatewayConfig::class)->razorpay();
    
    echo "Razorpay Enabled: " . (app(PaymentGatewayConfig::class)->isEnabled('razorpay') ? 'YES' : 'NO') . "\n";
    echo "Key ID: " . ($config['key_id'] ?? 'MISSING') . "\n";
    // Key Secret is hidden for security but we check if it exists
    echo "Key Secret Set: " . (isset($config['key_secret']) && !empty($config['key_secret']) ? 'YES' : 'NO') . "\n";
    
    // Check Razorpay Mode from Business Settings
    $razorpay_test_mode = get_setting('razorpay_test_mode');
    echo "Razorpay Test Mode (System Setting): " . ($razorpay_test_mode == 1 ? 'ENABLED' : 'DISABLED') . "\n";

    echo "\n--- CONNECTIVITY TEST ---\n";
    $api = new \Razorpay\Api\Api($config['key_id'], $config['key_secret']);
    try {
        $orders = $api->order->all(['count' => 1]);
        echo "Razorpay API Connection: SUCCESSFUL\n";
    } catch (\Throwable $e) {
        echo "Razorpay API Connection: FAILED\n";
        echo "Error: " . $e->getMessage() . "\n";
    }

} catch (\Throwable $e) {
    echo "ERROR during config retrieval: " . $e->getMessage() . "\n";
}

echo "\n--- AUDIT COMPLETE ---\n";
