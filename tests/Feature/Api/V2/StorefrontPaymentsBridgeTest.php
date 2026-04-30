<?php

namespace Tests\Feature\Api\V2;

use App\Models\Address;
use App\Models\Cart;
use App\Models\City;
use App\Models\Country;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\State;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StorefrontPaymentsBridgeTest extends TestCase
{
    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    public function test_authenticated_customer_cannot_create_a_cash_on_delivery_intent_through_the_storefront_bridge(): void
    {
        $customer = $this->makeCustomer();
        $seller = $this->makeAdmin();
        $address = $this->makeAddressFor($customer);
        $product = $this->makeProductFor($seller);

        $cart = new Cart();
        $cart->forceFill([
            'user_id' => $customer->id,
            'owner_id' => $seller->id,
            'product_id' => $product->id,
            'variation' => '',
            'price' => 250,
            'tax' => 0,
            'shipping_cost' => 0,
            'discount' => 0,
            'quantity' => 1,
            'status' => 1,
        ]);
        $cart->save();

        Sanctum::actingAs($customer);

        $response = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/payments/intent', [
            'gateway' => 'cash_on_delivery',
            'shipping_address_id' => $address->id,
            'shipping_method_id' => 1,
            'billing_same_as_shipping' => true,
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('carts', ['id' => $cart->id]);
        $this->assertDatabaseMissing('orders', [
            'user_id' => $customer->id,
            'payment_type' => 'cash_on_delivery',
        ]);
    }

    public function test_payment_confirmation_bridge_validates_required_fields(): void
    {
        $customer = $this->makeCustomer();
        Sanctum::actingAs($customer);

        $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/payments/confirm', [
            'order_id' => 1,
        ])->assertStatus(422);
    }

    private function makeCustomer(): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Checkout Customer',
            'email' => 'customer' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);
        $user->save();

        return $user;
    }

    private function makeAdmin(): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Seller Admin',
            'email' => 'seller' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $user->save();

        return $user;
    }

    private function makeAddressFor(User $user): Address
    {
        $country = Country::first() ?? tap(new Country(), function (Country $country) {
            $country->forceFill(['name' => 'India', 'code' => 'IN', 'status' => 1])->save();
        });

        $state = State::first() ?? tap(new State(), function (State $state) use ($country) {
            $state->forceFill(['name' => 'Tamil Nadu', 'country_id' => $country->id, 'status' => 1])->save();
        });

        $city = City::first() ?? tap(new City(), function (City $city) use ($country, $state) {
            $city->forceFill(['name' => 'Chennai', 'country_id' => $country->id, 'state_id' => $state->id, 'status' => 1])->save();
        });

        $address = new Address();
        $address->forceFill([
            'user_id' => $user->id,
            'address' => '42 Temple Street',
            'country_id' => $country->id,
            'state_id' => $state->id,
            'city_id' => $city->id,
            'postal_code' => '600001',
            'phone' => '9876543210',
            'set_default' => 1,
        ]);
        $address->save();

        return $address;
    }

    private function makeProductFor(User $seller): Product
    {
        $product = new Product();
        $product->forceFill([
            'name' => 'Poondu Thokku',
            'slug' => 'poondu-thokku-' . uniqid(),
            'added_by' => 'admin',
            'user_id' => $seller->id,
            'unit_price' => 250,
            'purchase_price' => 150,
            'published' => 1,
            'approved' => 1,
            'current_stock' => 10,
            'cash_on_delivery' => 0,
            'discount_start_date' => null,
        ]);
        $product->save();

        $stock = new ProductStock();
        $stock->forceFill([
            'product_id' => $product->id,
            'variant' => '',
            'sku' => 'PT-' . uniqid(),
            'price' => 250,
            'qty' => 10,
        ]);
        $stock->save();

        return $product;
    }
}
