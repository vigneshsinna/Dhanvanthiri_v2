<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Cart;
use App\Models\Product;

// Set a GST rate on one of the products to verify logic
$product = Product::find(1);
$product->gst_rate = 18; // 18% GST
$product->save();

$items = Cart::where('user_id', 12)->active()->get();
echo "Items in cart: " . $items->count() . "\n";

// Replicating updated GuestCheckoutService@buildCartTotals logic
$subtotal = 0.0;
$tax = 0.0;
foreach ($items as $item) {
    $p = $item->product;
    if ($p) {
        $subtotal += cart_product_price($item, $p, false, false) * $item->quantity;
        $tax += cart_product_tax($item, $p, false) * $item->quantity;
    } else {
        $subtotal += (float) $item->price * (int) $item->quantity;
        $tax += (float) $item->tax * (int) $item->quantity;
    }
}
$shippingCost = (float) $items->sum('shipping_cost');

echo "\nSummary from UPDATED GuestCheckoutService logic:\n";
echo "Subtotal: $subtotal\n";
echo "Tax (now includes GST): $tax\n";
echo "Shipping: $shippingCost\n";
echo "Grand Total: " . ($subtotal + $tax + $shippingCost) . "\n";

foreach ($items as $item) {
    $p = Product::find($item->product_id);
    $freshPrice = cart_product_price($item, $p, false, false);
    $freshTax = cart_product_tax($item, $p, false);
    echo "Product " . $p->id . " (" . $p->name . "): Price: $freshPrice, Tax: $freshTax, GST Rate: " . $p->gst_rate . "%\n";
}
