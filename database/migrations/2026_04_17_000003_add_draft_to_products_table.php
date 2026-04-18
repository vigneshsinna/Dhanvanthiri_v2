<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDraftToProductsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'draft')) {
            Schema::table('products', function (Blueprint $table) {
                $table->tinyInteger('draft')->default(0)->after('wholesale_product');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'draft')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('draft');
            });
        }
    }
}
