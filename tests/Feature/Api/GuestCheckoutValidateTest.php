<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\GuestCheckoutSession;
use App\Models\User;
use Tests\Feature\Api\V2\Concerns\InteractsWithGuestCheckoutSchema;
use Tests\TestCase;

class GuestCheckoutValidateTest extends TestCase
{
    use InteractsWithGuestCheckoutSchema;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpGuestCheckoutSchema();
    }

    public function test_guest_checkout_validate_requires_a_temp_user_cart(): void
    {
        $response = $this->postGuestValidate([
            'temp_user_id' => 'temp-missing-cart',
        ] + $this->validGuestPayload());

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.fields.temp_user_id.0', 'A guest cart is required before checkout can continue.');
    }

    public function test_guest_checkout_validate_requires_guest_details(): void
    {
        $this->makeCart('temp-requires-details');

        $response = $this->postGuestValidate([
            'temp_user_id' => 'temp-requires-details',
        ]);

        $response->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $fields = $response->json('error.fields');

        foreach (['name', 'email', 'address', 'country_id', 'city_id', 'postal_code', 'phone'] as $field) {
            $this->assertArrayHasKey($field, $fields);
        }
    }

    public function test_guest_checkout_validate_rejects_claimed_account_email_with_a_sign_in_required_message(): void
    {
        $this->makeCart('temp-claimed-email');

        $claimedUser = new User();
        $claimedUser->forceFill([
            'name' => 'Claimed Customer',
            'email' => 'claimed-' . uniqid() . '@example.test',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'is_guest' => false,
            'account_claimed_at' => now(),
        ]);
        $claimedUser->save();

        $response = $this->postGuestValidate([
            'temp_user_id' => 'temp-claimed-email',
            'email' => $claimedUser->email,
        ] + $this->validGuestPayload());

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.fields.email.0', 'Please sign in to continue with your existing account.');
    }

    public function test_guest_checkout_validate_reuses_an_unclaimed_guest_email_and_returns_token_metadata(): void
    {
        $this->makeCart('temp-reuse-guest');

        $guest = new User();
        $guest->forceFill([
            'name' => 'Reusable Guest',
            'email' => 'guest-' . uniqid() . '@example.test',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => null,
        ]);
        $guest->save();

        $response = $this->postGuestValidate([
            'temp_user_id' => 'temp-reuse-guest',
            'email' => $guest->email,
            'name' => 'Reusable Guest Updated',
        ] + $this->validGuestPayload());

        $response->assertOk()
            ->assertJsonPath('success', true);

        $token = $response->json('data.guest_checkout_token');
        $expiresAt = $response->json('data.expires_at');

        $this->assertIsString($token);
        $this->assertNotSame('', $token);
        $this->assertNotNull($expiresAt);
        $this->assertSame(1, User::where('email', $guest->email)->count());

        $session = GuestCheckoutSession::where('guest_user_id', $guest->id)->first();

        $this->assertNotNull($session);
        $this->assertSame(hash('sha256', $token), $session->guest_checkout_token_hash);
    }

    private function postGuestValidate(array $overrides)
    {
        return $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/guest/checkout/validate', $overrides);
    }

    private function makeCart(string $tempUserId): Cart
    {
        $cart = new Cart();
        $cart->forceFill([
            'temp_user_id' => $tempUserId,
            'owner_id' => 1,
            'product_id' => 1,
            'variation' => '',
            'price' => 250,
            'tax' => 0,
            'shipping_cost' => 0,
            'discount' => 0,
            'quantity' => 1,
            'status' => 1,
        ]);
        $cart->save();

        return $cart;
    }

    private function validGuestPayload(): array
    {
        return [
            'name' => 'Guest Checkout Customer',
            'email' => 'guest-checkout-' . uniqid() . '@example.test',
            'address' => '42 Temple Street',
            'country_id' => 1,
            'city_id' => 1,
            'postal_code' => '600001',
            'phone' => '9876543210',
        ];
    }
}
