<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\Admin\AdminBridgeController;
use App\Http\Controllers\Api\Admin as Admin;
use App\Http\Controllers\Api\V2\GuestAccountClaimController;
use App\Http\Controllers\Api\V2\GuestCheckoutController;
use App\Http\Controllers\Api\V2\NotificationController as V2NotificationController;
use App\Http\Controllers\Api\V2\SystemController;
use App\Http\Controllers\Api\V2\CustomerFileUploadController;
use App\Http\Controllers\Api\V2\LanguageController;
use App\Http\Controllers\Api\V2\CurrencyController;
use App\Http\Middleware\EnsureSystemKey;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V2 Routes (Commerce Logic)
|--------------------------------------------------------------------------
*/

Route::group(['prefix' => 'v2'], function () {

    // ── Authentication ──
    Route::group(['prefix' => 'auth'], function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('signup', [AuthController::class, 'signup']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });

    // ── Catalog & Search ──
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/featured', [ProductController::class, 'featured']);
    Route::get('products/related/{id}', [ProductController::class, 'relatedProducts']);
    Route::get('products/{id}/related', [ProductController::class, 'relatedProducts']);
    Route::get('products/best-seller', [ProductController::class, 'bestSeller']);
    Route::get('products/todays-deal', [ProductController::class, 'todaysDeal']);
    Route::get('products/{slug}/{user_id?}', [ProductController::class, 'product_details']);
    Route::get('products/variant-price', [ProductController::class, 'variantPrice']);

    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/featured', [CategoryController::class, 'featured']);
    Route::get('categories/home', [CategoryController::class, 'home']);
    Route::get('categories/top', [CategoryController::class, 'top']);

    Route::get('brands', [BrandController::class, 'index']);
    Route::get('brands/top', [BrandController::class, 'top']);

    // ── Cart ──
    Route::group(['prefix' => 'cart', 'middleware' => ['auth:sanctum', 'customer']], function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('add', [CartController::class, 'add']);
        Route::post('update', [CartController::class, 'update']);
        Route::post('delete', [CartController::class, 'destroy']);
        Route::post('process', [CartController::class, 'process']);
    });

    // ── Checkout & Orders ──
    Route::group(['prefix' => 'order', 'middleware' => ['auth:sanctum', 'customer']], function () {
        Route::get('history', [OrderController::class, 'history']);
        Route::get('details/{id}', [OrderController::class, 'show']);
        Route::get('items/{id}', [OrderController::class, 'items']);
        Route::post('store', [OrderController::class, 'store']);
    });

    // ── Guest Checkout ──
    Route::group(['prefix' => 'guest-checkout'], function () {
        Route::post('validate', [GuestCheckoutController::class, 'validateCheckout']);
        Route::match(['get', 'post'], 'summary', [GuestCheckoutController::class, 'summary']);
        Route::post('payment-intent', [GuestCheckoutController::class, 'paymentIntent']);
        Route::post('confirm-payment', [GuestCheckoutController::class, 'confirmPayment']);
        Route::post('claim-account', [GuestCheckoutController::class, 'claimAccount']);
        Route::post('track-order', [GuestCheckoutController::class, 'trackOrder']);
        Route::get('order-detail/{order_number}', [GuestCheckoutController::class, 'showOrder']);
    });

    Route::group(['prefix' => 'guest'], function () {
        Route::post('checkout/validate', [GuestCheckoutController::class, 'validateCheckout']);
        Route::post('checkout/summary', [GuestCheckoutController::class, 'summary']);
        Route::post('payments/intent', [GuestCheckoutController::class, 'paymentIntent']);
        Route::post('payments/confirm', [GuestCheckoutController::class, 'confirmPayment']);
    });

    Route::post('checkout/validate', [StorefrontCheckoutBridgeController::class, 'validateCheckout'])->middleware(['auth:sanctum', 'customer']);
    Route::post('checkout/summary', [StorefrontCheckoutBridgeController::class, 'summary'])->middleware(['auth:sanctum', 'customer']);
    Route::post('checkout/shipping-rates', [StorefrontCheckoutBridgeController::class, 'shippingRates']);
    Route::post('payments/intent', [StorefrontCheckoutBridgeController::class, 'intent'])->middleware(['auth:sanctum', 'customer']);
    Route::post('payments/confirm', [StorefrontCheckoutBridgeController::class, 'confirm'])->middleware(['auth:sanctum', 'customer']);
    Route::get('payment-types', [PaymentTypesController::class, 'getList']);

    // ── User Features ──
    Route::group(['middleware' => ['auth:sanctum', 'customer']], function () {
        Route::get('wishlists', [WishlistController::class, 'index']);
        Route::post('wishlists/add/{slug}', [WishlistController::class, 'add']);
        Route::post('wishlists/remove/{slug}', [WishlistController::class, 'remove']);
        Route::get('wishlists-check-product/{product_slug}', [WishlistController::class, 'isProductInWishlist']);
        Route::post('wishlists-add-product/{product_slug}', [WishlistController::class, 'add']);
        Route::delete('wishlists-remove-product/{product_slug}', [WishlistController::class, 'remove']);

        Route::get('addresses', [AddressController::class, 'addresses']);
        Route::post('addresses/create', [AddressController::class, 'createShippingAddress']);
        Route::post('addresses/update', [AddressController::class, 'updateShippingAddress']);
        Route::post('addresses/delete/{id}', [AddressController::class, 'deleteShippingAddress']);
        Route::post('addresses/make-default', [AddressController::class, 'makeShippingAddressDefault']);
        Route::get('user/shipping/address', [AddressController::class, 'addresses']);
        Route::post('user/shipping/create', [AddressController::class, 'createShippingAddress']);
        Route::post('user/shipping/update', [AddressController::class, 'updateShippingAddress']);
        Route::get('user/shipping/delete/{id}', [AddressController::class, 'deleteShippingAddress']);
        Route::post('user/shipping/make_default', [AddressController::class, 'makeShippingAddressDefault']);

        Route::get('wallet/balance', [WalletController::class, 'balance']);
        Route::get('wallet/history', [WalletController::class, 'history']);
    });

    // ── CMS & Settings ──
    Route::get('banners', [CmsController::class, 'banners']);
    Route::get('home-sections', [CmsController::class, 'homeSections']);
    Route::get('policies/{type}', [CmsController::class, 'policy']);
    Route::get('settings', [SystemController::class, 'settings']);

    // ── Reviews & Queries ──
    Route::get('reviews/product/{id}', [ReviewController::class, 'index']);
    Route::get('queries/product/{id}', [ProductQueryController::class, 'index']);
    Route::get('product-queries/{id}', [ProductQueryController::class, 'index']);
    Route::post('reviews/submit', [ReviewController::class, 'submit'])->middleware('auth:sanctum');
    Route::post('queries/submit', [ProductQueryController::class, 'store'])->middleware('auth:sanctum');
    Route::post('product-queries', [ProductQueryController::class, 'store'])->middleware('auth:sanctum');

    // ── Blog ──
    Route::get('blogs', [BlogController::class, 'blog_list']);
    Route::get('blogs/{slug}', [BlogController::class, 'blog_details']);

    // ── Payments (V2 Adapters) ──
    Route::any('razorpay/pay-with-razorpay', 'App\Http\Controllers\Api\V2\RazorpayController@payWithRazorpay')->name('api.razorpay.payment');
    Route::any('razorpay/payment', 'App\Http\Controllers\Api\V2\RazorpayController@payment')->name('api.razorpay.payment');
    Route::any('paystack/init', 'App\Http\Controllers\Api\V2\PaystackController@init')->name('api.paystack.init');
    Route::any('iyzico/init', 'App\Http\Controllers\Api\V2\IyzicoController@init')->name('api.iyzico.init');

    // customer file upload
    Route::controller(CustomerFileUploadController::class)->middleware('auth:sanctum')->group(function () {
        Route::post('file/upload', 'upload');
        Route::get('file/all', 'index');
        Route::get('file/delete/{id}', 'destroy');
    });
});

