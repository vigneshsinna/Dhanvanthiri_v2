<?php

namespace Tests\Feature\Api\V2\Concerns;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

trait InteractsWithGuestCheckoutSchema
{
    protected function setUpGuestCheckoutSchema(): void
    {
        $this->resetGuestCheckoutSchema();
        $this->createGuestCheckoutBaseSchema();
        $this->runGuestCheckoutMigrationsIfPresent();
    }

    protected function resetGuestCheckoutSchema(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ([
            'guest_checkout_sessions',
            'carts',
            'addresses',
            'users',
            'business_settings',
            'migrations',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::enableForeignKeyConstraints();
    }

    protected function createGuestCheckoutBaseSchema(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('provider_id')->nullable();
            $table->string('verification_code')->nullable();
            $table->string('user_type')->default('customer');
            $table->unsignedTinyInteger('banned')->default(0);
            $table->unsignedInteger('avatar')->nullable();
            $table->unsignedInteger('avatar_original')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('addresses', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('user_id')->nullable();
            $table->text('address')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->string('country_name')->nullable();
            $table->string('state_name')->nullable();
            $table->string('city_name')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();
            $table->unsignedTinyInteger('set_default')->default(0);
            $table->timestamps();
        });

        Schema::create('carts', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('user_id')->nullable();
            $table->string('temp_user_id')->nullable();
            $table->unsignedInteger('owner_id')->nullable();
            $table->unsignedInteger('product_id')->nullable();
            $table->string('variation')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->string('product_referral_code')->nullable();
            $table->string('coupon_code')->nullable();
            $table->unsignedTinyInteger('coupon_applied')->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('address_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->string('shipping_type')->nullable();
            $table->unsignedInteger('pickup_point')->nullable();
            $table->unsignedInteger('carrier_id')->nullable();
            $table->timestamps();
        });

        Schema::create('business_settings', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('type')->nullable();
            $table->longText('value')->nullable();
            $table->timestamps();
        });
    }

    protected function runGuestCheckoutMigrationsIfPresent(): void
    {
        foreach ([
            base_path('database/migrations/2026_04_15_000001_add_guest_flags_to_users_table.php'),
            base_path('database/migrations/2026_04_15_000002_create_guest_checkout_sessions_table.php'),
        ] as $migrationPath) {
            if (! is_file($migrationPath)) {
                continue;
            }

            Artisan::call('migrate', [
                '--path' => $migrationPath,
                '--realpath' => true,
                '--force' => true,
            ]);
        }
    }
}
