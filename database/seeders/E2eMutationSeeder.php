<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class E2eMutationSeeder extends Seeder
{
    public function run(): void
    {
        if (!filter_var(env('E2E_ALLOW_MUTATION', false), FILTER_VALIDATE_BOOLEAN)) {
            throw new \RuntimeException('Refusing to seed the disposable E2E mutation database without E2E_ALLOW_MUTATION=true.');
        }

        $now = now();
        $adminEmail = env('E2E_ADMIN_EMAIL', 'admin@animazon.local');
        $adminPassword = env('E2E_ADMIN_PASSWORD', 'Admin@123');
        $customerEmail = env('E2E_CUSTOMER_EMAIL', 'customer@animazon.local');
        $customerPassword = env('E2E_CUSTOMER_PASSWORD', 'Customer@123');

        DB::table('users')->updateOrInsert(
            ['id' => 1],
            [
                'name' => 'E2E Admin',
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'user_type' => 'admin',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $admin = \App\Models\User::find(1);
        if ($admin && class_exists(Role::class) && Role::where('name', 'Super Admin')->exists()) {
            $admin->assignRole('Super Admin');
        }

        $customerId = DB::table('users')->updateOrInsert(
            ['email' => $customerEmail],
            [
                'name' => 'E2E Customer',
                'password' => Hash::make($customerPassword),
                'user_type' => 'customer',
                'email_verified_at' => $now,
                'phone' => '9999999999',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $customer = DB::table('users')->where('email', $customerEmail)->first();
        if ($customer) {
            DB::table('customers')->updateOrInsert(
                ['user_id' => $customer->id],
                ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $this->call(DhanvathiriProductsSeeder::class);

        if (class_exists(\StorefrontContentSeeder::class)) {
            $this->call(\StorefrontContentSeeder::class);
        }

        if (class_exists(\DhanvathiriOrdersSeeder::class)) {
            $this->call(\DhanvathiriOrdersSeeder::class);
        }

        DB::table('business_settings')->updateOrInsert(
            ['type' => 'website_name'],
            ['value' => 'Dhanvanthiri Foods E2E', 'created_at' => $now, 'updated_at' => $now]
        );

        foreach ([
            'guest_checkout_active' => '1',
            'coupon_system' => '1',
            'shipping_type' => 'flat_rate',
            'flat_rate_shipping_cost' => '50',
            'cash_payment' => '1',
        ] as $type => $value) {
            DB::table('business_settings')->updateOrInsert(
                ['type' => $type],
                ['value' => $value, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        if (!$customer) {
            return;
        }

        DB::table('countries')->updateOrInsert(
            ['id' => 101],
            ['code' => 'IN', 'name' => 'India', 'status' => 1, 'zone_id' => 1, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('states')->updateOrInsert(
            ['id' => 1],
            ['name' => 'Tamil Nadu', 'country_id' => 101, 'status' => 1, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('cities')->updateOrInsert(
            ['id' => 1],
            ['name' => 'Chennai', 'state_id' => 1, 'country_id' => 101, 'cost' => 50, 'status' => 1, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('zones')->updateOrInsert(
            ['id' => 1],
            ['name' => 'E2E Shipping Zone', 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('areas')->updateOrInsert(
            ['id' => 1],
            ['name' => 'E2E Chennai Area', 'city_id' => 1, 'cost' => 50, 'status' => 1, 'created_at' => $now, 'updated_at' => $now]
        );

        DB::table('addresses')->updateOrInsert(
            ['user_id' => $customer->id, 'set_default' => 1],
            [
                'address' => 'E2E Disposable Address, Chennai',
                'country_id' => 101,
                'state_id' => 1,
                'city_id' => 1,
                'area_id' => 1,
                'postal_code' => '600001',
                'phone' => '9999999999',
                'latitude' => 13.0827,
                'longitude' => 80.2707,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('coupons')->updateOrInsert(
            ['code' => 'E2E10'],
            [
                'user_id' => 1,
                'type' => 'cart_base',
                'details' => json_encode(['min_buy' => 100, 'max_discount' => 100]),
                'discount' => 10,
                'discount_type' => 'percent',
                'start_date' => now()->subDay()->timestamp,
                'end_date' => now()->addMonth()->timestamp,
                'status' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $product = Schema::hasTable('products') ? DB::table('products')->first() : null;
        if ($product) {
            DB::table('combined_orders')->updateOrInsert(
                ['id' => 9001],
                ['user_id' => $customer->id, 'grand_total' => 230, 'created_at' => $now, 'updated_at' => $now]
            );
            DB::table('orders')->updateOrInsert(
                ['id' => 9001],
                [
                    'combined_order_id' => 9001,
                    'user_id' => $customer->id,
                    'seller_id' => $product->user_id ?? 1,
                    'shipping_address' => json_encode([
                        'recipient_name' => 'E2E Customer',
                        'line_1' => 'E2E Disposable Address, Chennai',
                        'city' => 'Chennai',
                        'state' => 'Tamil Nadu',
                        'postal_code' => '600001',
                        'phone' => '9999999999',
                    ]),
                    'delivery_status' => 'delivered',
                    'payment_type' => 'cash_on_delivery',
                    'payment_status' => 'paid',
                    'grand_total' => 230,
                    'coupon_discount' => 0,
                    'code' => 'E2E-ORDER-9001',
                    'tracking_code' => 'E2E-TRACK-9001',
                    'shipping_type' => 'home_delivery',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
            DB::table('order_details')->updateOrInsert(
                ['id' => 9001],
                [
                    'order_id' => 9001,
                    'seller_id' => $product->user_id ?? 1,
                    'product_id' => $product->id,
                    'variation' => '250g',
                    'price' => 180,
                    'tax' => 0,
                    'shipping_cost' => 50,
                    'quantity' => 1,
                    'payment_status' => 'paid',
                    'delivery_status' => 'delivered',
                    'shipping_type' => 'home_delivery',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
