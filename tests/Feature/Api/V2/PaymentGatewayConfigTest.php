<?php

namespace Tests\Feature\Api\V2;

use App\Models\BusinessSetting;
use App\Support\Checkout\PaymentGatewayConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewayConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_razorpay_cannot_be_enabled_without_admin_credentials(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Razorpay cannot be enabled without key_id.');

        app(PaymentGatewayConfig::class)->save('razorpay', [
            'is_enabled' => true,
            'settings' => [],
        ]);
    }

    public function test_phonepe_admin_settings_are_saved_encrypted_and_masked(): void
    {
        $payload = app(PaymentGatewayConfig::class)->save('phonepe', [
            'is_enabled' => true,
            'environment' => 'sandbox',
            'settings' => [
                'client_id' => 'PHONEPEUAT',
                'client_version' => '1',
                'client_secret' => 'phonepe-secret',
                'base_url' => 'https://api-preprod.phonepe.com/apis/pg-sandbox',
                'redirect_url' => 'https://puregrains.test/payment/phonepe/redirect',
                'callback_url' => 'https://puregrains.test/api/v2/phonepe/callbackUrl',
            ],
        ]);

        $storedSecret = BusinessSetting::query()->where('type', 'phonepe_client_secret')->value('value');

        $this->assertSame('phonepe', $payload['code']);
        $this->assertTrue($payload['is_enabled']);
        $this->assertSame('sandbox', $payload['environment']);
        $this->assertSame('********', $payload['settings']['client_secret']);
        $this->assertStringStartsWith('enc:', $storedSecret);
        $this->assertSame('phonepe-secret', app(PaymentGatewayConfig::class)->phonepe()['client_secret']);
    }

    public function test_public_payment_methods_never_include_cod_or_manual_payment(): void
    {
        app(PaymentGatewayConfig::class)->save('razorpay', [
            'is_enabled' => true,
            'settings' => [
                'key_id' => 'rzp_test_123',
                'key_secret' => 'razor-secret',
            ],
        ]);

        app(PaymentGatewayConfig::class)->save('phonepe', [
            'is_enabled' => true,
            'settings' => [
                'client_id' => 'PHONEPEUAT',
                'client_version' => '1',
                'client_secret' => 'phonepe-secret',
            ],
        ]);

        $methods = collect(app(PaymentGatewayConfig::class)->publicMethods())->pluck('payment_type_key')->all();

        $this->assertSame(['razorpay', 'phonepe'], $methods);
        $this->assertNotContains('cod', $methods);
        $this->assertNotContains('cash_on_delivery', $methods);
        $this->assertNotContains('manual_payment', $methods);
    }
}
