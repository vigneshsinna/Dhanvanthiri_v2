<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table): void {
            if (!Schema::hasColumn('carts', 'shipping_type')) {
                $table->string('shipping_type', 50)->nullable()->after('address_id');
            }
            if (!Schema::hasColumn('carts', 'pickup_point')) {
                $table->unsignedInteger('pickup_point')->default(0)->after('shipping_type');
            }
            if (!Schema::hasColumn('carts', 'carrier_id')) {
                $table->unsignedInteger('carrier_id')->default(0)->after('pickup_point');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table): void {
            foreach (['carrier_id', 'pickup_point', 'shipping_type'] as $column) {
                if (Schema::hasColumn('carts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
