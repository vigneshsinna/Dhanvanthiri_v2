<?php

namespace Tests\Feature\Api\V2;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartVariantFallbackTest extends TestCase
{
    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    public function test_cart_add_uses_the_single_available_stock_variant_when_request_variant_is_empty(): void
    {
        $customer = $this->makeCustomer();
        $seller = $this->makeAdmin();
        $product = $this->makeProductWithSingleVariant($seller, '250g Jar');

        Sanctum::actingAs($customer);

        $response = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/carts/add', [
            'id' => $product->id,
            'quantity' => 1,
            'variant' => '',
            'user_id' => $customer->id,
            'cost_matrix' => 'headless-storefront',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true);

        $this->assertDatabaseHas('carts', [
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'variation' => '250g Jar',
            'quantity' => 1,
        ]);
    }

    public function test_cart_add_uses_the_single_available_stock_variant_when_request_variant_is_unmatched(): void
    {
        $customer = $this->makeCustomer();
        $seller = $this->makeAdmin();
        $product = $this->makeProductWithSingleVariant($seller, '250g Jar');

        Sanctum::actingAs($customer);

        $response = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->postJson('/api/v2/carts/add', [
            'id' => $product->id,
            'quantity' => 1,
            'variant' => '1',
            'user_id' => $customer->id,
            'cost_matrix' => 'headless-storefront',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', true);

        $this->assertDatabaseHas('carts', [
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'variation' => '250g Jar',
            'quantity' => 1,
        ]);
    }

    private function makeCustomer(): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Cart Customer',
            'email' => 'cart-customer-' . uniqid() . '@example.com',
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
            'name' => 'Cart Admin',
            'email' => 'cart-admin-' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $user->save();

        return $user;
    }

    private function makeProductWithSingleVariant(User $seller, string $variant): Product
    {
        $product = new Product();
        $product->forceFill([
            'name' => 'Cart Variant Product',
            'slug' => 'cart-variant-product-' . uniqid(),
            'added_by' => 'admin',
            'user_id' => $seller->id,
            'unit_price' => 250,
            'purchase_price' => 150,
            'published' => 1,
            'approved' => 1,
            'current_stock' => 10,
            'cash_on_delivery' => 1,
            'discount_start_date' => null,
        ]);
        $product->save();

        $stock = new ProductStock();
        $stock->forceFill([
            'product_id' => $product->id,
            'variant' => $variant,
            'sku' => 'CVP-' . uniqid(),
            'price' => 250,
            'qty' => 10,
        ]);
        $stock->save();

        return $product;
    }
}
