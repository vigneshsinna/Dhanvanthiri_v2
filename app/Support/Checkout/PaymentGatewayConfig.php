<?php

namespace App\Support\Checkout;

use App\Models\BusinessSetting;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;

class PaymentGatewayConfig
{
    public function allForAdmin(): array
    {
        return [
            $this->adminPayload('razorpay'),
            $this->adminPayload('phonepe'),
        ];
    }

    public function publicMethods(): array
    {
        return array_values(array_filter([
            $this->isEnabled('razorpay') && $this->hasCredentials('razorpay') ? $this->publicPayload('razorpay') : null,
            $this->isEnabled('phonepe') && $this->hasCredentials('phonepe') ? $this->publicPayload('phonepe') : null,
        ]));
    }

    public function isEnabled(string $code): bool
    {
        $code = AllowedPaymentMethods::normalize($code);
        if (! AllowedPaymentMethods::isAllowed($code)) {
            return false;
        }

        $method = $this->paymentMethod($code);
        if ($method) {
            if (Schema::hasColumn('payment_methods', 'active') && (int) $method->active !== 1) {
                return false;
            }
            if (Schema::hasColumn('payment_methods', 'status') && (int) $method->status !== 1) {
                return false;
            }
        }

        if ($code === 'razorpay') {
            return $this->booleanSetting(['razorpay', 'RAZORPAY_ENABLED'], true);
        }

        return $this->booleanSetting(['phonepe_payment', 'PHONEPE_ENABLED'], true);
    }

    public function razorpay(): array
    {
        return [
            'enabled' => $this->isEnabled('razorpay'),
            'key_id' => $this->setting(['razorpay_key_id', 'RAZOR_KEY', 'RAZORPAY_KEY_ID'], env('RAZOR_KEY', env('RAZORPAY_KEY_ID', ''))),
            'key_secret' => $this->secret(['razorpay_key_secret', 'RAZOR_SECRET', 'RAZORPAY_KEY_SECRET'], env('RAZOR_SECRET', env('RAZORPAY_KEY_SECRET', ''))),
            'webhook_secret' => $this->secret(['razorpay_webhook_secret', 'RAZOR_WEBHOOK_SECRET', 'RAZORPAY_WEBHOOK_SECRET'], env('RAZOR_WEBHOOK_SECRET', env('RAZORPAY_WEBHOOK_SECRET', ''))),
        ];
    }

    public function phonepe(): array
    {
        $environment = strtolower($this->setting(['phonepe_environment', 'PHONEPE_ENVIRONMENT'], ''));
        if ($environment === '') {
            $environment = (int) $this->setting(['phonepe_sandbox'], '1') === 1 ? 'sandbox' : 'production';
        }

        $isSandbox = in_array($environment, ['sandbox', 'uat', 'preprod'], true);
        $baseUrl = $this->setting(['phonepe_base_url', 'PHONEPE_BASE_URL'], $isSandbox
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            : 'https://api.phonepe.com/apis');

        return [
            'enabled' => $this->isEnabled('phonepe'),
            'environment' => $isSandbox ? 'sandbox' : 'production',
            'client_id' => $this->setting(['phonepe_client_id', 'PHONEPE_CLIENT_ID'], env('PHONEPE_CLIENT_ID', '')),
            'client_secret' => $this->secret(['phonepe_client_secret', 'PHONEPE_CLIENT_SECRET'], env('PHONEPE_CLIENT_SECRET', '')),
            'client_version' => $this->setting(['phonepe_client_version', 'PHONEPE_CLIENT_VERSION', 'phonepe_version'], env('PHONEPE_CLIENT_VERSION', '1')),
            'base_url' => rtrim($baseUrl, '/'),
            'redirect_url' => $this->setting(['phonepe_redirect_url', 'PHONEPE_REDIRECT_URL'], ''),
            'callback_url' => $this->setting(['phonepe_callback_url', 'PHONEPE_CALLBACK_URL'], ''),
            'webhook_secret' => $this->secret(['phonepe_webhook_secret', 'PHONEPE_WEBHOOK_SECRET'], env('PHONEPE_WEBHOOK_SECRET', '')),
            'timeout_seconds' => max(5, (int) $this->setting(['phonepe_timeout_seconds', 'PHONEPE_TIMEOUT_SECONDS'], '20')),
        ];
    }