Route::withoutMiddleware([EnsureSystemKey::class])->group(function () {
Route::group(['prefix' => 'admin', 'middleware' => ['auth:sanctum', 'admin']], function () {
    // ── Existing Product / Page / Post / FAQ routes ──
    Route::get('products', [Admin\AdminProductController::class, 'index']);
    Route::get('products/{id}', [Admin\AdminProductController::class, 'show']);
    Route::post('products', [Admin\AdminProductController::class, 'store']);
    Route::put('products/{id}', [Admin\AdminProductController::class, 'update']);
    Route::delete('products/{id}', [Admin\AdminProductController::class, 'destroy']);

    Route::get('categories', [Admin\AdminCategoryController::class, 'index']);
    Route::get('brands', [Admin\AdminBrandController::class, 'index']);

    // ── Sales & Orders ──
    Route::get('orders', [Admin\AdminOrderController::class, 'index']);
    Route::get('orders/{id}', [Admin\AdminOrderController::class, 'show']);
    Route::put('orders/{id}/status', [Admin\AdminOrderController::class, 'updateStatus']);

    // ── Customers ──
    Route::get('customers', [Admin\AdminCustomerController::class, 'index']);
    Route::get('customers/{id}', [Admin\AdminCustomerController::class, 'show']);

    // ── CMS (Banners, Home Sections) ──
    Route::get('banners', [Admin\AdminCmsController::class, 'bannersIndex']);
    Route::post('banners', [Admin\AdminCmsController::class, 'bannersStore']);
    Route::get('home-sections', [Admin\AdminCmsController::class, 'homeSectionsIndex']);

    // ── Notifications ──
    Route::get('notifications', [Admin\AdminNotificationController::class, 'notificationsIndex']);
    Route::put('notifications/read-all', [Admin\AdminNotificationController::class, 'markAllRead']);

    // ── Activity Logs ──
    Route::get('activity-logs', [Admin\AdminNotificationController::class, 'activityLogs']);

    // ── Admin Users ──
    Route::get('admins', [Admin\AdminNotificationController::class, 'adminsIndex']);
    Route::post('admins', [Admin\AdminNotificationController::class, 'adminsStore']);
    Route::delete('admins/{id}', [Admin\AdminNotificationController::class, 'adminsDestroy']);

    // ── System ──
    Route::get('system/info', [Admin\AdminSystemController::class, 'info']);
    Route::get('system/health', [Admin\AdminSystemController::class, 'health']);
    Route::get('system/db-stats', [Admin\AdminSystemController::class, 'dbStats']);
    Route::post('system/clear-cache', [Admin\AdminSystemController::class, 'clearCache']);
    Route::post('system/maintenance', [Admin\AdminSystemController::class, 'maintenance']);
});
});

Route::fallback(function () {
    return response()->json([
        'data' => [],
        'success' => false,
        'status' => 404,
        'message' => 'Invalid Route'
    ]);
});
