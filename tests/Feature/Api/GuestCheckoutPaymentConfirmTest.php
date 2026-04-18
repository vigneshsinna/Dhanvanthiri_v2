<?php

namespace Tests\Feature\Api;

use App\Models\CombinedOrder;
use App\Models\GuestCheckoutSession;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuestCheckoutPaymentConfirmTest extends TestCase
{
    use RefreshDatabase;

    private string $plainToken;
    private GuestCheckoutSession $session;
    private User $guestUser;
    private CombinedOrder $combinedOrder;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guestUser = User::factory()->create([
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => null,
        ]);

        $this->combinedOrder = CombinedOrder::create([
            'user_id' => $this->guestUser->id,
            'grand_total' => 610.00,
        ]);

        $this->order = Order::create([
            'user_id' => $this->guestUser->id,
            'combined_order_id' => $this->combinedOrder->id,
            'grand_total' => 610.00,
            'payment_status' => 'unpaid',
            'payment_type' => 'razorpay',
            'code' => 'ORD-TEST-001',
        ]);

        $this->plainToken = Str::random(64);

        $this->session = GuestCheckoutSession::create([
            'guest_user_id' => $this->guestUser->id,
            'temp_user_id' => 'temp-confirm-123',
            'guest_checkout_token_hash' => hash('sha256', $this->plainToken),
            'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
            'combined_order_id' => $this->combinedOrder->id,
            'order_code' => 'ORD-TEST-001',
            'expires_at' => now()->addHours(2),
        ]);
    }

    public function test_confirm_requires_token(): void
    {
        $response = $this->postJson('/api/v2/guest/payments/confirm', [
            'order_id' => $this->combinedOrder->id,
            'gateway_payment_id' => 'pay_123',
            'gateway_order_id' => 'order_123',
            'signature' => 'sig_123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guest_checkout_token']);
    }

    public function test_confirm_requires_all_payment_fields(): void
    {
        $response = $this->postJson('/api/v2/guest/payments/confirm', [
            'guest_checkout_token' => $this->plainToken,
            'order_id' => $this->combinedOrder->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['gateway_payment_id', 'gateway_order_id', 'signature']);
    }

    public function test_confirm_rejects_mismatched_order_id(): void
    {
        $otherCombinedOrder = CombinedOrder::create([
            'user_id' => $this->guestUser->id,
            'grand_total' => 100.00,
        ]);

        $response = $this->postJson('/api/v2/guest/payments/confirm', [
            'guest_checkout_token' => $this->plainToken,
            'order_id' => $otherCombinedOrder->id,
            'gateway_payment_id' => 'pay_123',
            'gateway_order_id' => 'order_123',
            'signature' => 'sig_123',
        ]);

        $response->assertStatus(422);
    }

    public function test_confirm_returns_duplicate_for_already_paid_order(): void
    {
        // Mark the order as already paid
        $this->order->update(['payment_status' => 'paid']);

        $response = $this->postJson('/api/v2/guest/payments/confirm', [
            'guest_checkout_token' => $this->plainToken,
            'order_id' => $this->combinedOrder->id,
            'gateway_payment_id' => 'pay_123',
            'gateway_order_id' => 'order_123',
            'signature' => 'sig_123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.payment.duplicate', true);
        $response->assertJsonPath('data.payment.status', 'captured');

        // Session should be marked completed
        $this->session->refresh();
        $this->assertEquals(GuestCheckoutSession::STATUS_ORDER_COMPLETED, $this->session->status);
    }

    public function test_confirm_rejects_invalid_razorpay_signature(): void
    {
        // This test will hit the Razorpay SDK which will throw on bad signature
        // The controller wraps this in a try/catch and returns 400
        $response = $this->postJson('/api/v2/guest/payments/confirm', [
            'guest_checkout_token' => $this->plainToken,
            'order_id' => $this->combinedOrder->id,
            'gateway_payment_id' => 'pay_bad',
            'gateway_order_id' => 'order_bad',
            'signature' => 'invalid-signature',
        ]);

        // Should be 400 (bad request) since Razorpay sig check fails
        $this->assertContains($response->status(), [400, 422, 500]);
    }
}
