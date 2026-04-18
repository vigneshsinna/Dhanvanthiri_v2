<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\GuestCheckoutSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuestCheckoutSummaryTest extends TestCase
{
    use RefreshDatabase;

    private string $plainToken;
    private GuestCheckoutSession $session;
    private User $guestUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guestUser = User::factory()->create([
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => null,
        ]);

        $this->plainToken = Str::random(64);

        $this->session = GuestCheckoutSession::create([
            'guest_user_id' => $this->guestUser->id,
            'temp_user_id' => 'temp-test-123',
            'guest_checkout_token_hash' => hash('sha256', $this->plainToken),
            'status' => GuestCheckoutSession::STATUS_CART_BOUND,
            'expires_at' => now()->addHours(2),
        ]);
    }

    public function test_summary_requires_guest_checkout_token(): void
    {
        $response = $this->postJson('/api/v2/guest/checkout/summary', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guest_checkout_token']);
    }

    public function test_summary_rejects_invalid_token(): void
    {
        $response = $this->postJson('/api/v2/guest/checkout/summary', [
            'guest_checkout_token' => 'invalid-token-value',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('errors.guest_checkout_token.0', fn ($msg) => str_contains($msg, 'invalid'));
    }

    public function test_summary_rejects_expired_session(): void
    {
        $this->session->update(['expires_at' => now()->subMinute()]);

        $response = $this->postJson('/api/v2/guest/checkout/summary', [
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('errors.guest_checkout_token.0', fn ($msg) => str_contains($msg, 'expired'));
    }

    public function test_summary_rejects_when_cart_is_empty(): void
    {
        // No cart items for this guest user
        $response = $this->postJson('/api/v2/guest/checkout/summary', [
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('errors.guest_checkout_token.0', fn ($msg) => str_contains($msg, 'cart'));
    }

    public function test_summary_returns_totals_with_valid_cart(): void
    {
        // Create a cart item bound to the guest user
        $product = Product::factory()->create([
            'unit_price' => 500,
            'published' => 1,
        ]);

        Cart::create([
            'user_id' => $this->guestUser->id,
            'product_id' => $product->id,
            'price' => 500,
            'quantity' => 2,
            'tax' => 50,
            'shipping_cost' => 60,
            'discount' => 0,
            'status' => 1,
        ]);

        $response = $this->postJson('/api/v2/guest/checkout/summary', [
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'subtotal',
                'discount_amount',
                'shipping_cost',
                'tax_amount',
                'grand_total',
            ],
        ]);

        $data = $response->json('data');
        $this->assertTrue($data['subtotal'] > 0, 'Subtotal should be positive');
        $this->assertTrue($data['grand_total'] > 0, 'Grand total should be positive');
    }
}
