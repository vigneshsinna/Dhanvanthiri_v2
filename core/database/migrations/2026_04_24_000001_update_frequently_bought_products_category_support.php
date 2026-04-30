<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('frequently_bought_products')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteTable();
            return;
        }

        Schema::table('frequently_bought_products', function (Blueprint $table): void {
            if (!Schema::hasColumn('frequently_bought_products', 'category_id')) {
                $table->integer('category_id')->nullable()->after('frequently_bought_product_id');
            }
        });

        DB::statement('ALTER TABLE frequently_bought_products MODIFY frequently_bought_product_id INT NULL');
    }

    public function down(): void
    {
        if (!Schema::hasTable('frequently_bought_products')) {
            return;
        }

        if (Schema::hasColumn('frequently_bought_products', 'category_id')) {
            Schema::table('frequently_bought_products', function (Blueprint $table): void {
                $table->dropColumn('category_id');
            });
        }
    }

    private function rebuildSqliteTable(): void
    {
        Schema::create('frequently_bought_products_tmp', function (Blueprint $table): void {
            $table->id();
            $table->integer('product_id');
            $table->integer('frequently_bought_product_id')->nullable();
            $table->integer('category_id')->nullable();
            $table->timestamps();
        });

        $categorySelect = Schema::hasColumn('frequently_bought_products', 'category_id') ? 'category_id' : 'NULL';

        DB::statement(
            'INSERT INTO frequently_bought_products_tmp (id, product_id, frequently_bought_product_id, category_id, created_at, updated_at) ' .
            'SELECT id, product_id, frequently_bought_product_id, ' . $categorySelect . ', created_at, updated_at FROM frequently_bought_products'
        );

        Schema::drop('frequently_bought_products');
        Schema::rename('frequently_bought_products_tmp', 'frequently_bought_products');
    }
};
