<?php

namespace Tests\Feature\Api\V2;

use Illuminate\Http\Request;
use Illuminate\Routing\Route as IlluminateRoute;
use Tests\TestCase;

class StorefrontRouteBindingsTest extends TestCase
{
    /**
     * @dataProvider storefrontRouteProvider
     */
    public function test_storefront_routes_bind_to_existing_controller_methods(
        string $httpMethod,
        string $uri,
        string $expectedClass,
        string $expectedMethod
    ): void {
        $route = app('router')->getRoutes()->match(Request::create($uri, $httpMethod));

        $this->assertRouteUsesAction($route, $expectedClass, $expectedMethod);
    }

    public static function storefrontRouteProvider(): array
    {
        return [
            'product detail' => ['GET', '/api/v2/products/test-product/0', \App\Http\Controllers\Api\V2\ProductController::class, 'product_details'],
            'related products' => ['GET', '/api/v2/products/related/1', \App\Http\Controllers\Api\V2\ProductController::class, 'relatedProducts'],
            'review submit' => ['POST', '/api/v2/reviews/submit', \App\Http\Controllers\Api\V2\ReviewController::class, 'submit'],
            'checkout validate' => ['POST', '/api/v2/checkout/validate', \App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController::class, 'validateCheckout'],
            'checkout summary' => ['POST', '/api/v2/checkout/summary', \App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController::class, 'summary'],
            'checkout shipping rates' => ['POST', '/api/v2/checkout/shipping-rates', \App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController::class, 'shippingRates'],
            'payment intent' => ['POST', '/api/v2/payments/intent', \App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController::class, 'intent'],
            'payment confirm' => ['POST', '/api/v2/payments/confirm', \App\Http\Controllers\Api\V2\StorefrontCheckoutBridgeController::class, 'confirm'],
            'payment types' => ['GET', '/api/v2/payment-types', \App\Http\Controllers\Api\V2\PaymentTypesController::class, 'getList'],
            'guest checkout validate' => ['POST', '/api/v2/guest-checkout/validate', \App\Http\Controllers\Api\V2\GuestCheckoutController::class, 'validateCheckout'],
            'guest checkout summary' => ['POST', '/api/v2/guest-checkout/summary', \App\Http\Controllers\Api\V2\GuestCheckoutController::class, 'summary'],
            'guest payment intent' => ['POST', '/api/v2/guest-checkout/payment-intent', \App\Http\Controllers\Api\V2\GuestCheckoutController::class, 'paymentIntent'],
            'guest payment confirm' => ['POST', '/api/v2/guest-checkout/confirm-payment', \App\Http\Controllers\Api\V2\GuestCheckoutController::class, 'confirmPayment'],
            'address list alias' => ['GET', '/api/v2/user/shipping/address', \App\Http\Controllers\Api\V2\AddressController::class, 'addresses'],
            'address create alias' => ['POST', '/api/v2/user/shipping/create', \App\Http\Controllers\Api\V2\AddressController::class, 'createShippingAddress'],
        ];
    }

    private function assertRouteUsesAction(IlluminateRoute $route, string $expectedClass, string $expectedMethod): void
    {
        $actionClass = $route->getControllerClass();
        $actionMethod = $route->getActionMethod();

        $this->assertSame($expectedClass, $actionClass);
        $this->assertSame($expectedMethod, $actionMethod);
        $this->assertTrue(class_exists($actionClass), "Expected controller class {$actionClass} to exist.");
        $this->assertTrue(method_exists($actionClass, $actionMethod), "Expected {$actionClass}::{$actionMethod} to exist.");
    }
}
