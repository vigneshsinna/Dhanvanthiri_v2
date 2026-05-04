<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Insert GST 5% tax record if not already present
        $existing = DB::table('taxes')->where('name', 'GST 5%')->first();
        if (!$existing) {
            DB::table('taxes')->insert([
                'name'       => 'GST 5%',
                'tax_rate'   => 5,
                'tax_status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $taxId = DB::table('taxes')->where('name', 'GST 5%')->value('id');

        // Update all products to set tax=5, tax_type='percent'
        DB::table('products')->update([
            'tax'      => 5,
            'tax_type' => 'percent',
        ]);

        // Populate product_taxes pivot for all products (skip already inserted)
        $productIds = DB::table('products')->pluck('id');
        foreach ($productIds as $productId) {
            $exists = DB::table('product_taxes')
                ->where('product_id', $productId)
                ->where('tax_id', $taxId)
                ->exists();
            if (!$exists) {
                DB::table('product_taxes')->insert([
                    'product_id' => $productId,
                    'tax_id'     => $taxId,
                    'tax'        => 5,
                    'tax_type'   => 'percent',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $taxId = DB::table('taxes')->where('name', 'GST 5%')->value('id');
        if ($taxId) {
            DB::table('product_taxes')->where('tax_id', $taxId)->delete();
            DB::table('taxes')->where('id', $taxId)->delete();
        }
        DB::table('products')->update(['tax' => null, 'tax_type' => null]);
    }
};
