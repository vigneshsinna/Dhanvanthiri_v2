<?php

namespace Tests\Feature\Api\V2;

use App\Models\Address;
use App\Models\BusinessSetting;
use App\Models\Carrier;
use App\Models\CarrierRange;
use App\Models\CarrierRangePrice;
use App\Models\Cart;
use App\Models\City;
use App\Models\Country;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductTax;
use App\Models\State;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShippingChargesTest extends TestCase
{
    use RefreshDatabase;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    public function test_checkout_shipping_rates_use_product_weight_plus_twenty_grams_per_item(): void
    {
        [$customer, $admin] = $this->seedShippingSetup();
        $address = $this->makeAddressFor($customer, 'Chennai', 'Chennai');
        $product = $this->makeProductFor($admin, 240);

        $this->makeCart($customer, $admin, $product, 2);

        Sanctum::actingAs($customer);

        $response = $this->withHeaders($this->apiHeaders())->postJson('/api/v2/checkout/shipping-rates', [
            'address_id' => $address->id,
        ]);

        $response->assertOk();
        $items = collect($response->json('data.items'));

        $this->assertSame(70.0, (float) $items->firstWhere('name', 'ST Courier')['cost']);
        $this->assertNull($items->firstWhere('name', 'DTDC'));
    }

    public function test_st_courier_serves_tamil_nadu_and_south_while_dtdc_serves_only_north(): void
    {
        [$customer, $admin] = $this->seedShippingSetup();
        $product = $this->makeProductFor($admin, 250);
        $this->makeCart($customer, $admin, $product, 1);

        Sanctum::actingAs($customer);

        $tamilNaduAddress = $this->makeAddressFor($customer, 'Chennai', 'Chennai');
        $tamilNaduRates = collect($this->withHeaders($this->apiHeaders())->postJson('/api/v2/checkout/shipping-rates', [
            'address_id' => $tamilNaduAddress->id,
        ])->json('data.items'));

        $this->assertNotNull($tamilNaduRates->firstWhere('name', 'ST Courier'));
        $this->assertSame(40.0, (float) $tamilNaduRates->firstWhere('name', 'ST Courier')['cost']);
        $this->assertNull($tamilNaduRates->firstWhere('name', 'DTDC'));

        foreach ([
            ['Karnataka', 'Bengaluru'],
            ['Kerala', 'Kochi'],
            ['Andhra Pradesh', 'Vijayawada'],
            ['Telangana', 'Hyderabad'],
            ['Puducherry', 'Puducherry'],
        ] as [$stateName, $cityName]) {
            $southAddress = $this->makeAddressFor($customer, $stateName, $cityName);
            $southRates = collect($this->withHeaders($this->apiHeaders())->postJson('/api/v2/checkout/shipping-rates', [
                'address_id' => $southAddress->id,
            ])->json('data.items'));

            $this->assertNotNull($southRates->firstWhere('name', 'ST Courier'), $stateName . ' should use ST Courier');
            $this->assertSame(90.0, (float) $southRates->firstWhere('name', 'ST Courier')['cost']);
            $this->assertNull($southRates->firstWhere('name', 'DTDC'), $stateName . ' should not use DTDC');
        }

        $northAddress = $this->makeAddressFor($customer, 'Delhi', 'New Delhi');
        $northRates = collect($this->withHeaders($this->apiHeaders())->postJson('/api/v2/checkout/shipping-rates', [
            'address_id' => $northAddress->id,
        ])->json('data.items'));

        $this->assertNull($northRates->firstWhere('name', 'ST Courier'));
        $this->assertNotNull($northRates->firstWhere('name', 'DTDC'));
    }

    public function test_cart_summary_excludes_gst_and_shipping_before_checkout(): void
    {
        [$customer, $admin] = $this->seedShippingSetup();
        $product = $this->makeProductFor($admin, 250);
        $cart = $this->makeCart($customer, $admin, $product, 2);
        $cart->forceFill([
            'tax' => 12.5,
            'shipping_cost' => 40,
        ])->save();

        $productTax = new ProductTax();
        $productTax->forceFill([
            'product_id' => $product->id,
            'tax_id' => 1,
            'tax' => 5,
            'tax_type' => 'percent',
        ]);
        $productTax->save();

        Sanctum::actingAs($customer);

        $response = $this->withHeaders($this->apiHeaders())->postJson('/api/v2/cart-summary', [
            'user_id' => $customer->id,
        ]);

        $response->assertOk();
        $this->assertSame(500.0, (float) $response->json('data.grand_total_value'));
        $this->assertStringContainsString('0', $response->json('data.tax'));
        $this->assertStringContainsString('0', $response->json('data.shipping_cost'));
    }

    private function seedShippingSetup(): array
    {
        BusinessSetting::updateOrCreate(['type' => 'shipping_type'], ['value' => 'carrier_wise_shipping']);
        Cache::forget('business_settings');
        CarrierRangePrice::query()->delete();
        CarrierRange::query()->delete();
        Carrier::query()->delete();
        Cart::query()->delete();

        $customer = User::create([
            'name' => 'Checkout Customer',
            'email' => 'customer' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);

        $admin = User::create([
            'name' => 'Shipping Admin',
            'email' => 'admin' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);

        DB::table('zones')->updateOrInsert(['id' => 1], ['name' => 'Tamil Nadu', 'updated_at' => now()]);
        DB::table('zones')->updateOrInsert(['id' => 2], ['name' => 'South India', 'updated_at' => now()]);
        DB::table('zones')->updateOrInsert(['id' => 3], ['name' => 'North India', 'updated_at' => now()]);

        DB::table('countries')->updateOrInsert(['id' => 1], ['code' => 'IN', 'name' => 'India', 'status' => 1, 'zone_id' => 0, 'updated_at' => now()]);

        DB::table('states')->updateOrInsert(['id' => 1], ['name' => 'Chennai', 'country_id' => 1, 'zone_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 2], ['name' => 'Karnataka', 'country_id' => 1, 'zone_id' => 2, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 3], ['name' => 'Delhi', 'country_id' => 1, 'zone_id' => 3, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 4], ['name' => 'Kerala', 'country_id' => 1, 'zone_id' => 2, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 5], ['name' => 'Andhra Pradesh', 'country_id' => 1, 'zone_id' => 2, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 6], ['name' => 'Telangana', 'country_id' => 1, 'zone_id' => 2, 'status' => 1, 'updated_at' => now()]);
        DB::table('states')->updateOrInsert(['id' => 7], ['name' => 'Puducherry', 'country_id' => 1, 'zone_id' => 2, 'status' => 1, 'updated_at' => now()]);

        DB::table('cities')->updateOrInsert(['id' => 1], ['name' => 'Chennai', 'state_id' => 1, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 2], ['name' => 'Bengaluru', 'state_id' => 2, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 3], ['name' => 'New Delhi', 'state_id' => 3, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 4], ['name' => 'Kochi', 'state_id' => 4, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 5], ['name' => 'Vijayawada', 'state_id' => 5, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 6], ['name' => 'Hyderabad', 'state_id' => 6, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);
        DB::table('cities')->updateOrInsert(['id' => 7], ['name' => 'Puducherry', 'state_id' => 7, 'country_id' => 1, 'status' => 1, 'updated_at' => now()]);

        DB::table('carriers')->updateOrInsert(['id' => 1], ['name' => 'ST Courier', 'transit_time' => 3, 'free_shipping' => 0, 'status' => 1, 'updated_at' => now()]);
        DB::table('carriers')->updateOrInsert(['id' => 2], ['name' => 'DTDC', 'transit_time' => 5, 'free_shipping' => 0, 'status' => 1, 'updated_at' => now()]);
        $stCourier = Carrier::findOrFail(1);
        $dtdc = Carrier::findOrFail(2);

        $this->makeRange($stCourier, 0, 0.5, [1 => 40, 2 => 90]);
        $this->makeRange($stCourier, 0.5, 1.0, [1 => 70, 2 => 150]);
        $this->makeRange($dtdc, 0, 0.5, [3 => 125]);
        $this->makeRange($dtdc, 0.5, 1.0, [3 => 200]);

        return [$customer, $admin];
    }

    private function makeRange(Carrier $carrier, float $from, float $to, array $prices): void
    {
        $range = new CarrierRange();
        $range->forceFill([
            'carrier_id' => $carrier->id,
            'billing_type' => 'weight_based',
            'delimiter1' => $from,
            'delimiter2' => $to,
        ]);
        $range->save();

        foreach ($prices as $zoneId => $price) {
            $rangePrice = new CarrierRangePrice();
            $rangePrice->forceFill([
                'carrier_range_id' => $range->id,
                'zone_id' => $zoneId,
                'price' => $price,
            ]);
            $rangePrice->save();
        }
    }

    private function makeAddressFor(User $user, string $stateName, string $cityName): Address
    {
        $state = State::where('name', $stateName)->firstOrFail();
        $city = City::where('name', $cityName)->firstOrFail();

        $address = new Address();
        $address->forceFill([
            'user_id' => $user->id,
            'address' => '42 Temple Street',
            'country_id' => 1,
            'state_id' => $state->id,
            'city_id' => $city->id,
            'postal_code' => '600001',
            'phone' => '9876543210',
            'set_default' => 1,
        ]);
        $address->save();

        return $address;
    }

    private function makeProductFor(User $admin, int $weightInGrams): Product
    {
        $product = Product::create([
            'name' => 'Poondu Thokku',
            'slug' => 'poondu-thokku-' . uniqid(),
            'added_by' => 'admin',
            'user_id' => $admin->id,
            'unit_price' => 250,
            'purchase_price' => 150,
            'published' => 1,
            'approved' => 1,
            'current_stock' => 10,
            'cash_on_delivery' => 0,
            'weight' => $weightInGrams,
            'digital' => 0,
            'discount_start_date' => null,
        ]);

        ProductStock::create([
            'product_id' => $product->id,
            'variant' => '',
            'sku' => 'PT-' . uniqid(),
            'price' => 250,
            'qty' => 10,
        ]);

        return $product;
    }

    private function makeCart(User $customer, User $admin, Product $product, int $quantity): Cart
    {
        return Cart::create([
            'user_id' => $customer->id,
            'owner_id' => $admin->id,
            'product_id' => $product->id,
            'variation' => '',
            'price' => 250,
            'tax' => 0,
            'shipping_cost' => 0,
            'discount' => 0,
            'quantity' => $quantity,
            'status' => 1,
        ]);
    }

    private function apiHeaders(): array
    {
        return [
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ];
    }
}
