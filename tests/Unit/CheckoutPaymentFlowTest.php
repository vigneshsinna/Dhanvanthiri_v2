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

    public function test_checkout_keeps_immediate_cart_cleanup_for_cash_on_delivery_and_manual_payments(): void
    {
        $controller = app(CheckoutController::class);

        $this->assertFalse($controller->shouldDeferCartCleanupUntilPaymentConfirmation('cash_on_delivery'));
        $this->assertFalse($controller->shouldDeferCartCleanupUntilPaymentConfirmation('bank_transfer_receipt'));
    }
}
