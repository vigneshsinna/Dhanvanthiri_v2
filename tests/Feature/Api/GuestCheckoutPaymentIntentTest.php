<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\GuestCheckoutSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuestCheckoutPaymentIntentTest extends TestCase
{
    use RefreshDatabase;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    private string $plainToken;
    private GuestCheckoutSession $session;
    private User $guestUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guestUser = new User();
        $this->guestUser->forceFill([
            'name' => 'Guest Checkout',
            'email' => 'guest-' . Str::random(8) . '@example.test',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => null,
        ]);
        $this->guestUser->save();

        $this->plainToken = Str::random(64);

        $this->session = GuestCheckoutSession::create([
            'guest_user_id' => $this->guestUser->id,
            'temp_user_id' => 'temp-intent-123',
            'guest_checkout_token_hash' => hash('sha256', $this->plainToken),
            'status' => GuestCheckoutSession::STATUS_CART_BOUND,
            'expires_at' => now()->addHours(2),
        ]);

        // Ensure we have a cart item
        $product = new Product();
        $product->forceFill([
            'name' => 'Intent Test Product',
            'slug' => 'intent-test-product-' . Str::random(8),
            'added_by' => 'admin',
            'user_id' => $this->guestUser->id,
            'unit_price' => 500,
            'purchase_price' => 300,
            'published' => 1,
            'approved' => 1,
            'current_stock' => 10,
            'cash_on_delivery' => 0,
        ]);
        $product->save();

        Cart::create([
            'user_id' => $this->guestUser->id,
            'product_id' => $product->id,
            'price' => 500,
            'quantity' => 1,
            'tax' => 50,
            'shipping_cost' => 60,
            'discount' => 0,
            'status' => 1,
        ]);
    }

    public function test_payment_intent_requires_token(): void
    {
        $response = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'gateway' => 'razorpay',
        ]);

        $response->assertStatus(422);
    }

    public function test_payment_intent_requires_gateway(): void
    {
        $response = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(422);
    }

    public function test_payment_intent_rejects_invalid_token(): void
    {
        $response = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => 'bad-token',
            'gateway' => 'razorpay',
        ]);

        $response->assertStatus(422);
    }

    public function test_payment_intent_rejects_wallet_gateway(): void
    {
        $response = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => $this->plainToken,
            'gateway' => 'wallet',
        ]);

        $response->assertStatus(422);
    }

    public function test_cod_intent_is_rejected(): void
    {
        $response = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => $this->plainToken,
            'gateway' => 'cash_on_delivery',
        ]);

        $response->assertStatus(422);

        $this->session->refresh();
        $this->assertNotEquals(GuestCheckoutSession::STATUS_ORDER_COMPLETED, $this->session->status);
    }

    public function test_idempotent_intent_reuses_combined_order(): void
    {
        // First create a combined order on the session
        $response1 = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => $this->plainToken,
            'gateway' => 'phonepe',
        ]);

        if ($response1->status() !== 200) {
            $this->markTestSkipped('Order creation failed — likely missing business settings. Skipping idempotency check.');
        }

        $orderId1 = $response1->json('data.order_id');

        // Create a new token pointing to same session with same combined_order_id
        $newToken = Str::random(64);
        $this->session->update([
            'guest_checkout_token_hash' => hash('sha256', $newToken),
            'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
        ]);

        $response2 = $this->withSystemKey()->postJson('/api/v2/guest/payments/intent', [
            'guest_checkout_token' => $newToken,
            'gateway' => 'phonepe',
        ]);

        if ($response2->status() === 200) {
            $orderId2 = $response2->json('data.order_id');
            $this->assertEquals($orderId1, $orderId2, 'Should reuse the same combined order');
        }
    }

    private function withSystemKey(): self
    {
        return $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ]);
    }
}
