<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $dtdcCarrierIds = DB::table('carriers')
            ->whereRaw('LOWER(name) = ?', ['dtdc'])
            ->pluck('id');

        if ($dtdcCarrierIds->isNotEmpty()) {
            DB::table('carrier_range_prices')
                ->whereIn('carrier_range_id', function ($query) use ($dtdcCarrierIds) {
                    $query->select('id')
                        ->from('carrier_ranges')
                        ->whereIn('carrier_id', $dtdcCarrierIds);
                })
                ->whereIn('zone_id', [1, 2])
                ->delete();
        }

        $stCarrierIds = DB::table('carriers')
            ->whereRaw('LOWER(name) = ?', ['st courier'])
            ->pluck('id');

        if ($stCarrierIds->isNotEmpty()) {
            $southIndiaPrices = [
                ['from' => 0, 'to' => 0.5, 'price' => 90],
                ['from' => 0.5, 'to' => 1.0, 'price' => 150],
                ['from' => 1.0, 'to' => 2.0, 'price' => 240],
                ['from' => 2.0, 'to' => 5.0, 'price' => 380],
            ];

            foreach ($southIndiaPrices as $southIndiaPrice) {
                $rangeIds = DB::table('carrier_ranges')
                    ->whereIn('carrier_id', $stCarrierIds)
                    ->where('billing_type', 'weight_based')
                    ->where('delimiter1', $southIndiaPrice['from'])
                    ->where('delimiter2', $southIndiaPrice['to'])
                    ->pluck('id');

                foreach ($rangeIds as $rangeId) {
                    DB::table('carrier_range_prices')->updateOrInsert(
                        ['carrier_range_id' => $rangeId, 'zone_id' => 2],
                        ['price' => $southIndiaPrice['price'], 'updated_at' => now()]
                    );
                }
            }

            DB::table('carrier_range_prices')
                ->whereIn('carrier_range_id', function ($query) use ($stCarrierIds) {
                    $query->select('id')
                        ->from('carrier_ranges')
                        ->whereIn('carrier_id', $stCarrierIds);
                })
                ->where('zone_id', 3)
                ->delete();
        }

        DB::table('business_settings')->updateOrInsert(
            ['type' => 'shipping_type'],
            ['value' => 'carrier_wise_shipping', 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        // Zone availability is admin-controlled through carrier range prices,
        // so this migration intentionally does not recreate deleted rates.
    }
};
