<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\AizUploadController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\HeadlessStorefrontController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\Payment\AamarpayController;
use App\Http\Controllers\Payment\AuthorizenetController;
use App\Http\Controllers\Payment\BkashController;
use App\Http\Controllers\Payment\CybersourceController;
use App\Http\Controllers\Payment\InstamojoController;
use App\Http\Controllers\Payment\IyzicoController;
use App\Http\Controllers\Payment\MercadopagoController;
use App\Http\Controllers\Payment\NagadController;
use App\Http\Controllers\Payment\NgeniusController;
use App\Http\Controllers\Payment\PayhereController;
use App\Http\Controllers\Payment\PaykuController;
use App\Http\Controllers\Payment\PaymobController;
use App\Http\Controllers\Payment\PaypalController;
use App\Http\Controllers\Payment\PaystackController;
use App\Http\Controllers\Payment\RazorpayController;
use App\Http\Controllers\Payment\SslcommerzController;
use App\Http\Controllers\Payment\StripeController;
use App\Http\Controllers\Payment\TapController;
use App\Http\Controllers\Payment\VoguepayController;
use App\Http\Controllers\SizeChartController;

Route::controller(DemoController::class)->group(function () {
    Route::get('/demo/cron_1', 'cron_1');
    Route::get('/demo/cron_2', 'cron_2');
    Route::get('/convert_assets', 'convert_assets');
    Route::get('/convert_category', 'convert_category');
    Route::get('/convert_tax', 'convertTaxes');
    Route::get('/set-category', 'setCategoryToProductCategory');
    Route::get('/insert_product_variant_forcefully', 'insert_product_variant_forcefully');
    Route::get('/update_seller_id_in_orders/{id_min}/{id_max}', 'update_seller_id_in_orders');
    Route::get('/migrate_attribute_values', 'migrate_attribute_values');
});

Route::get('/refresh-csrf', fn () => csrf_token());

Route::get('/login', [HeadlessStorefrontController::class, 'shell']);
Route::get('/register', [HeadlessStorefrontController::class, 'shell']);
Route::get('/forgot-password', [HeadlessStorefrontController::class, 'shell']);
Route::get('/reset-password', [HeadlessStorefrontController::class, 'shell']);
Route::get('/super-admin', [HeadlessStorefrontController::class, 'shell']);

Route::controller(AizUploadController::class)->group(function () {
    Route::post('/aiz-uploader', 'show_uploader');
    Route::post('/aiz-uploader/upload', 'upload');
    Route::get('/aiz-uploader/get-uploaded-files', 'get_uploaded_files');
    Route::post('/aiz-uploader/get_file_by_ids', 'get_preview_files');
    Route::get('/aiz-uploader/download/{id}', 'attachment_download')->name('download_attachment');
});

Route::group(['middleware' => ['prevent-back-history', 'handle-demo-login']], function () {
    Auth::routes(['verify' => true]);
});

Route::controller(LoginController::class)->group(function () {
    Route::get('/logout', 'logout');
    Route::get('/social-login/redirect/{provider}', 'redirectToProvider')->name('social.login');
    Route::get('/social-login/{provider}/callback', 'handleProviderCallback')->name('social.callback');
    Route::post('/apple-callback', 'handleAppleCallback');
    Route::get('/account-deletion', 'account_deletion')->name('account_delete');
    Route::get('/handle-demo-login', 'handle_demo_login')->name('handleDemoLogin');
});

Route::controller(VerificationController::class)->group(function () {
    Route::get('/email/resend', 'resend')->name('verification.resend');
    Route::get('/verification-confirmation/{code}', 'verification_confirmation')->name('email.verification.confirmation');
});

Route::post('/language', [LanguageController::class, 'changeLanguage'])->name('language.change');
Route::post('/currency', [CurrencyController::class, 'changeCurrency'])->name('currency.change');
Route::get('/size-charts-show/{id}', [SizeChartController::class, 'show'])->name('size-charts-show');
Route::get('/sitemap.xml', fn () => base_path('sitemap.xml'));

