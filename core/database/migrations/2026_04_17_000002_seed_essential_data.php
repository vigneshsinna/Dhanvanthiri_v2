<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        $this->ensureSeedPrerequisiteTables();

        // ── Admin User ──────────────────────────────────────────
        $adminExists = DB::table('users')->where('user_type', 'admin')->exists();
        if (!$adminExists) {
            // Check if user id 9 exists (demo data expects admin at id 9)
            $existingUser = DB::table('users')->where('email', 'admin@animazon.local')->first();
            if (!$existingUser) {
                DB::table('users')->insert([
                    'name' => 'Admin',
                    'email' => 'admin@animazon.local',
                    'user_type' => 'admin',
                    'email_verified_at' => now(),
                    'password' => Hash::make('Admin@123'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('users')->where('id', $existingUser->id)->update(['user_type' => 'admin']);
            }
        }

        // ── Default Currency (INR) ──────────────────────────────
        if (DB::table('currencies')->count() === 0) {
            DB::table('currencies')->insert([
                ['name' => 'Indian Rupee', 'symbol' => '₹', 'exchange_rate' => 1.0, 'status' => 1, 'code' => 'INR', 'system_default' => 1, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 0.012, 'status' => 1, 'code' => 'USD', 'system_default' => 0, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // ── Default Language ────────────────────────────────────
        if (DB::table('languages')->count() === 0) {
            DB::table('languages')->insert([
                'name' => 'English',
                'code' => 'en',
                'rtl' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── Essential Business Settings ─────────────────────────
        $settings = [
            ['type' => 'system_default_currency', 'value' => '1'],
            ['type' => 'system_default_language', 'value' => 'en'],
            ['type' => 'site_name', 'value' => 'Dhanvanthiri Foods'],
            ['type' => 'site_motto', 'value' => 'Traditional Indian Foods'],
            ['type' => 'site_icon', 'value' => null],
            ['type' => 'system_logo_white', 'value' => null],
            ['type' => 'system_logo_black', 'value' => null],
            ['type' => 'header_logo', 'value' => null],
            ['type' => 'footer_logo', 'value' => null],
            ['type' => 'admin_login_background', 'value' => null],
            ['type' => 'admin_login_sidebar', 'value' => null],
            ['type' => 'vendor_commission', 'value' => '0'],
            ['type' => 'vendor_commission_activation', 'value' => '0'],
            ['type' => 'seller_product_manage', 'value' => '1'],
            ['type' => 'classified_product', 'value' => '0'],
            ['type' => 'wallet_system', 'value' => '0'],
            ['type' => 'coupon_system', 'value' => '1'],
            ['type' => 'pickup_point', 'value' => '0'],
            ['type' => 'conversation_system', 'value' => '0'],
            ['type' => 'guest_checkout_active', 'value' => '1'],
            ['type' => 'maintenance_mode', 'value' => '0'],
            ['type' => 'seller_verification_form', 'value' => '[]'],
            ['type' => 'active_theme', 'value' => 'classic'],
            ['type' => 'header_style', 'value' => 'header_one'],
            ['type' => 'header_nav_menu', 'value' => '[]'],
            ['type' => 'home_slider_images', 'value' => '[]'],
            ['type' => 'home_slider_links', 'value' => '[]'],
            ['type' => 'home_banner1_images', 'value' => '[]'],
            ['type' => 'home_banner1_links', 'value' => '[]'],
            ['type' => 'home_banner2_images', 'value' => '[]'],
            ['type' => 'home_banner2_links', 'value' => '[]'],
            ['type' => 'home_banner3_images', 'value' => '[]'],
            ['type' => 'home_banner3_links', 'value' => '[]'],
            ['type' => 'home_categories', 'value' => '[]'],
            ['type' => 'top_brands', 'value' => '[]'],
            ['type' => 'top_10_categories', 'value' => '[]'],
            ['type' => 'top_10_brands', 'value' => '[]'],
            ['type' => 'best_selling', 'value' => '1'],
            ['type' => 'home_default_currency', 'value' => '1'],
            ['type' => 'cash_payment', 'value' => '0'],
            ['type' => 'razorpay', 'value' => '1'],
            ['type' => 'phonepe_payment', 'value' => '1'],
            ['type' => 'facebook_login', 'value' => '0'],
            ['type' => 'google_login', 'value' => '0'],
            ['type' => 'twitter_login', 'value' => '0'],
            ['type' => 'paypal_payment', 'value' => '0'],
            ['type' => 'stripe_payment', 'value' => '0'],
            ['type' => 'sslcommerz_payment', 'value' => '0'],
            ['type' => 'instamojo_payment', 'value' => '0'],
            ['type' => 'paystack', 'value' => '0'],
            ['type' => 'voguepay', 'value' => '0'],
            ['type' => 'email_verification', 'value' => '0'],
            ['type' => 'product_approve_by_admin', 'value' => '1'],
            ['type' => 'shipping_type', 'value' => 'flat_rate'],
            ['type' => 'flat_rate_shipping_cost', 'value' => '0'],
            ['type' => 'product_manage_by_admin', 'value' => '0'],
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('business_settings')->where('type', $setting['type'])->exists();
            if (!$exists) {
                DB::table('business_settings')->insert(array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // ── Dhanvanthiri Categories ─────────────────────────────
        if (DB::table('categories')->count() === 0) {
            $cats = [
                ['id' => 1, 'parent_id' => 0, 'level' => 0, 'name' => 'Thokku', 'slug' => 'thokku', 'featured' => 1, 'top' => 1, 'order_level' => 0, 'commision_rate' => 0, 'digital' => 0],
                ['id' => 2, 'parent_id' => 0, 'level' => 0, 'name' => 'Urukai', 'slug' => 'urukai', 'featured' => 1, 'top' => 1, 'order_level' => 0, 'commision_rate' => 0, 'digital' => 0],
                ['id' => 3, 'parent_id' => 0, 'level' => 0, 'name' => 'Podi', 'slug' => 'podi', 'featured' => 1, 'top' => 1, 'order_level' => 0, 'commision_rate' => 0, 'digital' => 0],
            ];
            foreach ($cats as $cat) {
                DB::table('categories')->insert(array_merge($cat, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
            // Add translations
            foreach ($cats as $cat) {
                DB::table('category_translations')->insert([
                    'category_id' => $cat['id'],
                    'name' => $cat['name'],
                    'lang' => 'en',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down()
    {
        // No need to rollback seed data individually
    }

    private function ensureSeedPrerequisiteTables(): void
    {
        if (!Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('code')->nullable();
                $table->tinyInteger('rtl')->default(0);
                $table->tinyInteger('status')->default(1);
                $table->string('app_lang_code', 100)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('business_settings')) {
            Schema::create('business_settings', function (Blueprint $table) {
                $table->id();
                $table->string('type')->nullable();
                $table->text('value')->nullable();
                $table->string('lang')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('translations')) {
            Schema::create('translations', function (Blueprint $table) {
                $table->id();
                $table->string('lang')->nullable();
                $table->string('lang_key')->nullable();
                $table->text('lang_value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('app_translations')) {
            Schema::create('app_translations', function (Blueprint $table) {
                $table->id();
                $table->string('lang')->nullable();
                $table->string('lang_key')->nullable();
                $table->text('lang_value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('category_translations')) {
            Schema::create('category_translations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('category_id');
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }
    }
};