    public function save(string $code, array $payload): array
    {
        $code = AllowedPaymentMethods::normalize($code);
        if (! AllowedPaymentMethods::isAllowed($code)) {
            throw new \InvalidArgumentException('Unsupported payment gateway.');
        }

        $enabled = array_key_exists('is_enabled', $payload) ? (bool) $payload['is_enabled'] : $this->isEnabled($code);
        $settings = is_array($payload['settings'] ?? null) ? $payload['settings'] : [];

        if ($code === 'razorpay') {
            if ($enabled) {
                $current = $this->razorpay();
                $keyId = trim((string) ($settings['key_id'] ?? $settings['razorpay_key_id'] ?? $current['key_id']));
                $keySecret = trim((string) ($settings['key_secret'] ?? $settings['razorpay_key_secret'] ?? $current['key_secret']));

                if ($keyId === '') {
                    throw new \InvalidArgumentException('Razorpay cannot be enabled without key_id.');
                }

                if ($keySecret === '') {
                    throw new \InvalidArgumentException('Razorpay cannot be enabled without key_secret.');
                }
            }

            $this->setSetting('razorpay', $enabled ? '1' : '0');
            $this->saveOptionalSetting('razorpay_key_id', $settings['key_id'] ?? $settings['razorpay_key_id'] ?? null);
            $this->saveOptionalSecret('razorpay_key_secret', $settings['key_secret'] ?? $settings['razorpay_key_secret'] ?? null);
            $this->saveOptionalSecret('razorpay_webhook_secret', $settings['webhook_secret'] ?? $settings['razorpay_webhook_secret'] ?? null);
        }

        if ($code === 'phonepe') {
            $required = ['client_id', 'client_version', 'client_secret'];
            if ($enabled) {
                foreach ($required as $key) {
                    $current = $key === 'client_secret' ? $this->phonepe()['client_secret'] : $this->phonepe()[$key];
                    if (trim((string) ($settings[$key] ?? $current)) === '') {
                        throw new \InvalidArgumentException('PhonePe cannot be enabled without ' . $key . '.');
                    }
                }
            }

            $environment = strtolower((string) ($settings['environment'] ?? $payload['environment'] ?? $this->phonepe()['environment']));
            $this->setSetting('phonepe_payment', $enabled ? '1' : '0');
            $this->setSetting('PHONEPE_ENABLED', $enabled ? '1' : '0');
            $this->saveOptionalSetting('phonepe_environment', in_array($environment, ['production', 'sandbox'], true) ? $environment : 'sandbox');
            $this->saveOptionalSetting('phonepe_client_id', $settings['client_id'] ?? null);
            $this->saveOptionalSetting('phonepe_client_version', $settings['client_version'] ?? null);
            $this->saveOptionalSecret('phonepe_client_secret', $settings['client_secret'] ?? null);
            $this->saveOptionalSetting('phonepe_base_url', $settings['base_url'] ?? null);
            $this->saveOptionalSetting('phonepe_redirect_url', $settings['redirect_url'] ?? null);
            $this->saveOptionalSetting('phonepe_callback_url', $settings['callback_url'] ?? null);
            $this->saveOptionalSecret('phonepe_webhook_secret', $settings['webhook_secret'] ?? null);
            $this->saveOptionalSetting('phonepe_timeout_seconds', $settings['timeout_seconds'] ?? null);
        }

        $this->syncPaymentMethod($code, $enabled);
        Cache::forget('business_settings');

        return $this->adminPayload($code);
    }