Route::controller(AddressController::class)->group(function () {
    Route::post('/get-states', 'getStates')->name('get-state');
    Route::post('/get-cities', 'getCities')->name('get-city');
    Route::post('/get-area', 'getAreas')->name('get-area');
    Route::post('/get-cities-by-country', 'getCitiesByCountry')->name('get-city-by-country');
});

Route::get('invoice/{order_id}', [InvoiceController::class, 'invoice_download'])->name('invoice.download');
Route::get('/invoice-print/{order_id}', [InvoiceController::class, 'invoice_print'])->name('invoice.print');

Route::controller(PaypalController::class)->group(function () {
    Route::get('/paypal/payment/done', 'getDone')->name('payment.done');
    Route::get('/paypal/payment/cancel', 'getCancel')->name('payment.cancel');
});

Route::controller(CybersourceController::class)->group(function () {
    Route::post('/cyber-source/payment/process', 'process')->name('cybersource.process');
    Route::any('/cyber-source/payment/callback', 'callback')->name('cybersource.callback');
    Route::any('/cyber-source/payment/webhook', 'webhook')->name('cybersource.webhook');
    Route::get('/cyber-source/payment/cancel', 'getCancel')->name('cybersource.cancel');
});

Route::controller(MercadopagoController::class)->group(function () {
    Route::any('/mercadopago/payment/done', 'paymentstatus')->name('mercadopago.done');
    Route::any('/mercadopago/payment/cancel', 'callback')->name('mercadopago.cancel');
});

Route::controller(SslcommerzController::class)->group(function () {
    Route::get('/sslcommerz/pay', 'index');
    Route::post('/sslcommerz/success', 'success');
    Route::post('/sslcommerz/fail', 'fail');
    Route::post('/sslcommerz/cancel', 'cancel');
    Route::post('/sslcommerz/ipn', 'ipn');
});

Route::controller(StripeController::class)->group(function () {
    Route::get('stripe', 'stripe');
    Route::post('/stripe/create-checkout-session', 'create_checkout_session')->name('stripe.get_token');
    Route::any('/stripe/payment/callback', 'callback')->name('stripe.callback');
    Route::get('/stripe/success', 'success')->name('stripe.success');
    Route::get('/stripe/cancel', 'cancel')->name('stripe.cancel');
    Route::get('/checkout-payment-detail', 'checkout_payment_detail');
});

Route::get('/instamojo/payment/pay-success', [InstamojoController::class, 'success'])->name('instamojo.success');
Route::post('rozer/payment/pay-success', [RazorpayController::class, 'payment'])->name('payment.rozer');
Route::get('/paystack/payment/callback', [PaystackController::class, 'handleGatewayCallback']);
Route::get('/paystack/new-callback', [PaystackController::class, 'paystackNewCallback']);

Route::controller(VoguepayController::class)->group(function () {
    Route::get('/vogue-pay', 'showForm');
    Route::get('/vogue-pay/success/{id}', 'paymentSuccess');
    Route::get('/vogue-pay/callback', 'handleCallback');
    Route::get('/vogue-pay/failure/{id}', 'paymentFailure');
});

Route::any('/iyzico/payment/callback/{payment_type}/{amount?}/{payment_method?}/{combined_order_id?}/{customer_package_id?}/{seller_package_id?}', [IyzicoController::class, 'callback'])->name('iyzico.callback');

