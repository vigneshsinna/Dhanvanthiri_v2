<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\Report\EarningReportController;
use App\Models\BusinessSetting;
use App\Models\Currency;
use App\Models\Language;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminFinanceRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_earning_report_counts_paid_orders_even_when_they_are_not_delivered(): void
    {
        $this->seedDefaultCurrency();
        $this->registerSqliteDateFunctions();

        $customer = User::factory()->create([
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id' => $customer->id,
            'seller_id' => $customer->id,
            'grand_total' => 499.00,
            'payment_status' => 'paid',
            'delivery_status' => 'pending',
            'payment_type' => 'razorpay',
            'code' => 'REP-PAID-001',
        ]);
        $order->save();

        $view = app(EarningReportController::class)->index();
        $data = $view->getData();

        $this->assertSame(499.0, (float) $data['total_sales_alltime']);
        $this->assertSame(499.0, (float) $data['sales_this_month']);
    }

    public function test_invoice_download_falls_back_to_the_default_language_when_session_locale_is_missing(): void
    {
        $this->seedDefaultCurrency();

        $admin = User::factory()->create([
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);

        $customer = User::factory()->create([
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id' => $customer->id,
            'seller_id' => $admin->id,
            'grand_total' => 499.00,
            'payment_status' => 'paid',
            'delivery_status' => 'pending',
            'payment_type' => 'razorpay',
            'code' => 'INV-PAID-001',
            'date' => now()->timestamp,
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

        $this->withSession(['locale' => 'zz'])
            ->get(route('invoice.download', $order->id))
            ->assertOk()
            ->assertDownload('order-' . $order->code . '.pdf');
    }

    public function test_uploaded_asset_path_returns_a_local_public_path_for_direct_file_paths(): void
    {
        $this->assertSame(
            public_path('assets/img/logo.png'),
            uploaded_asset_path('/assets/img/logo.png')
        );
    }

    public function test_aiz_uploader_preview_accepts_direct_file_paths_without_throwing_a_sql_error(): void
    {
        $response = $this->post('/aiz-uploader/get_file_by_ids', [
            'ids' => '/assets/img/logo.png',
        ]);

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.id', '/assets/img/logo.png');
        $response->assertJsonPath('0.file_name', my_asset('assets/img/logo.png'));
    }

    private function seedDefaultCurrency(): void
    {
        Cache::forget('business_settings');
        Cache::forget('system_default_currency');

        $currency = new Currency();
        $currency->forceFill([
            'name' => 'US Dollar',
            'code' => 'USD',
            'symbol' => '$',
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

    private function registerSqliteDateFunctions(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        $pdo = DB::connection()->getPdo();
        if (!method_exists($pdo, 'sqliteCreateFunction')) {
            return;
        }

        $pdo->sqliteCreateFunction('DATE_FORMAT', function ($value, $format) {
            $timestamp = is_numeric($value) ? (int) $value : strtotime((string) $value);

            if ($timestamp === false) {
                return null;
            }

            if ($format === '%M') {
                return date('F', $timestamp);
            }

            if ($format === '%d') {
                return date('d', $timestamp);
            }

            return date('Y-m-d', $timestamp);
        }, 2);

        $pdo->sqliteCreateFunction('MONTH', function ($value) {
            $timestamp = is_numeric($value) ? (int) $value : strtotime((string) $value);

            if ($timestamp === false) {
                return null;
            }

            return (int) date('n', $timestamp);
        }, 1);
    }
}