    public function hasCredentials(string $code): bool
    {
        $code = AllowedPaymentMethods::normalize($code);
        if ($code === 'razorpay') {
            $config = $this->razorpay();
            return $config['key_id'] !== '' && $config['key_secret'] !== '';
        }

        if ($code === 'phonepe') {
            $config = $this->phonepe();
            return $config['client_id'] !== '' && $config['client_version'] !== '' && $config['client_secret'] !== '';
        }

        return false;
    }

    private function publicPayload(string $code): array
    {
        return [
            'payment_type' => $code,
            'payment_type_key' => $code,
            'image' => static_asset('assets/img/cards/' . $code . '.png'),
            'name' => $code === 'phonepe' ? 'PhonePe' : 'Razorpay',
            'title' => translate('Checkout with ' . ($code === 'phonepe' ? 'PhonePe' : 'Razorpay')),
            'offline_payment_id' => 0,
            'details' => '',
        ];
    }

    private function adminPayload(string $code): array
    {
        $config = $code === 'phonepe' ? $this->phonepe() : $this->razorpay();

        return [
            'code' => $code,
            'name' => $code === 'phonepe' ? 'PhonePe' : 'Razorpay',
            'description' => $code === 'phonepe'
                ? 'PhonePe Standard Checkout.'
                : 'UPI, cards, net banking, wallets via Razorpay.',
            'is_enabled' => $this->isEnabled($code),
            'is_default' => $code === 'razorpay',
            'type' => 'online',
            'environment' => $config['environment'] ?? null,
            'settings' => $this->maskSecrets($config),
        ];
    }

    private function maskSecrets(array $config): array
    {
        foreach (['key_secret', 'client_secret', 'webhook_secret'] as $key) {
            if (array_key_exists($key, $config)) {
                $config[$key] = $config[$key] !== '' ? '********' : '';
            }
        }

        return $config;
    }

    private function paymentMethod(string $code): ?PaymentMethod
    {
        if (! Schema::hasTable('payment_methods')) {
            return null;
        }

        return PaymentMethod::query()->where('name', $code)->first();
    }

    private function syncPaymentMethod(string $code, bool $enabled): void
    {
        if (! Schema::hasTable('payment_methods')) {
            return;
        }

        $values = ['name' => $code, 'updated_at' => now()];
        if (Schema::hasColumn('payment_methods', 'active')) {
            $values['active'] = $enabled ? 1 : 0;
        }
        if (Schema::hasColumn('payment_methods', 'status')) {
            $values['status'] = $enabled ? 1 : 0;
        }

        PaymentMethod::query()->updateOrCreate(['name' => $code], $values);
    }

    private function booleanSetting(array $keys, bool $default): bool
    {
        $value = $this->setting($keys, $default ? '1' : '0');
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function setting(array $keys, ?string $default = ''): string
    {
        foreach ($keys as $key) {
            $setting = BusinessSetting::query()->where('type', $key)->first();
            if ($setting && trim((string) $setting->value) !== '') {
                return trim((string) $setting->value);
            }
        }

        return trim((string) $default);
    }

    private function secret(array $keys, ?string $default = ''): string
    {
        $value = $this->setting($keys, $default);
        if (str_starts_with($value, 'enc:')) {
            try {
                return Crypt::decryptString(substr($value, 4));
            } catch (\Throwable) {
                return '';
            }
        }

        return $value;
    }

    private function saveOptionalSetting(string $key, mixed $value): void
    {
        if ($value === null || trim((string) $value) === '' || trim((string) $value) === '********') {
            return;
        }

        $this->setSetting($key, trim((string) $value));
    }

    private function saveOptionalSecret(string $key, mixed $value): void
    {
        if ($value === null || trim((string) $value) === '' || trim((string) $value) === '********') {
            return;
        }

        $this->setSetting($key, 'enc:' . Crypt::encryptString(trim((string) $value)));
    }

    private function setSetting(string $key, string $value): void
    {
        BusinessSetting::query()->updateOrCreate(['type' => $key], ['value' => $value]);
    }
}
