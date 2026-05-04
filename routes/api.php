<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\Admin\AdminBridgeController;
use App\Http\Controllers\Api\Admin as Admin;
use App\Http\Controllers\Api\V2\GuestAccountClaimController;
use App\Http\Controllers\Api\V2\GuestOrderAccessController;
use App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController;
use App\Http\Middleware\EnsureSystemKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::group(['prefix' => 'v2/auth', 'middleware' => ['app_language']], function () {

    Route::post('info', [AuthController::class, 'getUserInfoByAccessToken']);
    Route::controller(AuthController::class)->group(function () {
        Route::post('login', 'login');
        Route::post('signup', 'signup');
        Route::post('social-login', 'socialLogin');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::controller(AuthController::class)->group(function () {
            Route::get('logout', 'logout');
            Route::get('user', 'user');
            Route::get('account-deletion', 'account_deletion');
            Route::get('resend_code', 'resendCode');
            Route::post('confirm_code', 'confirmCode');
        });
    });
    Route::controller(PasswordResetController::class)->group(function () {
        Route::post('password/forget_request', 'forgetRequest');
        Route::post('password/confirm_reset', 'confirmReset');
        Route::post('password/resend_code', 'resendCode');
    });

    // Token refresh
    Route::post('refresh', function (Request $request) {
        $user = $request->user();
        if (!$user) {
            return response()->json(['result' => false, 'message' => 'Unauthenticated'], 401);
        }
        // Revoke current token and issue new one
        $user->currentAccessToken()->delete();
        $token = $user->createToken('API Token')->plainTextToken;
        return response()->json([
            'result' => true,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    })->middleware('auth:sanctum');
});



Route::group(['prefix' => 'v2', 'middleware' => ['app_language']], function () {

    // ── Newsletter subscribe (public) ──
    Route::post('newsletter/subscribe', function (Request $request) {
        $request->validate(['email' => ['required', 'email']]);
        \App\Models\Subscriber::firstOrCreate(
            ['email' => $request->input('email')],
            ['active' => true]
        );
        return response()->json(['result' => true, 'message' => 'Subscribed successfully']);
    });

    // ── Product Q&A (public read, auth for submit) ──
    Route::get('product-queries/{productId}', function (int $productId) {
        $queries = \App\Models\ProductQuery::where('product_id', $productId)
            ->whereNotNull('reply')
            ->where('reply', '!=', '[rejected]')
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $queries->map(fn($q) => [
                'id' => $q->id,
                'question' => $q->question,
                'answer' => $q->reply,
                'customer_name' => $q->user?->name ?? 'Customer',
                'created_at' => optional($q->created_at)->toISOString(),
            ])->values(),
        ]);
    });

    Route::post('product-queries', function (Request $request) {
        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'question' => ['required', 'string', 'max:1000'],
        ]);

        \App\Models\ProductQuery::create([
            'product_id' => $request->input('product_id'),
            'customer_id' => $request->user()?->id,
            'question' => $request->input('question'),
        ]);

        return response()->json(['success' => true, 'message' => 'Question submitted']);
    })->middleware('auth:sanctum');

    // ── Storefront capability flags (public, cacheable) ──────
    Route::get('capabilities', [CapabilityController::class, 'index']);

    //auth controller
    Route::post('guest-user-account-create', [AuthController::class, 'guestUserAccountCreate']);

    // auction products routes
    Route::controller(AuctionProductController::class)->group(function () {
        Route::get('auction/products', 'index');
        Route::get('auction/products/{slug}', 'details_auction_product');
        Route::get('auction/bided-products', 'bided_products_list')->middleware('auth:sanctum');
        Route::get('auction/purchase-history', 'user_purchase_history')->middleware('auth:sanctum');
    });
    Route::post('auction/place-bid', [AuctionProductBidController::class, 'store'])->middleware('auth:sanctum');

    Route::prefix('delivery-boy')->group(function () {
        Route::controller(DeliveryBoyController::class)->group(function () {
            Route::get('earning/{id}', 'earning')->middleware('auth:sanctum');
            Route::get('collection/{id}', 'collection')->middleware('auth:sanctum');
            Route::get('cancel-request/{id}', 'cancel_request')->middleware('auth:sanctum');
            Route::get('earning-summary/{id}', 'earning_summary')->middleware('auth:sanctum');
            Route::get('dashboard-summary/{id}', 'dashboard_summary')->middleware('auth:sanctum');
            Route::get('collection-summary/{id}', 'collection_summary')->middleware('auth:sanctum');
            Route::get('deliveries/assigned/{id}', 'assigned_delivery')->middleware('auth:sanctum');
            Route::get('deliveries/completed/{id}', 'completed_delivery')->middleware('auth:sanctum');
            Route::get('deliveries/cancelled/{id}', 'cancelled_delivery')->middleware('auth:sanctum');
            Route::get('deliveries/picked_up/{id}', 'picked_up_delivery')->middleware('auth:sanctum');
            Route::post('change-delivery-status', 'change_delivery_status')->middleware('auth:sanctum');
            Route::get('deliveries/on_the_way/{id}', 'on_the_way_delivery')->middleware('auth:sanctum');
            //Delivery Boy Order
            Route::get('purchase-history-details/{id}', [DeliveryBoyController::class, 'details'])->middleware('auth:sanctum');
            Route::get('purchase-history-items/{id}', [DeliveryBoyController::class, 'items'])->middleware('auth:sanctum');
        });
    });

    Route::apiResource('carts', CartController::class)->only('destroy');
    Route::controller(CartController::class)->group(function () {
        Route::post('cart-summary', 'summary');
        Route::post('cart-count', 'count');
        Route::post('carts/process', 'process');
        Route::post('carts/add', 'add');
        Route::post('carts/change-quantity', 'changeQuantity');
        Route::post('carts', 'getList');
        Route::post('guest-customer-info-check', 'guestCustomerInfoCheck');
        Route::post('updateCartStatus', 'updateCartStatus');
    });

    Route::controller(CheckoutController::class)->group(function () {
        Route::post('coupon-apply', 'apply_coupon_code');
        Route::post('coupon-remove', 'remove_coupon_code');
    });

    Route::prefix('guest')->controller(GuestCheckoutController::class)->group(function () {
        Route::post('checkout/validate', 'validateCheckout');
        Route::post('checkout/summary', 'summary');
        Route::post('payments/intent', 'paymentIntent');
        Route::post('payments/confirm', 'confirmPayment');
    });

    Route::prefix('guest')->controller(GuestAccountClaimController::class)->group(function () {
        Route::post('account/claim', 'claim');
    });

    Route::controller(CouponController::class)->group(function () {
        Route::get('coupon-list', 'couponList');
        Route::get('coupon-products/{id}', 'getCouponProducts');
    });

    Route::controller(ShippingController::class)->group(function () {
        Route::post('delivery-info', 'getDeliveryInfo');
        Route::post('shipping_cost', 'shipping_cost');
    });
    Route::post('carriers', [CarrierController::class, 'index']);


    Route::controller(AddressController::class)->group(function () {
        Route::post('update-address-in-cart', 'updateAddressInCart');
        Route::post('update-shipping-type-in-cart', 'updateShippingTypeInCart');
    });

    Route::post('checkout/shipping-rates', [StorefrontCheckoutBridgeController::class, 'shippingRates']);
    Route::get('states', [StorefrontCheckoutBridgeController::class, 'statesList']);
    Route::match(['get', 'post'], 'orders/track', [GuestOrderAccessController::class, 'track'])->middleware('throttle:10,1');
    Route::get('orders/{orderNumber}', [GuestOrderAccessController::class, 'show']);

    Route::get('payment-types', [PaymentTypesController::class, 'getList']);


    // un banned users
    Route::group(['middleware' => ['app_user_unbanned']], function () {
        // customer downloadable product list
        Route::get('/digital/purchased-list', 'App\Http\Controllers\Api\V2\PurchaseHistoryController@digital_purchased_list')->middleware('auth:sanctum');
        Route::get('/purchased-products/download/{id}', 'App\Http\Controllers\Api\V2\DigitalProductController@download')->middleware('auth:sanctum');

        Route::get('wallet/history', [WalletController::class, 'walletRechargeHistory'])->middleware('auth:sanctum');

        Route::controller(ChatController::class)->group(function () {
            Route::get('chat/conversations', 'conversations')->middleware('auth:sanctum');
            Route::get('chat/messages/{id}', 'messages')->middleware('auth:sanctum');
            Route::post('chat/insert-message', 'insert_message')->middleware('auth:sanctum');
            Route::get('chat/get-new-messages/{conversation_id}/{last_message_id}', 'get_new_messages')->middleware('auth:sanctum');
            Route::post('chat/create-conversation', 'create_conversation')->middleware('auth:sanctum');
        });

        Route::controller(PurchaseHistoryController::class)->group(function () {
            Route::get('purchase-history', 'index')->middleware('auth:sanctum');
            Route::get('purchase-history-details/{id}', 'details')->middleware('auth:sanctum');
            Route::get('purchase-history-items/{id}', 'items')->middleware('auth:sanctum');
            Route::get('re-order/{id}', 're_order')->middleware('auth:sanctum');
        });

        Route::get('invoice/download/{id}', [InvoiceController::class, 'invoice_download']);

        Route::prefix('classified')->group(function () {
            Route::controller(CustomerProductController::class)->group(function () {
                Route::get('/own-products', 'ownProducts')->middleware('auth:sanctum');
                Route::post('/store', 'store')->middleware('auth:sanctum');
                Route::post('/update/{id}', 'update')->middleware('auth:sanctum');
                Route::delete('/delete/{id}', 'delete')->middleware('auth:sanctum');
                Route::post('/change-status/{id}', 'changeStatus')->middleware('auth:sanctum');
            });
        });

        Route::get('customer/info', 'App\Http\Controllers\Api\V2\CustomerController@show')->middleware('auth:sanctum');
        Route::get('get-home-delivery-address', [AddressController::class, 'getShippingInCart'])->middleware('auth:sanctum');

        // review
        Route::post('reviews/submit', [ReviewController::class, 'submit'])->name('api.reviews.submit')->middleware('auth:sanctum');
        Route::get('shop/user/{id}', [ShopController::class, 'shopOfUser'])->middleware('auth:sanctum');

        //Follow
        Route::controller(FollowSellerController::class)->group(function () {
            Route::get('/followed-seller', 'index')->middleware('auth:sanctum');
            Route::get('/followed-seller/store/{id}', 'store')->middleware('auth:sanctum');
            Route::get('/followed-seller/remove/{shopId}', 'remove')->middleware('auth:sanctum');
            Route::get('/followed-seller/check/{shopId}', 'checkFollow')->middleware('auth:sanctum');
        });


        // Wishlist
        Route::controller(WishlistController::class)->middleware('auth:sanctum')->group(function () {
            Route::get('wishlists-check-product/{product_slug}', 'isProductInWishlist');
            Route::get('wishlists-add-product/{product_slug}', 'add');
            Route::get('wishlists-remove-product/{product_slug}', 'remove');
            Route::get('wishlists', 'index');
        });

        // addresses
        Route::controller(AddressController::class)->middleware('auth:sanctum')->group(function () {
            Route::get('user/shipping/address', 'addresses');
            Route::post('user/shipping/create', 'createShippingAddress');
            Route::post('user/shipping/update', 'updateShippingAddress');
            Route::post('user/shipping/update-location', 'updateShippingAddressLocation');
            Route::post('user/shipping/make_default', 'makeShippingAddressDefault');
            Route::get('user/shipping/delete/{address_id}', 'deleteShippingAddress');
        });


        Route::get('clubpoint/get-list', 'App\Http\Controllers\Api\V2\ClubpointController@get_list')->middleware('auth:sanctum');
        Route::post('clubpoint/convert-into-wallet', 'App\Http\Controllers\Api\V2\ClubpointController@convert_into_wallet')->middleware('auth:sanctum');

        Route::get('refund-request/get-list', 'App\Http\Controllers\Api\V2\RefundRequestController@get_list')->middleware('auth:sanctum');
        Route::post('refund-request/send', 'App\Http\Controllers\Api\V2\RefundRequestController@send')->middleware('auth:sanctum');

        Route::get('bkash/begin', 'App\Http\Controllers\Api\V2\BkashController@begin')->middleware('auth:sanctum');
        Route::get('nagad/begin', 'App\Http\Controllers\Api\V2\NagadController@begin')->middleware('auth:sanctum');
        Route::post('payments/pay/wallet', fn () => response()->json([
            'success' => false,
            'message' => 'Wallet payment is not available. Use Razorpay or PhonePe.',
        ], 422))->middleware('auth:sanctum');
        Route::post('payments/pay/cod', fn () => response()->json([
            'success' => false,
            'message' => 'Cash on Delivery is not available. Use Razorpay or PhonePe.',
        ], 422))->middleware('auth:sanctum');
        Route::post('payments/pay/manual', fn () => response()->json([
            'success' => false,
            'message' => 'Manual/offline payment is not available. Use Razorpay or PhonePe.',
        ], 422))->middleware('auth:sanctum');
        Route::post('order/store', [OrderController::class, 'store'])->middleware('auth:sanctum');
        Route::post('checkout/validate', [StorefrontCheckoutBridgeController::class, 'validateCheckout'])->middleware('auth:sanctum');
        Route::post('checkout/summary', [StorefrontCheckoutBridgeController::class, 'summary'])->middleware('auth:sanctum');
        Route::post('payments/intent', [StorefrontCheckoutBridgeController::class, 'intent'])->middleware('auth:sanctum');
        Route::post('payments/confirm', [StorefrontCheckoutBridgeController::class, 'confirm'])->middleware('auth:sanctum');

        Route::get('order/cancel/{id}', 'App\Http\Controllers\Api\V2\OrderController@order_cancel')->middleware('auth:sanctum');

        Route::get('profile/counters', 'App\Http\Controllers\Api\V2\ProfileController@counters')->middleware('auth:sanctum');

        Route::post('profile/update', 'App\Http\Controllers\Api\V2\ProfileController@update')->middleware('auth:sanctum');

        Route::post('profile/update-device-token', 'App\Http\Controllers\Api\V2\ProfileController@update_device_token')->middleware('auth:sanctum');
        Route::post('profile/update-image', 'App\Http\Controllers\Api\V2\ProfileController@updateImage')->middleware('auth:sanctum');
        Route::post('profile/image-upload', 'App\Http\Controllers\Api\V2\ProfileController@imageUpload')->middleware('auth:sanctum');
        Route::post('profile/check-phone-and-email', 'App\Http\Controllers\Api\V2\ProfileController@checkIfPhoneAndEmailAvailable')->middleware('auth:sanctum');

        Route::post('file/image-upload', 'App\Http\Controllers\Api\V2\FileController@imageUpload')->middleware('auth:sanctum');
        Route::get('file-all', 'App\Http\Controllers\Api\V2\FileController@index')->middleware('auth:sanctum');
        Route::post('file/upload', 'App\Http\Controllers\Api\V2\AizUploadController@upload')->middleware('auth:sanctum');

        Route::get('wallet/balance', [WalletController::class, 'balance'])->middleware('auth:sanctum');
        Route::post('wallet/offline-recharge', [WalletController::class, 'offline_recharge'])->middleware('auth:sanctum');





        Route::controller(CustomerPackageController::class)->group(function () {
            Route::post('offline/packages-payment', 'purchase_package_offline')->middleware('auth:sanctum');
            Route::post('free/packages-payment', 'purchase_package_free')->middleware('auth:sanctum');
        });

        // Notification
        Route::controller(NotificationController::class)->group(function () {
            Route::get('all-notification', 'allNotification')->middleware('auth:sanctum');
            Route::get('unread-notifications', 'unreadNotifications')->middleware('auth:sanctum');
            Route::post('notifications/bulk-delete', 'bulkDelete')->middleware('auth:sanctum');
            Route::get('notifications/mark-as-read', 'notificationMarkAsRead')->middleware('auth:sanctum');
        });

        Route::get('products/last-viewed', [ProductController::class, 'lastViewedProducts'])->middleware('auth:sanctum');
    });

    //end user bann
    Route::controller(OnlinePaymentController::class)->group(function () {
        Route::get('online-pay/init', 'init')->middleware('auth:sanctum');
        Route::get('online-pay/success', 'paymentSuccess');
        Route::get('online-pay/done', 'paymentDone');
        Route::get('online-pay/failed', 'paymentFailed');
    });

    Route::get('get-search-suggestions', [SearchSuggestionController::class, 'getList']);
    Route::get('languages', [LanguageController::class, 'getList']);

    Route::controller(CustomerProductController::class)->group(function () {
        Route::get('classified/all', 'all');
        Route::get('classified/related-products/{slug}', 'relatedProducts');
        Route::get('classified/product-details/{slug}', 'productDetails');
    });



    Route::get('seller/top', 'App\Http\Controllers\Api\V2\SellerController@topSellers');

    Route::apiResource('banners', 'App\Http\Controllers\Api\V2\BannerController')->only('index');

    Route::get('brands/top', 'App\Http\Controllers\Api\V2\BrandController@top');
    Route::get('all-brands', [ProductController::class, 'getBrands'])->name('allBrands');
    Route::apiResource('brands', 'App\Http\Controllers\Api\V2\BrandController')->only('index');

    Route::apiResource('business-settings', 'App\Http\Controllers\Api\V2\BusinessSettingController')->only('index');
    Route::get('storefront/settings', [StorefrontContentController::class, 'settings']);
    Route::get('pages/{slug}', [StorefrontContentController::class, 'page']);
    Route::get('faqs', [StorefrontContentController::class, 'faqs']);
    Route::post('contact', [StorefrontContentController::class, 'contact']);

    Route::get('category/info/{slug}', 'App\Http\Controllers\Api\V2\CategoryController@info');
    Route::get('categories/featured', 'App\Http\Controllers\Api\V2\CategoryController@featured');
    Route::get('categories/home', 'App\Http\Controllers\Api\V2\CategoryController@home');
    Route::get('categories/top', 'App\Http\Controllers\Api\V2\CategoryController@top');
    Route::apiResource('categories', 'App\Http\Controllers\Api\V2\CategoryController')->only('index');
    Route::get('sub-categories/{id}', 'App\Http\Controllers\Api\V2\SubCategoryController@index')->name('subCategories.index');

    Route::apiResource('colors', 'App\Http\Controllers\Api\V2\ColorController')->only('index');

    Route::apiResource('currencies', 'App\Http\Controllers\Api\V2\CurrencyController')->only('index');

    Route::apiResource('customers', 'App\Http\Controllers\Api\V2\CustomerController')->only('show');

    Route::apiResource('general-settings', 'App\Http\Controllers\Api\V2\GeneralSettingController')->only('index');

    Route::apiResource('home-categories', 'App\Http\Controllers\Api\V2\HomeCategoryController')->only('index');



    Route::get('filter/categories', 'App\Http\Controllers\Api\V2\FilterController@categories');
    Route::get('filter/brands', 'App\Http\Controllers\Api\V2\FilterController@brands');

    Route::get('products/inhouse', 'App\Http\Controllers\Api\V2\ProductController@inhouse');
    Route::get('products/seller/{id}', 'App\Http\Controllers\Api\V2\ProductController@seller');
    Route::get('products/category/{slug}', 'App\Http\Controllers\Api\V2\ProductController@categoryProducts')->name('api.products.category');
    Route::get('products/sub-category/{id}', 'App\Http\Controllers\Api\V2\ProductController@subCategory')->name('products.subCategory');
    Route::get('products/sub-sub-category/{id}', 'App\Http\Controllers\Api\V2\ProductController@subSubCategory')->name('products.subSubCategory');
    Route::get('products/brand/{slug}', 'App\Http\Controllers\Api\V2\ProductController@brand')->name('api.products.brand');
    Route::get('products/todays-deal', 'App\Http\Controllers\Api\V2\ProductController@todaysDeal');
    Route::get('products/featured', 'App\Http\Controllers\Api\V2\ProductController@featured');
    Route::get('products/best-seller', 'App\Http\Controllers\Api\V2\ProductController@bestSeller');
    Route::get('products/top-from-seller/{slug}', 'App\Http\Controllers\Api\V2\ProductController@topFromSeller');
    Route::get('products/frequently-bought/{slug}', 'App\Http\Controllers\Api\V2\ProductController@frequentlyBought')->name('products.frequently_bought');

    Route::get('products/featured-from-seller/{id}', 'App\Http\Controllers\Api\V2\ProductController@newFromSeller')->name('products.featuredromSeller');
    Route::get('products/search', 'App\Http\Controllers\Api\V2\ProductController@search');
    Route::post('products/variant/price', 'App\Http\Controllers\Api\V2\ProductController@getPrice');
    Route::get('products/digital', 'App\Http\Controllers\Api\V2\ProductController@digital')->name('products.digital');
    Route::apiResource('products', 'App\Http\Controllers\Api\V2\ProductController')->except(['store', 'update', 'destroy']);

    Route::get('products/{slug}/{user_id}',  'App\Http\Controllers\Api\V2\ProductController@product_details');


    //Use this route outside of auth because initialy we created outside of auth we do not need auth initialy
    //We can't change it now because we didn't send token in header from mobile app.
    //We need the upload update Flutter app then we will write it in auth middleware.
    Route::controller(CustomerPackageController::class)->group(function () {
        Route::get("customer-packages", "customer_packages_list");
    });


    Route::get('reviews/product/{id}', 'App\Http\Controllers\Api\V2\ReviewController@index')->name('api.reviews.index');


    Route::get('shops/details/{id}', 'App\Http\Controllers\Api\V2\ShopController@info')->name('shops.info');
    Route::get('shops/products/all/{id}', 'App\Http\Controllers\Api\V2\ShopController@allProducts')->name('shops.allProducts');
    Route::get('shops/products/top/{id}', 'App\Http\Controllers\Api\V2\ShopController@topSellingProducts')->name('shops.topSellingProducts');
    Route::get('shops/products/featured/{id}', 'App\Http\Controllers\Api\V2\ShopController@featuredProducts')->name('shops.featuredProducts');
    Route::get('shops/products/new/{id}', 'App\Http\Controllers\Api\V2\ShopController@newProducts')->name('shops.newProducts');
    Route::get('shops/brands/{id}', 'App\Http\Controllers\Api\V2\ShopController@brands')->name('shops.brands');
    Route::apiResource('shops', 'App\Http\Controllers\Api\V2\ShopController')->only('index');

    Route::get('sliders', 'App\Http\Controllers\Api\V2\SliderController@sliders');
    Route::get('banners-one', 'App\Http\Controllers\Api\V2\SliderController@bannerOne');
    Route::get('banners-two', 'App\Http\Controllers\Api\V2\SliderController@bannerTwo');
    Route::get('banners-three', 'App\Http\Controllers\Api\V2\SliderController@bannerThree');

    Route::get('policies/seller', 'App\Http\Controllers\Api\V2\PolicyController@sellerPolicy')->name('policies.seller');
    Route::get('policies/support', 'App\Http\Controllers\Api\V2\PolicyController@supportPolicy')->name('policies.support');
    Route::get('policies/return', 'App\Http\Controllers\Api\V2\PolicyController@returnPolicy')->name('policies.return');

    Route::post('get-user-by-access_token', 'App\Http\Controllers\Api\V2\UserController@getUserInfoByAccessToken');

    Route::get('cities', 'App\Http\Controllers\Api\V2\AddressController@getCities');
    Route::get('states', 'App\Http\Controllers\Api\V2\AddressController@getStates');
    Route::get('countries', 'App\Http\Controllers\Api\V2\AddressController@getCountries');

    Route::get('areas-by-city/{city_id}', 'App\Http\Controllers\Api\V2\AddressController@getAreasByCity');
    Route::get('cities-by-state/{state_id}', 'App\Http\Controllers\Api\V2\AddressController@getCitiesByState');
    Route::get('cities-by-country/{country_id}', 'App\Http\Controllers\Api\V2\AddressController@getCitiesByCountry');
    Route::get('states-by-country/{country_id}', 'App\Http\Controllers\Api\V2\AddressController@getStatesByCountry');


    // Route::post('coupon/apply', 'App\Http\Controllers\Api\V2\CouponController@apply')->middleware('auth:sanctum');


    Route::any('stripe', 'App\Http\Controllers\Api\V2\StripeController@stripe');
    Route::any('stripe/payment/callback', 'App\Http\Controllers\Api\V2\StripeController@callback')->name('api.stripe.callback');


    Route::any('paypal/payment/url', 'App\Http\Controllers\Api\V2\PaypalController@getUrl')->name('api.paypal.url');
    Route::any('amarpay', [AamarpayController::class, 'pay'])->name('api.amarpay.url');
    Route::any('khalti/payment/pay', 'App\Http\Controllers\Api\V2\KhaltiController@pay')->name('api.khalti.url');
    Route::any('razorpay/pay-with-razorpay', 'App\Http\Controllers\Api\V2\RazorpayController@payWithRazorpay')->name('api.razorpay.pay_with_razorpay');
    Route::any('razorpay/payment', 'App\Http\Controllers\Api\V2\RazorpayController@payment')->name('api.razorpay.payment');
    Route::any('paystack/init', 'App\Http\Controllers\Api\V2\PaystackController@init')->name('api.paystack.init');
    Route::any('iyzico/init', 'App\Http\Controllers\Api\V2\IyzicoController@init')->name('api.iyzico.init');

    Route::get('bkash/api/webpage/{token}/{amount}', 'App\Http\Controllers\Api\V2\BkashController@webpage')->name('api.bkash.webpage');


    Route::any('bkash/api/execute/{token}', 'App\Http\Controllers\Api\V2\BkashController@execute')->name('api.bkash.execute');
    Route::any('bkash/api/fail', 'App\Http\Controllers\Api\V2\BkashController@fail')->name('api.bkash.fail');
    Route::post('bkash/api/process', 'App\Http\Controllers\Api\V2\BkashController@process')->name('api.bkash.process');


    Route::any('nagad/verify/{payment_type}', 'App\Http\Controllers\Api\V2\NagadController@verify')->name('app.nagad.callback_url');
    Route::post('nagad/process', 'App\Http\Controllers\Api\V2\NagadController@process');

    Route::get('sslcommerz/begin', 'App\Http\Controllers\Api\V2\SslCommerzController@begin');

    Route::any('flutterwave/payment/url', 'App\Http\Controllers\Api\V2\FlutterwaveController@getUrl')->name('api.flutterwave.url');

    Route::any('paytm/payment/pay', 'App\Http\Controllers\Api\V2\PaytmController@pay')->name('api.paytm.pay');
    Route::get('instamojo/pay', 'App\Http\Controllers\Api\V2\InstamojoController@pay');

    Route::get('payfast/initiate', 'App\Http\Controllers\Api\V2\PayfastController@pay');

    Route::get('/myfatoorah/initiate', 'App\Http\Controllers\Api\V2\MyfatoorahController@pay');

    Route::get('phonepe/payment/pay', 'App\Http\Controllers\Api\V2\PhonepeController@pay');
    Route::get('/phonepe-credentials', 'App\Http\Controllers\Api\V2\PhonepeController@getPhonePayCredentials')->name('api.phonepe.credentials');

    Route::post('offline/payment/submit', 'App\Http\Controllers\Api\V2\OfflinePaymentController@submit')->name('api.offline.payment.submit');


    Route::controller(BlogController::class)->group(function () {
        Route::get('blog-list', 'blog_list');
        Route::get('blog-details/{slug}', 'blog_details');
    });

    // Route::controller(WholesaleProductController::class)->group(function () {
    //     Route::get('/wholesale/all-products', 'all_wholesale_products')->name('wholesale_products.all');
    // });

    Route::get('flash-deals', 'App\Http\Controllers\Api\V2\FlashDealController@index');
    Route::get('flash-deals-banners', 'App\Http\Controllers\Api\V2\FlashDealController@banners');
    Route::get('flash-deals/info/{slug}', 'App\Http\Controllers\Api\V2\FlashDealController@info');
    Route::get('flash-deal-products/{id}', 'App\Http\Controllers\Api\V2\FlashDealController@products');

    //Addon list
    Route::get('addon-list', 'App\Http\Controllers\Api\V2\ConfigController@addon_list');
    //Activated social login list
    Route::get('activated-social-login', 'App\Http\Controllers\Api\V2\ConfigController@activated_social_login');

    //Business Sttings list
    Route::post('business-settings', 'App\Http\Controllers\Api\V2\ConfigController@business_settings');
    //Pickup Point list
    Route::get('pickup-list', 'App\Http\Controllers\Api\V2\ShippingController@pickup_list');


    Route::withoutMiddleware([EnsureSystemKey::class])->group(function () {
        Route::controller(WholesaleProductController::class)->group(function () {
            Route::get('/wholesale/all-products', 'all_wholesale_products')->name('wholesale_products.all');
            Route::get('/wholesale/product-details/{id}', 'wholesale_product_details')->name('wholesale_products.show');
        });

        Route::get('google-recaptcha', function () {
            return view("frontend.google_recaptcha.app_recaptcha");
        });
        Route::any('paypal/payment/done', 'App\Http\Controllers\Api\V2\PaypalController@getDone')->name('api.paypal.done');
        Route::any('paypal/payment/cancel', 'App\Http\Controllers\Api\V2\PaypalController@getCancel')->name('api.paypal.cancel');
        Route::any('amarpay/success', [AamarpayController::class, 'success'])->name('api.amarpay.success');
        Route::any('amarpay/cancel', [AamarpayController::class, 'fail'])->name('api.amarpay.cancel');
        Route::any('khalti/payment/success', 'App\Http\Controllers\Api\V2\KhaltiController@paymentDone')->name('api.khalti.success');
        Route::any('khalti/payment/cancel', 'App\Http\Controllers\Api\V2\KhaltiController@getCancel')->name('api.khalti.cancel');
        Route::any('razorpay/success', 'App\Http\Controllers\Api\V2\RazorpayController@payment_success')->name('api.razorpay.success');
        Route::post('paystack/success', 'App\Http\Controllers\Api\V2\PaystackController@payment_success')->name('api.paystack.success');
        Route::any('iyzico/callback', 'App\Http\Controllers\Api\V2\IyzicoController@callback')->name('api.iyzico.callback');
        Route::post('iyzico/success', 'App\Http\Controllers\Api\V2\IyzicoController@payment_success')->name('api.iyzico.success');

        Route::any('bkash/api/callback', 'App\Http\Controllers\Api\V2\BkashController@callback')->name('api.bkash.callback');
        Route::post('bkash/api/success', 'App\Http\Controllers\Api\V2\BkashController@payment_success')->name('api.bkash.success');
        Route::any('bkash/api/checkout/{token}/{amount}', 'App\Http\Controllers\Api\V2\BkashController@checkout')->name('api.bkash.checkout');

        Route::any('stripe/create-checkout-session', 'App\Http\Controllers\Api\V2\StripeController@create_checkout_session')->name('api.stripe.get_token');
        Route::get('stripe/success', 'App\Http\Controllers\Api\V2\StripeController@payment_success');
        Route::any('stripe/cancel', 'App\Http\Controllers\Api\V2\StripeController@cancel')->name('api.stripe.cancel');

        Route::any('sslcommerz/success', 'App\Http\Controllers\Api\V2\SslCommerzController@payment_success');
        Route::any('sslcommerz/fail', 'App\Http\Controllers\Api\V2\SslCommerzController@payment_fail');
        Route::any('sslcommerz/cancel', 'App\Http\Controllers\Api\V2\SslCommerzController@payment_cancel');
        Route::any('flutterwave/payment/callback', 'App\Http\Controllers\Api\V2\FlutterwaveController@callback')->name('api.flutterwave.callback');
        Route::any('paytm/payment/callback', 'App\Http\Controllers\Api\V2\PaytmController@callback')->name('api.paytm.callback');
        Route::get('instamojo/success', 'App\Http\Controllers\Api\V2\InstamojoController@success');
        Route::get('instamojo/failed', 'App\Http\Controllers\Api\V2\InstamojoController@failed');

        // Cybersource
        Route::post('cyber-source/payment/pay', 'App\Http\Controllers\Api\V2\CybersourceController@pay')->name('cybersource.pay');
        Route::any('cyber-source/payment/process', 'App\Http\Controllers\Api\V2\CybersourceController@process')->name('cybersource.process');
        Route::any('cyber-source/payment/callback', 'App\Http\Controllers\Api\V2\CybersourceController@callback')->name('cybersource.callback');
        Route::any('cyber-source/payment/webhook', 'App\Http\Controllers\Api\V2\CybersourceController@webhook')->name('cybersource.webhook');
        
        //Payfast routes <starts>
        Route::controller(PayfastController::class)->group(function () {
            Route::any('/payfast/notify', 'payfast_notify')->name('api.payfast.notify');
            Route::any('/payfast/return', 'payfast_return')->name('api.payfast.return');
            Route::any('/payfast/cancel', 'payfast_cancel')->name('api.payfast.cancel');
        });
        //Payfast routes <ends>

        Route::get('/myfatoorah/callback', 'App\Http\Controllers\Api\V2\MyfatoorahController@callback')->name('api.myfatoorah.callback');


        Route::any('/phonepe/redirecturl', 'App\Http\Controllers\Api\V2\PhonepeController@phonepe_redirecturl')->name('api.phonepe.redirecturl');
        Route::any('/phonepe/callbackUrl', 'App\Http\Controllers\Api\V2\PhonepeController@phonepe_callbackUrl')->name('api.phonepe.callbackUrl');
    });

    // customer file upload
    Route::controller(CustomerFileUploadController::class)->middleware('auth:sanctum')->group(function () {
        Route::post('file/upload', 'upload');
        Route::get('file/all', 'index');
        Route::get('file/delete/{id}', 'destroy');
    });
});