Route::controller(PayhereController::class)->group(function () {
    Route::get('/payhere/checkout/testing', 'checkout_testing')->name('payhere.checkout.testing');
    Route::get('/payhere/wallet/testing', 'wallet_testing')->name('payhere.checkout.testing');
    Route::get('/payhere/customer_package/testing', 'customer_package_testing')->name('payhere.customer_package.testing');
    Route::any('/payhere/checkout/notify', 'checkout_notify')->name('payhere.checkout.notify');
    Route::any('/payhere/checkout/return', 'checkout_return')->name('payhere.checkout.return');
    Route::any('/payhere/checkout/cancel', 'chekout_cancel')->name('payhere.checkout.cancel');
    Route::any('/payhere/order-re-payment/notify', 'orderRepaymentNotify')->name('payhere.order_re_payment.notify');
    Route::any('/payhere/order-re-payment/return', 'orderRepaymentReturn')->name('payhere.order_re_payment.return');
    Route::any('/payhere/order-re-payment/cancel', 'orderRepaymentCancel')->name('payhere.order_re_payment.cancel');
    Route::any('/payhere/wallet/notify', 'wallet_notify')->name('payhere.wallet.notify');
    Route::any('/payhere/wallet/return', 'wallet_return')->name('payhere.wallet.return');
    Route::any('/payhere/wallet/cancel', 'wallet_cancel')->name('payhere.wallet.cancel');
    Route::any('/payhere/seller_package_payment/notify', 'sellerPackageNotify')->name('payhere.seller_package_payment.notify');
    Route::any('/payhere/seller_package_payment/return', 'sellerPackageReturn')->name('payhere.seller_package_payment.return');
    Route::any('/payhere/seller_package_payment/cancel', 'sellerPackageCancel')->name('payhere.seller_package_payment.cancel');
    Route::any('/payhere/customer_package_payment/notify', 'customer_package_notify')->name('payhere.customer_package_payment.notify');
    Route::any('/payhere/customer_package_payment/return', 'customer_package_return')->name('payhere.customer_package_payment.return');
    Route::any('/payhere/customer_package_payment/cancel', 'customer_package_cancel')->name('payhere.customer_package_payment.cancel');
});

Route::controller(NgeniusController::class)->group(function () {
    Route::any('ngenius/cart_payment_callback', 'cart_payment_callback')->name('ngenius.cart_payment_callback');
    Route::any('ngenius/order_re_payment_callback', 'order_re_payment_callback')->name('ngenius.order_re_payment_callback');
    Route::any('ngenius/wallet_payment_callback', 'wallet_payment_callback')->name('ngenius.wallet_payment_callback');
    Route::any('ngenius/customer_package_payment_callback', 'customer_package_payment_callback')->name('ngenius.customer_package_payment_callback');
    Route::any('ngenius/seller_package_payment_callback', 'seller_package_payment_callback')->name('ngenius.seller_package_payment_callback');
});

Route::controller(BkashController::class)->group(function () {
    Route::get('/bkash/create-payment', 'create_payment')->name('bkash.create_payment');
    Route::get('/bkash/callback', 'callback')->name('bkash.callback');
    Route::get('/bkash/success', 'success')->name('bkash.success');
});

Route::get('/nagad/callback', [NagadController::class, 'verify'])->name('nagad.callback');

Route::controller(AamarpayController::class)->group(function () {
    Route::post('/aamarpay/success', 'success')->name('aamarpay.success');
    Route::post('/aamarpay/fail', 'fail')->name('aamarpay.fail');
});

Route::post('/dopay/online', [AuthorizenetController::class, 'handleonlinepay'])->name('dopay.online');
Route::get('/authorizenet/cardtype', [AuthorizenetController::class, 'cardType'])->name('authorizenet.cardtype');
Route::get('/payku/callback/{id}', [PaykuController::class, 'callback'])->name('payku.result');
Route::any('/paymob/callback', [PaymobController::class, 'callback']);
Route::any('/tap/callback', [TapController::class, 'callback'])->name('tap.callback');

Route::get(trim((string) config('storefront.asset_prefix', '/storefront-assets'), '/') . '/{path}', [HeadlessStorefrontController::class, 'asset'])
    ->where('path', '.*');
Route::get('/images/{path}', [HeadlessStorefrontController::class, 'image'])
    ->where('path', '.*');

Route::get('/{path?}', [HeadlessStorefrontController::class, 'shell'])
    ->where('path', '^(?!api(?:/|$)|admin(?:/|$)|sanctum(?:/|$)|_ignition(?:/|$)|storefront-assets(?:/|$)|aiz-uploader(?:/|$)).*');
