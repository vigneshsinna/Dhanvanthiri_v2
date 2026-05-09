<?php

use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        $mediaColumns = collect([
            'photos',
            'thumbnail_img',
            'meta_img',
            'short_video',
            'short_video_thumbnail',
        ])->filter(fn ($column) => Schema::hasColumn('products', $column))->values();

        if ($mediaColumns->isEmpty()) {
            return;
        }

        DB::table('products')
            ->select(array_merge(['id'], $mediaColumns->all()))
            ->orderBy('id')
            ->chunkById(100, function ($products) use ($mediaColumns) {
                foreach ($products as $product) {
                    $updates = [];

                    foreach ($mediaColumns as $column) {
                        $value = $product->{$column};
                        $sanitized = $column === 'thumbnail_img' || $column === 'meta_img'
                            ? Product::sanitizeSingleMediaReference($value)
                            : Product::sanitizeMediaReference($value);

                        if ($sanitized !== $value) {
                            $updates[$column] = $sanitized;
                        }
                    }

                    if (!empty($updates)) {
                        DB::table('products')->where('id', $product->id)->update($updates);
                    }
                }
            });
    }

    public function down(): void
    {
        // Data cleanup is intentionally irreversible.
    }
};
