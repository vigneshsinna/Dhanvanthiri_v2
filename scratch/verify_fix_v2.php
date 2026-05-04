<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\State;
use App\Models\Cart;
use App\Models\Product;

function mockShippingCalculation($stateName) {
    $state = State::where('name', $stateName)->first();
    if (!$state) return "State [$stateName] not found";
    
    $shippingInfo = [
        'country_id' => 1,
        'state_id' => $state->id,
        'city_id' => null
    ];
    
    $product = Product::first();
    if (!$product) return "No products found";
    
    $cart = new Cart();
    $cart->product_id = $product->id;
    $cart->quantity = 1;
    $cart->price = $product->unit_price;
    $cart->tax = 0;
    
    $carts = collect([$cart]);
    
    try {
        $costProf = getShippingCost($carts, 0, $shippingInfo, 1); // Professional
        $costDtdc = getShippingCost($carts, 0, $shippingInfo, 2); // DTDC
        return "[$stateName] (Zone $state->zone_id) -> Professional: Rs $costProf, DTDC: Rs $costDtdc";
    } catch (\Throwable $e) {
        return "[$stateName] (Zone $state->zone_id) -> FAILED: " . $e->getMessage();
    }
}

echo mockShippingCalculation('Tamil Nadu') . "\n";
echo mockShippingCalculation('Karnataka') . "\n";
echo mockShippingCalculation('Maharashtra') . "\n";
echo mockShippingCalculation('Chennai') . " (Should be deactivated)\n";
