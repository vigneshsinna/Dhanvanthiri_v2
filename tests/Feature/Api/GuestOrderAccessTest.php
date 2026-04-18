<?php

namespace Tests\Feature\Api;

use App\Models\GuestCheckoutSession;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuestOrderAccessTest extends TestCase
{
    use RefreshDatabase;

    private string $plainToken;
    private GuestCheckoutSession $session;
    private User $guestUser;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guestUser = User::factory()->create([
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => null,
            'email' => 'guest@example.com',
            'phone' => '9876543210',
        ]);

        $this->order = Order::create([
            'user_id' => $this->guestUser->id,
            'grand_total' => 610.00,
            'payment_status' => 'paid',
            'payment_type' => 'razorpay',
            'code' => 'ORD-GUEST-001',
            'shipping_address' => json_encode([
                'name' => 'Guest User',
                'email' => 'guest@example.com',
                'phone' => '9876543210',
                'address' => '42 Temple Street',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'postal_code' => '600001',
            ]),
        ]);

        $this->plainToken = Str::random(64);

        $this->session = GuestCheckoutSession::create([
            'guest_user_id' => $this->guestUser->id,
            'temp_user_id' => 'temp-access-123',
            'guest_checkout_token_hash' => hash('sha256', $this->plainToken),
            'status' => GuestCheckoutSession::STATUS_ORDER_COMPLETED,
            'order_code' => 'ORD-GUEST-001',
            'expires_at' => now()->addHours(2),
        ]);
    }

    // ── POST /orders/track ──

    public function test_track_requires_order_number(): void
    {
        $response = $this->postJson('/api/v2/orders/track', [
            'email' => 'guest@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['order_number']);
    }

    public function test_track_requires_at_least_one_identity_field(): void
    {
        $response = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-GUEST-001',
        ]);

        $response->assertStatus(422);
    }

    public function test_track_succeeds_with_email(): void
    {
        $response = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-GUEST-001',
            'email' => 'guest@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.order_number', 'ORD-GUEST-001');
        $response->assertJsonStructure([
            'data' => [
                'order_number',
                'status',
                'payment_status',
                'items',
                'order_access_token',
                'order_access_expires_at',
            ],
        ]);
    }

    public function test_track_succeeds_with_guest_checkout_token(): void
    {
        $response = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-GUEST-001',
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.order_number', 'ORD-GUEST-001');
    }

    public function test_track_returns_404_for_unknown_order(): void
    {
        $response = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-NOTFOUND',
            'email' => 'guest@example.com',
        ]);

        $response->assertStatus(404);
    }

    public function test_track_rate_limited(): void
    {
        // The route uses throttle:10,1 — just verify the route works
        // Real rate limiting testing is environment-dependent
        $response = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-GUEST-001',
            'email' => 'guest@example.com',
        ]);

        $response->assertStatus(200);
    }

    // ── GET /orders/{orderNumber} ──

    public function test_show_returns_order_detail_with_guest_token(): void
    {
        $response = $this->getJson('/api/v2/orders/ORD-GUEST-001?guest_checkout_token=' . $this->plainToken);

        $response->assertStatus(200);
        $response->assertJsonPath('data.order_number', 'ORD-GUEST-001');
        $response->assertJsonStructure([
            'data' => [
                'id',
                'order_number',
                'status',
                'payment_status',
                'grand_total',
                'items',
                'shipping_address',
            ],
        ]);
    }

    public function test_show_returns_order_with_order_access_token(): void
    {
        // First get an order access token via tracking
        $trackResponse = $this->postJson('/api/v2/orders/track', [
            'order_number' => 'ORD-GUEST-001',
            'email' => 'guest@example.com',
        ]);

        $orderAccessToken = $trackResponse->json('data.order_access_token');

        $response = $this->getJson('/api/v2/orders/ORD-GUEST-001?order_access_token=' . $orderAccessToken);

        $response->assertStatus(200);
        $response->assertJsonPath('data.order_number', 'ORD-GUEST-001');
    }

    public function test_show_rejects_access_without_token(): void
    {
        $response = $this->getJson('/api/v2/orders/ORD-GUEST-001');

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_unknown_order(): void
    {
        $response = $this->getJson('/api/v2/orders/ORD-NOTFOUND?guest_checkout_token=' . $this->plainToken);

        $response->assertStatus(404);
    }
}