Route::withoutMiddleware([EnsureSystemKey::class])->group(function () {
Route::group(['prefix' => 'admin', 'middleware' => ['auth:sanctum']], function () {
    // ── Existing Product / Page / Post / FAQ routes ──
    Route::get('products', [AdminBridgeController::class, 'productsIndex']);
    Route::post('products', [AdminBridgeController::class, 'productsStore']);
    Route::get('products/{id}', [AdminBridgeController::class, 'productsShow']);
    Route::put('products/{id}', [AdminBridgeController::class, 'productsUpdate']);
    Route::delete('products/{id}', [AdminBridgeController::class, 'productsDestroy']);
    Route::post('products/{id}/duplicate', [AdminBridgeController::class, 'productsDuplicate']);
    Route::post('products/import', [AdminBridgeController::class, 'productsImport']);

    Route::get('pages', [AdminBridgeController::class, 'pagesIndex']);
    Route::post('pages', [AdminBridgeController::class, 'pagesStore']);
    Route::put('pages/{id}', [AdminBridgeController::class, 'pagesUpdate']);
    Route::delete('pages/{id}', [AdminBridgeController::class, 'pagesDestroy']);

    Route::get('posts', [AdminBridgeController::class, 'postsIndex']);
    Route::post('posts', [AdminBridgeController::class, 'postsStore']);
    Route::put('posts/{id}', [AdminBridgeController::class, 'postsUpdate']);
    Route::delete('posts/{id}', [AdminBridgeController::class, 'postsDestroy']);

    Route::get('faqs', [AdminBridgeController::class, 'faqsIndex']);
    Route::post('faqs', [AdminBridgeController::class, 'faqsStore']);
    Route::put('faqs/{id}', [AdminBridgeController::class, 'faqsUpdate']);
    Route::delete('faqs/{id}', [AdminBridgeController::class, 'faqsDestroy']);

    Route::get('payment-methods', [AdminBridgeController::class, 'paymentMethods']);
    Route::put('payment-methods/{code}', [AdminBridgeController::class, 'paymentMethodUpdate']);
    Route::get('payment-methods/razorpay/health', [AdminBridgeController::class, 'razorpayHealth']);

    // ── Dashboard ──
    Route::get('dashboard/summary', [Admin\AdminDashboardController::class, 'summary']);

    // ── Orders ──
    Route::get('orders', [Admin\AdminOrderController::class, 'index']);
    Route::get('orders/oms-summary', [Admin\AdminOrderController::class, 'omsSummary']);
    Route::get('orders/{id}', [Admin\AdminOrderController::class, 'show']);
    Route::get('orders/{id}/tracking', [Admin\AdminOrderController::class, 'tracking']);
    Route::put('orders/{id}/status', [Admin\AdminOrderController::class, 'updateStatus']);
    Route::post('orders/{id}/mark-collected', [Admin\AdminOrderController::class, 'markCollected']);
    Route::post('orders/export', [Admin\AdminOrderController::class, 'exportOrders']);
    Route::post('orders/{id}/shipment', [Admin\AdminOrderController::class, 'createShipment']);
    Route::get('orders/{id}/invoice', [Admin\AdminOrderController::class, 'invoice']);

    // ── Shipments ──
    Route::get('shipments', [Admin\AdminOrderController::class, 'shipmentsIndex']);
    Route::get('shipments/{id}', [Admin\AdminOrderController::class, 'shipmentsShow']);
    Route::put('shipments/{id}', [Admin\AdminOrderController::class, 'shipmentsUpdate']);
    Route::post('shipments/{id}/events', [Admin\AdminOrderController::class, 'shipmentsAddEvent']);

    // ── Returns ──
    Route::get('returns', [Admin\AdminOrderController::class, 'returnsIndex']);
    Route::get('returns/{id}', [Admin\AdminOrderController::class, 'returnsShow']);
    Route::put('returns/{id}', [Admin\AdminOrderController::class, 'returnsUpdate']);

    // ── Customers ──
    Route::get('customers', [Admin\AdminCustomerController::class, 'index']);
    Route::get('customers/{id}', [Admin\AdminCustomerController::class, 'show']);
    Route::put('customers/{id}', [Admin\AdminCustomerController::class, 'update']);
    Route::put('customers/{id}/status', [Admin\AdminCustomerController::class, 'toggleStatus']);
    Route::post('customers/{id}/ban', [Admin\AdminCustomerController::class, 'ban']);
    Route::post('customers/{id}/unban', [Admin\AdminCustomerController::class, 'unban']);
    Route::put('customers/{id}/suspicious', [Admin\AdminCustomerController::class, 'markSuspicious']);
    Route::post('customers/bulk-delete', [Admin\AdminCustomerController::class, 'bulkDelete']);
    Route::post('customers/export', [Admin\AdminCustomerController::class, 'export']);

    // ── Categories ──
    Route::get('categories', [Admin\AdminCatalogController::class, 'categoriesIndex']);
    Route::post('categories', [Admin\AdminCatalogController::class, 'categoriesStore']);
    Route::put('categories/{id}', [Admin\AdminCatalogController::class, 'categoriesUpdate']);
    Route::delete('categories/{id}', [Admin\AdminCatalogController::class, 'categoriesDestroy']);

    // ── Brands ──
    Route::get('brands', [Admin\AdminCatalogController::class, 'brandsIndex']);
    Route::post('brands', [Admin\AdminCatalogController::class, 'brandsStore']);
    Route::put('brands/{id}', [Admin\AdminCatalogController::class, 'brandsUpdate']);
    Route::delete('brands/{id}', [Admin\AdminCatalogController::class, 'brandsDestroy']);

    // ── Attributes ──
    Route::get('attributes', [Admin\AdminCatalogController::class, 'attributesIndex']);
    Route::post('attributes', [Admin\AdminCatalogController::class, 'attributesStore']);
    Route::put('attributes/{id}', [Admin\AdminCatalogController::class, 'attributesUpdate']);
    Route::delete('attributes/{id}', [Admin\AdminCatalogController::class, 'attributesDestroy']);

    // ── Colors ──
    Route::get('colors', [Admin\AdminCatalogController::class, 'colorsIndex']);
    Route::post('colors', [Admin\AdminCatalogController::class, 'colorsStore']);
    Route::put('colors/{id}', [Admin\AdminCatalogController::class, 'colorsUpdate']);
    Route::delete('colors/{id}', [Admin\AdminCatalogController::class, 'colorsDestroy']);

    // ── Size Charts ──
    Route::get('size-charts', [Admin\AdminCatalogController::class, 'sizeChartsIndex']);
    Route::post('size-charts', [Admin\AdminCatalogController::class, 'sizeChartsStore']);
    Route::put('size-charts/{id}', [Admin\AdminCatalogController::class, 'sizeChartsUpdate']);
    Route::delete('size-charts/{id}', [Admin\AdminCatalogController::class, 'sizeChartsDestroy']);

    // ── Warranties ──
    Route::get('warranties', [Admin\AdminCatalogController::class, 'warrantiesIndex']);
    Route::post('warranties', [Admin\AdminCatalogController::class, 'warrantiesStore']);
    Route::put('warranties/{id}', [Admin\AdminCatalogController::class, 'warrantiesUpdate']);
    Route::delete('warranties/{id}', [Admin\AdminCatalogController::class, 'warrantiesDestroy']);

    // ── Product Q&A ──
    Route::get('product-queries', [Admin\AdminCatalogController::class, 'productQueriesIndex']);
    Route::put('product-queries/{id}/answer', [Admin\AdminCatalogController::class, 'productQueryAnswer']);
    Route::put('product-queries/{id}/reject', [Admin\AdminCatalogController::class, 'productQueryReject']);
    Route::delete('product-queries/{id}', [Admin\AdminCatalogController::class, 'productQueryDestroy']);

    // ── Cross-Sells ──
    Route::get('products/{id}/cross-sells', [Admin\AdminCatalogController::class, 'crossSells']);
    Route::put('products/{id}/cross-sells', [Admin\AdminCatalogController::class, 'crossSellsSync']);

    // ── Reviews ──
    Route::get('reviews', [Admin\AdminReviewController::class, 'index']);
    Route::put('reviews/{id}/status', [Admin\AdminReviewController::class, 'updateStatus']);
    Route::delete('reviews/{id}', [Admin\AdminReviewController::class, 'destroy']);
    Route::post('reviews/custom', [Admin\AdminReviewController::class, 'createCustom']);
    Route::get('reviews/statistics', [Admin\AdminReviewController::class, 'statistics']);
    Route::post('reviews/bulk-status', [Admin\AdminReviewController::class, 'bulkUpdateStatus']);
    Route::post('reviews/bulk-delete', [Admin\AdminReviewController::class, 'bulkDelete']);
    Route::post('reviews/export', [Admin\AdminReviewController::class, 'export']);

    // ── Inventory ──
    Route::get('inventory', [Admin\AdminInventoryController::class, 'index']);
    Route::put('inventory/{id}', [Admin\AdminInventoryController::class, 'update']);

    // ── Analytics ──
    Route::get('analytics/revenue', [Admin\AdminAnalyticsController::class, 'revenue']);
    Route::post('analytics/export', [Admin\AdminAnalyticsController::class, 'exportAnalytics']);
    Route::get('analytics/stock', [Admin\AdminAnalyticsController::class, 'stockReport']);
    Route::get('analytics/wishlist', [Admin\AdminAnalyticsController::class, 'wishlistReport']);
    Route::get('analytics/categories', [Admin\AdminAnalyticsController::class, 'categoryReport']);

    // ── Exports ──
    Route::get('exports/{id}', [Admin\AdminAnalyticsController::class, 'exportStatus']);

    // ── Payments ──
    Route::get('payments', [Admin\AdminAnalyticsController::class, 'payments']);

    // ── Media ──
    Route::get('media', [Admin\AdminMediaController::class, 'index']);
    Route::post('media', [Admin\AdminMediaController::class, 'store']);
    Route::get('media/stats', [Admin\AdminMediaController::class, 'stats']);
    Route::get('media/{id}', [Admin\AdminMediaController::class, 'show']);
    Route::put('media/{id}', [Admin\AdminMediaController::class, 'update']);
    Route::delete('media/{id}', [Admin\AdminMediaController::class, 'destroy']);
    Route::post('media/bulk-delete', [Admin\AdminMediaController::class, 'bulkDelete']);

    // ── Settings ──
    Route::get('settings', [Admin\AdminSettingsController::class, 'index']);
    Route::put('settings', [Admin\AdminSettingsController::class, 'update']);

    // ── Modules ──
    Route::get('modules', [Admin\AdminModuleController::class, 'index']);
    Route::post('modules', [Admin\AdminModuleController::class, 'store']);
    Route::get('modules/{id}', [Admin\AdminModuleController::class, 'show']);
    Route::put('modules/{id}', [Admin\AdminModuleController::class, 'update']);
    Route::put('modules/{id}/toggle', [Admin\AdminModuleController::class, 'toggle']);
    Route::post('modules/validate-license', [Admin\AdminModuleController::class, 'validateLicense']);
    Route::put('modules/{id}/credentials', [Admin\AdminModuleController::class, 'credentials']);
    Route::get('modules/{id}/health', [Admin\AdminModuleController::class, 'health']);
    Route::post('modules/activation-request', [Admin\AdminModuleController::class, 'activationRequest']);

    // ── CMS: Banners ──
    Route::get('banners', [Admin\AdminCmsController::class, 'bannersIndex']);
    Route::post('banners', [Admin\AdminCmsController::class, 'bannersStore']);
    Route::put('banners/{id}', [Admin\AdminCmsController::class, 'bannersUpdate']);
    Route::delete('banners/{id}', [Admin\AdminCmsController::class, 'bannersDestroy']);

    // ── CMS: Alerts ──
    Route::get('alerts', [Admin\AdminCmsController::class, 'alertsIndex']);
    Route::post('alerts', [Admin\AdminCmsController::class, 'alertsStore']);
    Route::put('alerts/{id}', [Admin\AdminCmsController::class, 'alertsUpdate']);
    Route::delete('alerts/{id}', [Admin\AdminCmsController::class, 'alertsDestroy']);

    // ── CMS: Popups ──
    Route::get('popups', [Admin\AdminCmsController::class, 'popupsIndex']);
    Route::post('popups', [Admin\AdminCmsController::class, 'popupsStore']);
    Route::put('popups/{id}', [Admin\AdminCmsController::class, 'popupsUpdate']);
    Route::delete('popups/{id}', [Admin\AdminCmsController::class, 'popupsDestroy']);

    // ── CMS: Contact Messages ──
    Route::get('contact-messages', [Admin\AdminCmsController::class, 'contactMessagesIndex']);
    Route::put('contact-messages/{id}/read', [Admin\AdminCmsController::class, 'contactMessageRead']);
    Route::delete('contact-messages/{id}', [Admin\AdminCmsController::class, 'contactMessageDestroy']);

    // ── CMS: Subscribers ──
    Route::get('subscribers', [Admin\AdminCmsController::class, 'subscribersIndex']);
    Route::put('subscribers/{id}/toggle', [Admin\AdminCmsController::class, 'subscriberToggle']);
    Route::delete('subscribers/{id}', [Admin\AdminCmsController::class, 'subscriberDestroy']);

    // ── CMS: Notification Templates ──
    Route::get('notification-templates', [Admin\AdminCmsController::class, 'notificationTemplatesIndex']);
    Route::put('notification-templates/{id}', [Admin\AdminCmsController::class, 'notificationTemplateUpdate']);
    Route::put('notification-templates/{id}/toggle', [Admin\AdminCmsController::class, 'notificationTemplateToggle']);
    Route::get('notification-templates/{id}/preview', [Admin\AdminCmsController::class, 'notificationTemplatePreview']);
    Route::post('notification-templates/test-smtp', [Admin\AdminCmsController::class, 'testSmtp']);

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
