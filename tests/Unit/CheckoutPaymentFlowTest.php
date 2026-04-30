<?php

namespace Tests\Unit;

use App\Http\Controllers\CheckoutController;
use Tests\TestCase;

class CheckoutPaymentFlowTest extends TestCase
{
    public function test_checkout_defers_cart_cleanup_for_online_gateways_until_payment_confirmation(): void
    {
        $controller = app(CheckoutController::class);

        $this->assertTrue($controller->shouldDeferCartCleanupUntilPaymentConfirmation('stripe'));
        $this->assertTrue($controller->shouldDeferCartCleanupUntilPaymentConfirmation('razorpay'));
    }

    public function test_checkout_does_not_treat_cod_as_a_supported_online_gateway(): void
    {
        $controller = app(CheckoutController::class);

        $this->assertFalse($controller->shouldDeferCartCleanupUntilPaymentConfirmation('cash_on_delivery'));
    }
}
