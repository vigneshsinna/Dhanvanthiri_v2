<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payment_methods')) {
            return;
        }

        if (!Schema::hasColumn('payment_methods', 'active')) {
            Schema::table('payment_methods', function (Blueprint $table) {
                $table->tinyInteger('active')->default(0);
            });
        }

        if (!Schema::hasColumn('payment_methods', 'addon_identifier')) {
            Schema::table('payment_methods', function (Blueprint $table) {
                $table->string('addon_identifier', 191)->nullable();
            });
        }

        if (!Schema::hasColumn('payment_methods', 'status')) {
            Schema::table('payment_methods', function (Blueprint $table) {
                $table->tinyInteger('status')->default(1);
            });
        }

        $now = Carbon::now();
        foreach ($this->paymentMethodNames() as $name) {
            $exists = DB::table('payment_methods')->where('name', $name)->exists();
            DB::table('payment_methods')->updateOrInsert(
                ['name' => $name],
                [
                    'image' => null,
                    'active' => 0,
                    'status' => 1,
                    'addon_identifier' => null,
                    'updated_at' => $now,
                    'created_at' => $exists ? DB::raw('created_at') : $now,
                ]
            );
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('payment_methods')) {
            return;
        }

        Schema::table('payment_methods', function (Blueprint $table) {
            if (Schema::hasColumn('payment_methods', 'active')) {
                $table->dropColumn('active');
            }

            if (Schema::hasColumn('payment_methods', 'addon_identifier')) {
                $table->dropColumn('addon_identifier');
            }
        });
    }

    private function paymentMethodNames(): array
    {
        return [
            'paypal',
            'stripe',
            'sslcommerz',
            'instamojo',
            'razorpay',
            'paystack',
            'voguepay',
            'payhere',
            'ngenius',
            'iyzico',
            'nagad',
            'bkash',
            'aamarpay',
            'authorizenet',
            'payku',
            'mercadopago',
            'paymob',
            'tap',
        ];
    }
};
