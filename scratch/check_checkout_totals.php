<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Cart;
use App\Models\Product;
use App\Support\GuestCheckout\GuestCheckoutService;

$service = new GuestCheckoutService();

// Let's find a guest session that was recently active
$items = Cart::where('user_id', 12)->active()->get();
if ($items->isEmpty()) {
    echo "No active cart items found for user 12\n";
    exit;
}

echo "Items in cart: " . $items->count() . "\n";

foreach ($items as $item) {
    echo "Item ID: " . $item->id . ", Product ID: " . $item->product_id . ", Price: " . $item->price . ", Quantity: " . $item->quantity . ", Tax: " . $item->tax . ", Shipping: " . $item->shipping_cost . "\n";
}

// Manually calculate buildCartTotals logic
$subtotal = 0.0;
$tax = 0.0;
foreach ($items as $item) {
    $subtotal += (float) $item->price * (int) $item->quantity;
    $tax += (float) $item->tax * (int) $item->quantity;
}
$shippingCost = (float) $items->sum('shipping_cost');
$discountAmount = (float) $items->sum('discount');

echo "\nManual summary calculation (GuestCheckoutService logic):\n";
echo "Subtotal: $subtotal\n";
echo "Tax: $tax\n";
echo "Shipping: $shippingCost\n";
echo "Discount: $discountAmount\n";
echo "Grand Total: " . (($subtotal + $tax + $shippingCost) - $discountAmount) . "\n";

// Now let's see what fresh calculations say
echo "\nFresh Calculations (StorefrontCheckoutBridgeController logic):\n";
$freshSubtotal = 0;
$freshTax = 0;
$totalGst = 0;

foreach ($items as $item) {
    $product = Product::find($item->product_id);
    $freshPrice = cart_product_price($item, $product, false, false);
    $freshTaxItem = cart_product_tax($item, $product, false);
    $freshGst = cart_product_gst($item, $product, false);
    
    $freshSubtotal += $freshPrice * $item->quantity;
    $freshTax += $freshTaxItem * $item->quantity;
    $totalGst += $freshGst * $item->quantity;

    echo "Item " . $item->id . " (Product " . $product->id . " - " . $product->name . "):\n";
    echo "  DB Price: " . $item->price . " vs Fresh Price: $freshPrice\n";
    echo "  DB Tax: " . $item->tax . " vs Fresh Tax: $freshTaxItem\n";
    echo "  Fresh GST: $freshGst\n";
}

echo "\nFresh Summary:\n";
echo "Subtotal: $freshSubtotal\n";
echo "Tax: $freshTax\n";
echo "GST: $totalGst\n";
echo "Shipping: $shippingCost\n";
echo "Grand Total (with Tax): " . ($freshSubtotal + $freshTax + $shippingCost) . "\n";
echo "Grand Total (with GST): " . ($freshSubtotal + $totalGst + $shippingCost) . "\n";
