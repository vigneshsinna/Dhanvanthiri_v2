<?php

namespace Tests\Feature\Api;

use App\Models\Address;
use App\Models\Cart;
use App\Models\GuestCheckoutSession;
use App\Models\User;
use Tests\Feature\Api\V2\Concerns\InteractsWithGuestCheckoutSchema;
use Tests\TestCase;

class GuestCheckoutCartHandoffTest extends TestCase
{
    use InteractsWithGuestCheckoutSchema;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpGuestCheckoutSchema();
    }

    public function test_guest_validation_binds_the_temp_cart_to_the_guest_user_and_preserves_the_original_temp_user_id_on_the_session(): void
    {
        $tempUserId = 'temp-bind-cart';
        $cart = $this->makeCart($tempUserId);

        $this->postGuestValidate($tempUserId, 'bind-cart@example.test')->assertOk();

        $guestUser = User::where('email', 'bind-cart@example.test')->firstOrFail();
        $session = GuestCheckoutSession::where('guest_user_id', $guestUser->id)->firstOrFail();

        $this->assertDatabaseHas('carts', [
            'id' => $cart->id,
            'user_id' => $guestUser->id,
            'temp_user_id' => $tempUserId,
        ]);
        $this->assertSame($tempUserId, $session->temp_user_id);
        $this->assertSame(GuestCheckoutSession::STATUS_CART_BOUND, $session->status);
    }

    public function test_guest_validation_is_idempotent_for_retries_and_does_not_duplicate_cart_rows_or_guest_addresses(): void
    {
        $tempUserId = 'temp-idempotent-cart';
        $this->makeCart($tempUserId);

        $this->postGuestValidate($tempUserId, 'retry-cart@example.test')->assertOk();
        $this->postGuestValidate($tempUserId, 'retry-cart@example.test')->assertOk();

        $guestUser = User::where('email', 'retry-cart@example.test')->firstOrFail();

        $this->assertSame(1, Cart::count());
        $this->assertSame(1, Cart::where('user_id', $guestUser->id)->count());
        $this->assertSame(1, Address::where('user_id', $guestUser->id)->count());
    }

    private function postGuestValidate(string $tempUserId, string $email)
    {
        return $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/guest/checkout/validate', [
            'temp_user_id' => $tempUserId,
            'name' => 'Guest Cart Binder',
            'email' => $email,
            'address' => '42 Temple Street',
            'country_id' => 1,
            'city_id' => 1,
            'postal_code' => '600001',
            'phone' => '9876543210',
        ]);
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
}
