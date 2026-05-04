<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'hsn_code')) {
                $table->string('hsn_code', 20)->nullable()->after('tax_type');
            }
            if (!Schema::hasColumn('products', 'gst_rate')) {
                $table->double('gst_rate', 20, 2)->default(0)->after('hsn_code');
            }
        });

        Schema::table('order_details', function (Blueprint $table) {
            if (!Schema::hasColumn('order_details', 'gst_rate')) {
                $table->double('gst_rate', 20, 2)->nullable()->after('tax');
            }
            if (!Schema::hasColumn('order_details', 'gst_amount')) {
                $table->double('gst_amount', 20, 2)->nullable()->after('gst_rate');
            }
            if (!Schema::hasColumn('order_details', 'coupon_discount')) {
                $table->double('coupon_discount', 20, 2)->default(0)->after('price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['hsn_code', 'gst_rate']);
        });

        Schema::table('order_details', function (Blueprint $table) {
            $table->dropColumn(['gst_rate', 'gst_amount', 'coupon_discount']);
        });
    }
};
