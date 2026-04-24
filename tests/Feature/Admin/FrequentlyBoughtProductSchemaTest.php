<?php

namespace Tests\Feature\Admin;

use App\Services\FrequentlyBoughtProductService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class FrequentlyBoughtProductSchemaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('frequently_bought_products');
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('frequently_bought_products');

        parent::tearDown();
    }

    public function test_category_based_frequently_bought_products_can_be_stored(): void
    {
        $this->artisan('migrate:fresh', [
            '--path' => 'database/migrations/2014_10_12_000000_create_users_table.php',
            '--realpath' => false,
        ])->run();

        $this->artisan('migrate', [
            '--path' => 'database/migrations/2026_04_17_000001_create_all_application_tables.php',
            '--realpath' => false,
        ])->run();

        $this->storeCategoryBasedFrequentlyBoughtProduct();
    }

    public function test_existing_frequently_bought_products_table_is_upgraded_for_categories(): void
    {
        Schema::create('frequently_bought_products', function (Blueprint $table): void {
            $table->id();
            $table->integer('product_id');
            $table->integer('frequently_bought_product_id');
            $table->timestamps();
        });

        $migration = include database_path('migrations/2026_04_24_000001_update_frequently_bought_products_category_support.php');
        $migration->up();

        $this->storeCategoryBasedFrequentlyBoughtProduct();
    }

    private function storeCategoryBasedFrequentlyBoughtProduct(): void
    {
        (new FrequentlyBoughtProductService())->store([
            'product_id' => 10,
            'frequently_bought_selection_type' => 'category',
            'fq_bought_product_category_id' => 4,
        ]);

        $this->assertDatabaseHas('frequently_bought_products', [
            'product_id' => 10,
            'category_id' => 4,
            'frequently_bought_product_id' => null,
        ]);

        self::assertSame(1, DB::table('frequently_bought_products')->count());
    }
}
