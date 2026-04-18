<?php

namespace Tests\Feature\Api;

use App\Models\GuestCheckoutSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuestAccountClaimTest extends TestCase
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
            'email' => 'guest-claim@example.com',
        ]);

        $this->plainToken = Str::random(64);

        $this->session = GuestCheckoutSession::create([
            'guest_user_id' => $this->guestUser->id,
            'temp_user_id' => 'temp-claim-123',
            'guest_checkout_token_hash' => hash('sha256', $this->plainToken),
            'status' => GuestCheckoutSession::STATUS_ORDER_COMPLETED,
            'order_code' => 'ORD-CLAIM-001',
            'expires_at' => now()->addHours(2),
        ]);
    }

    public function test_claim_requires_password(): void
    {
        $response = $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_claim_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'NewPassword123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_claim_requires_min_password_length(): void
    {
        $response = $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'abc',
            'password_confirmation' => 'abc',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_claim_converts_guest_to_customer(): void
    {
        $response = $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'data' => [
                'user_id',
                'email',
                'claimed_at',
            ],
        ]);

        // Verify user was updated
        $this->guestUser->refresh();
        $this->assertFalse($this->guestUser->is_guest);
        $this->assertNotNull($this->guestUser->account_claimed_at);
        $this->assertEquals($response->json('data.user_id'), $this->guestUser->id);
    }

    public function test_claim_reuses_same_user_row(): void
    {
        $originalId = $this->guestUser->id;
        $originalEmail = $this->guestUser->email;

        $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ]);

        $this->guestUser->refresh();
        $this->assertEquals($originalId, $this->guestUser->id);
        $this->assertEquals($originalEmail, $this->guestUser->email);
    }

    public function test_claim_rejects_already_claimed_account(): void
    {
        // First claim
        $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ])->assertStatus(200);

        // Second claim should fail
        $newToken = Str::random(64);
        $this->session->update([
            'guest_checkout_token_hash' => hash('sha256', $newToken),
        ]);

        $response = $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $newToken,
            'password' => 'AnotherPass456',
            'password_confirmation' => 'AnotherPass456',
        ]);

        $response->assertStatus(422);
    }

    public function test_claim_sets_usable_password(): void
    {
        $this->postJson('/api/v2/guest/account/claim', [
            'guest_checkout_token' => $this->plainToken,
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ])->assertStatus(200);

        $this->guestUser->refresh();
        $this->assertTrue(\Hash::check('SecurePass123', $this->guestUser->password));
    }
}
