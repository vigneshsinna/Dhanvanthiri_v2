<?php

/**
 * Comprehensive Customer Audit script for Dhanvanthiri Foods
 * Fixed version to avoid 500 errors.
 */

use App\Models\User;
use App\Models\Order;
use App\Models\Wishlist;
use App\Models\Cart;
use App\Models\GuestCheckoutSession;

// Include Laravel bootstrap
$root = __DIR__;
if (file_exists($root . '/core/vendor/autoload.php')) {
    $root .= '/core';
}

require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'nanoroboticsai@gmail.com';

echo "--- COMPREHENSIVE CUSTOMER AUDIT: $email ---\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "ERROR: User not found.\n";
    exit;
}

echo "--- PROFILE INFORMATION ---\n";
echo "ID: " . $user->id . "\n";
echo "Name: " . $user->name . "\n";
echo "Email: " . $user->email . "\n";
echo "Type: " . $user->user_type . "\n";
echo "Phone: " . ($user->phone ?? 'Not set') . "\n";
echo "Created At: " . $user->created_at . "\n\n";

echo "--- ORDERS FOR THIS USER ---\n";
$orders = Order::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
if ($orders->count() > 0) {
    echo "Found " . $orders->count() . " orders:\n";
    foreach ($orders as $order) {
        echo "- Code: " . ($order->code ?? $order->order_code ?? 'N/A') . " | Status: " . $order->delivery_status . " | Total: " . $order->grand_total . " | Date: " . $order->created_at . "\n";
    }
} else {
    echo "No orders found linked to User ID " . $user->id . ".\n";
}
echo "\n";

echo "--- GUEST CHECKOUT SESSIONS ---\n";
// Searching by guest_user_id or temp_user_id
$guestSessions = GuestCheckoutSession::where('guest_user_id', $user->id)->orWhere('temp_user_id', $user->id)->get();
if ($guestSessions->count() > 0) {
    echo "Found " . $guestSessions->count() . " guest sessions related to your ID:\n";
    foreach ($guestSessions as $gs) {
        echo "- ID: " . $gs->id . " | Order Code: " . ($gs->order_code ?? 'N/A') . " | Status: " . $gs->status . " | Date: " . $gs->created_at . "\n";
    }
} else {
    echo "No guest checkout sessions found for your ID.\n";
}
echo "\n";

echo "--- COMBINED ORDERS ---\n";
$combinedOrders = \DB::table('combined_orders')->where('user_id', $user->id)->get();
if ($combinedOrders->count() > 0) {
    echo "Found " . $combinedOrders->count() . " combined orders:\n";
    foreach ($combinedOrders as $co) {
        echo "- Code: " . $co->code . " | Grand Total: " . $co->grand_total . " | Date: " . $co->created_at . "\n";
    }
} else {
    echo "No combined orders found for your ID.\n";
}
echo "\n";

echo "--- SYSTEM WIDE SCAN (Since May 1st) ---\n";
$allRecentOrders = Order::where('created_at', '>=', '2026-05-01')->orderBy('created_at', 'desc')->get();
if ($allRecentOrders->count() > 0) {
    echo "Found " . $allRecentOrders->count() . " total orders since May 1st:\n";
    foreach ($allRecentOrders as $ro) {
        $buyer = "User ID: " . $ro->user_id;
        $shipping = json_decode($ro->shipping_address, true);
        if ($shipping && isset($shipping['name'])) {
            $buyer .= " (" . $shipping['name'] . ")";
        }
        echo "- Code: " . ($ro->code ?? $ro->order_code ?? 'N/A') . " | Buyer: $buyer | Total: " . $ro->grand_total . " | Status: " . $ro->delivery_status . " | Date: " . $ro->created_at . "\n";
    }
} else {
    echo "No orders found in the system since May 1st.\n";
}

echo "\n--- WISHLIST ---\n";
$wishlists = Wishlist::where('user_id', $user->id)->get();
echo "Total items: " . $wishlists->count() . "\n";

echo "--- ACTIVE CART ---\n";
$carts = Cart::where('user_id', $user->id)->get();
echo "Total items: " . $carts->count() . "\n";

echo "\n--- AUDIT COMPLETE ---\n";
