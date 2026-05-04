<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('carrier_range_prices')) {
            if (!Schema::hasColumn('carrier_range_prices', 'carrier_id')) {
                Schema::table('carrier_range_prices', function (Blueprint $table) {
                    $table->unsignedBigInteger('carrier_id')->nullable()->after('id');
                    
                    // Add index for performance
                    $table->index('carrier_id');
                });

                // Populate carrier_id from carrier_ranges without UPDATE JOIN so tests can run on SQLite too.
                DB::table('carrier_range_prices')
                    ->join('carrier_ranges', 'carrier_range_prices.carrier_range_id', '=', 'carrier_ranges.id')
                    ->select('carrier_range_prices.id', 'carrier_ranges.carrier_id')
                    ->orderBy('carrier_range_prices.id')
                    ->get()
                    ->each(function ($price) {
                        DB::table('carrier_range_prices')
                            ->where('id', $price->id)
                            ->update(['carrier_id' => $price->carrier_id]);
                    });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('carrier_range_prices')) {
            if (Schema::hasColumn('carrier_range_prices', 'carrier_id')) {
                Schema::table('carrier_range_prices', function (Blueprint $table) {
                    $table->dropColumn('carrier_id');
                });
            }
        }
    }
};
