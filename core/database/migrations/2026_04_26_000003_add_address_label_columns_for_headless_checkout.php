<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('addresses')) {
            return;
        }

        Schema::table('addresses', function (Blueprint $table): void {
            if (!Schema::hasColumn('addresses', 'country_name')) {
                $table->string('country_name')->nullable()->after('city_id');
            }
            if (!Schema::hasColumn('addresses', 'state_name')) {
                $table->string('state_name')->nullable()->after('country_name');
            }
            if (!Schema::hasColumn('addresses', 'city_name')) {
                $table->string('city_name')->nullable()->after('state_name');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('addresses')) {
            return;
        }

        Schema::table('addresses', function (Blueprint $table): void {
            foreach (['city_name', 'state_name', 'country_name'] as $column) {
                if (Schema::hasColumn('addresses', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
