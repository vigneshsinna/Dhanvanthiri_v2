<?php

namespace Tests\Feature\Storefront;

use App\Models\BusinessSetting;
use App\Models\Currency;
use App\Models\Language;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HeadlessStorefrontRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function enableReactStorefront(): void
    {
        putenv('STOREFRONT_MODE=react');
        $_ENV['STOREFRONT_MODE'] = 'react';
        $_SERVER['STOREFRONT_MODE'] = 'react';
        $this->refreshApplication();
    }

    public function test_root_serves_react_storefront_when_headless_mode_is_enabled(): void
    {
        $this->enableReactStorefront();

        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $response->assertSee('/storefront-assets/', false);
    }

    public function test_storefront_product_path_falls_back_to_react_shell_when_headless_mode_is_enabled(): void
    {
        $this->enableReactStorefront();

        $response = $this->get('/products/poondu-thokku');

        $response->assertOk();
        $response->assertSee('<div id="root"></div>', false);
    }

    public function test_invoice_download_bypasses_react_shell_when_headless_mode_is_enabled(): void
    {
        $this->enableReactStorefront();
        $this->seedDefaultCurrency();

        $admin = new User();
        $admin->forceFill([
            'name' => 'Admin',
            'email' => 'admin@example.test',
            'password' => bcrypt('password'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $admin->save();

        $customer = new User();
        $customer->forceFill([
            'name' => 'Customer',
            'email' => 'customer@example.test',
            'password' => bcrypt('password'),
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);
        $customer->save();

        $order = new Order();
        $order->forceFill([
            'user_id' => $customer->id,
            'seller_id' => $admin->id,
            'grand_total' => 228.00,
            'payment_status' => 'paid',
            'delivery_status' => 'pending',
            'payment_type' => 'razorpay',
            'code' => 'INV-HEADLESS-001',
        ]);
        $order->save();

        $this->actingAs($admin);

        \PDF::shouldReceive('loadView')
            ->once()
            ->andReturn(new class {
                public function download(string $name)
                {
                    return response('pdf', 200, [
                        'Content-Disposition' => 'attachment; filename="' . $name . '"',
                        'Content-Type' => 'application/pdf',
                    ]);
                }
            });

        $this->get('/invoice/' . $order->id)
            ->assertOk()
            ->assertDownload('order-' . $order->code . '.pdf');
    }

    private function seedDefaultCurrency(): void
    {
        Cache::forget('business_settings');
        Cache::forget('system_default_currency');

        $currency = new Currency();
        $currency->forceFill([
            'name' => 'Indian Rupee',
            'code' => 'INR',
            'symbol' => '₹',
            'exchange_rate' => 1,
        ]);
        $currency->save();

        $setting = new BusinessSetting();
        $setting->forceFill([
            'type' => 'system_default_currency',
            'value' => $currency->id,
        ]);
        $setting->save();

        $language = new Language();
        $language->forceFill([
            'code' => config('app.locale', 'en'),
            'rtl' => 0,
        ]);
        $language->save();
    }
}
