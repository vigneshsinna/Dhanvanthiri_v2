<?php

namespace Tests\Feature\Admin;

use App\Models\BusinessSetting;
use App\Models\Currency;
use App\Models\Language;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminInvoiceDownloadRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_web_invoice_route_downloads_pdf_without_public_invoice_url(): void
    {
        $this->seedInvoicePrerequisites();
        [$admin, $order] = $this->makeAdminAndOrder();

        $this->actingAs($admin);
        $this->fakePdfDownload();

        $this->get(route('admin.orders.invoice.download', $order->id))
            ->assertOk()
            ->assertDownload('order-' . $order->code . '.pdf');
    }

    public function test_admin_api_invoice_route_downloads_pdf(): void
    {
        $this->seedInvoicePrerequisites();
        [$admin, $order] = $this->makeAdminAndOrder();

        Sanctum::actingAs($admin);
        $this->fakePdfDownload();

        $this->get('/api/admin/orders/' . $order->id . '/invoice')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertDownload('order-' . $order->code . '.pdf');
    }

    public function test_invoice_view_falls_back_to_customer_details_when_saved_addresses_are_empty(): void
    {
        $this->seedInvoicePrerequisites();
        [, $order] = $this->makeAdminAndOrder();
        $this->addOrderDetail($order, $this->makeTamilProduct());
        $order->setAttribute('shipping_address', json_encode([]));
        $order->setAttribute('billing_address', null);

        $html = view('backend.invoices.invoice', [
            'order' => $order->load('user', 'orderDetails.product.stocks'),
            'font_family' => "'Noto Sans Tamil','Roboto','sans-serif'",
            'direction' => 'ltr',
            'text_align' => 'left',
            'not_text_align' => 'right',
            'businessContact' => [
                'address' => 'Dhanvanthiri Foods, Erode, Tamil Nadu, India',
                'email' => 'dhanvanthirifoods777@gmail.com',
                'phone' => '9445717977',
            ],
        ])->render();

        $this->assertStringContainsString('Customer', $html);
        $this->assertStringContainsString('customer@example.test', $html);
        $this->assertStringContainsString('9999999999', $html);
        $this->assertStringContainsString('Fallback Street', $html);
        $this->assertStringNotContainsString(',,,', $html);
    }

    public function test_admin_invoice_uses_tamil_capable_font_when_product_name_contains_tamil(): void
    {
        $this->seedInvoicePrerequisites();
        [$admin, $order] = $this->makeAdminAndOrder();
        $product = $this->makeTamilProduct();
        $detail = new OrderDetail();
        $detail->forceFill([
            'order_id' => $order->id,
            'seller_id' => $admin->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 179,
            'tax' => 9,
            'shipping_cost' => 40,
        ]);
        $detail->save();

        $this->actingAs($admin);

        \PDF::shouldReceive('loadView')
            ->once()
            ->withArgs(function ($view, $data) {
                return $view === 'backend.invoices.invoice'
                    && str_contains($data['font_family'], 'Noto Sans Tamil');
            })
            ->andReturn(new class {
                public function download(string $name)
                {
                    return response('pdf', 200, [
                        'Content-Disposition' => 'attachment; filename="' . $name . '"',
                        'Content-Type' => 'application/pdf',
                    ]);
                }
            });

        $this->get(route('admin.orders.invoice.download', $order->id))->assertOk();
    }

    public function test_tamil_invoice_does_not_crash_when_tamil_font_file_is_missing(): void
    {
        $this->seedInvoicePrerequisites();
        [$admin, $order] = $this->makeAdminAndOrder();
        $product = $this->makeTamilProduct();
        $this->addOrderDetail($order, $product);

        $controller = new class extends \App\Http\Controllers\InvoiceController {
            public function exposedInvoiceFontFamily(Order $order): string
            {
                return $this->invoiceFontFamily($order);
            }

            protected function tamilFontAvailable(): bool
            {
                return false;
            }
        };

        $this->assertSame("'Roboto',sans-serif", $controller->exposedInvoiceFontFamily($order->load('orderDetails.product.product_translations')));
    }

    private function makeAdminAndOrder(): array
    {
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
            'phone' => '9999999999',
            'address' => 'Fallback Street',
            'city' => 'Erode',
            'postal_code' => '638001',
            'country' => 'India',
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
            'code' => 'ADMIN-INV-001',
        ]);
        $order->save();

        return [$admin, $order];
    }

    private function addOrderDetail(Order $order, Product $product): OrderDetail
    {
        $detail = new OrderDetail();
        $detail->forceFill([
            'order_id' => $order->id,
            'seller_id' => $product->user_id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 179,
            'tax' => 9,
            'shipping_cost' => 40,
        ]);
        $detail->save();

        return $detail;
    }

    private function makeTamilProduct(): Product
    {
        $product = new Product();
        $product->forceFill([
            'name' => 'கருவேப்பிலை தொக்கு / Karuveppilai Thokku',
            'user_id' => 1,
            'slug' => 'karuveppilai-thokku',
            'unit_price' => 179,
            'published' => 1,
            'approved' => 1,
        ]);
        $product->save();

        return $product;
    }

    private function fakePdfDownload(): void
    {
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
    }

    private function seedInvoicePrerequisites(): void
    {
        Cache::forget('business_settings');
        Cache::forget('system_default_currency');

        $currency = new Currency();
        $currency->forceFill([
            'name' => 'Indian Rupee',
            'code' => 'INR',
            'symbol' => 'Rs',
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
