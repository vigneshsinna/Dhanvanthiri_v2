<?php

namespace Tests\Feature\Api;

use App\Models\GuestCheckoutSession;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\Feature\Api\V2\Concerns\InteractsWithGuestCheckoutSchema;
use Tests\TestCase;

class GuestCheckoutPersistenceTest extends TestCase
{
    use InteractsWithGuestCheckoutSchema;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpGuestCheckoutSchema();
    }

    public function test_guest_capable_users_can_be_marked_and_claimed_accounts_store_their_claim_timestamp(): void
    {
        $this->assertTrue(
            Schema::hasColumns('users', ['is_guest', 'account_claimed_at']),
            'Expected the users table to expose guest lifecycle columns.'
        );

        $claimedAt = now()->startOfSecond();

        $user = new User();
        $user->forceFill([
            'name' => 'Guest Customer',
            'email' => 'guest-' . uniqid() . '@example.test',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'is_guest' => true,
            'account_claimed_at' => $claimedAt,
        ]);
        $user->save();

        $this->assertTrue(
            method_exists($user, 'guestCheckoutSessions'),
            'Expected User to define a guestCheckoutSessions relationship.'
        );

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_guest' => 1,
            'account_claimed_at' => $claimedAt->toDateTimeString(),
        ]);
    }

    public function test_guest_checkout_sessions_persist_token_hash_status_expiry_cart_binding_and_optional_order_reference(): void
    {
        $this->assertTrue(
            Schema::hasTable('guest_checkout_sessions'),
            'Expected the guest_checkout_sessions table to exist.'
        );

        $this->assertTrue(
            class_exists(GuestCheckoutSession::class),
            'Expected the GuestCheckoutSession model to exist.'
        );

        $guest = new User();
        $guest->forceFill([
            'name' => 'Persisted Guest',
            'email' => 'persisted-guest-' . uniqid() . '@example.test',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'is_guest' => true,
        ]);
        $guest->save();

        $expiresAt = now()->addHours(2)->startOfSecond();
        $tokenHash = hash('sha256', 'guest-session-token');

        $session = new GuestCheckoutSession();
        $session->forceFill([
            'guest_user_id' => $guest->id,
            'temp_user_id' => 'temp-user-' . uniqid(),
            'guest_checkout_token_hash' => $tokenHash,
            'status' => GuestCheckoutSession::STATUS_VALIDATED,
            'combined_order_id' => 321,
            'order_code' => 'ORD-321',
            'expires_at' => $expiresAt,
        ]);
        $session->save();

        $this->assertDatabaseHas('guest_checkout_sessions', [
            'id' => $session->id,
            'guest_user_id' => $guest->id,
            'guest_checkout_token_hash' => $tokenHash,
            'status' => GuestCheckoutSession::STATUS_VALIDATED,
            'combined_order_id' => 321,
            'order_code' => 'ORD-321',
            'temp_user_id' => $session->temp_user_id,
            'expires_at' => $expiresAt->toDateTimeString(),
        ]);

        $this->assertSame($session->id, $guest->guestCheckoutSessions()->firstOrFail()->id);
    }
}
