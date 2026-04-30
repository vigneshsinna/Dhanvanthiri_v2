<?php

namespace Tests\Feature\Api\V2;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentMethodsAllowlistTest extends TestCase
{
    use RefreshDatabase;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    public function test_public_payment_types_only_returns_razorpay_and_phonepe(): void
    {
        foreach (['razorpay', 'phonepe', 'cash_on_delivery', 'cash_payment', 'manual_payment', 'wallet'] as $name) {
            DB::table('payment_methods')->insert([
                'name' => $name,
                'active' => 1,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        foreach ([
            'razorpay' => '1',
            'razorpay_key_id' => 'rzp_test_123',
            'razorpay_key_secret' => 'razor-secret',
            'phonepe_payment' => '1',
            'phonepe_client_id' => 'PHONEPEUAT',
            'phonepe_client_version' => '1',
            'phonepe_client_secret' => 'phonepe-secret',
        ] as $type => $value) {
            DB::table('business_settings')->insert([
                'type' => $type,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $response = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->getJson('/api/v2/payment-types');

        $response->assertOk();

        $keys = collect($response->json())
            ->pluck('payment_type_key')
            ->map(fn ($value) => strtolower((string) $value))
            ->values()
            ->all();

        $this->assertContains('razorpay', $keys);
        $this->assertContains('phonepe', $keys);
        $this->assertNotContains('cash_on_delivery', $keys);
        $this->assertNotContains('cod', $keys);
        $this->assertNotContains('manual_payment', $keys);
        $this->assertNotContains('wallet', $keys);
    }
}
