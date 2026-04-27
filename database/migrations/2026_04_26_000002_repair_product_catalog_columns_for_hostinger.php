<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        $this->addString('tamil_name');
        $this->addString('badge');
        $this->addText('chips');
        $this->addString('taste_profile');
        $this->addText('pair_with');
        $this->addText('about');
        $this->addText('why_love');
        $this->addString('storage');
        $this->addBoolean('is_premium', false);
        $this->addText('custom_labels');
    }

    public function down(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        $columns = [
            'tamil_name',
            'badge',
            'chips',
            'taste_profile',
            'pair_with',
            'about',
            'why_love',
            'storage',
            'is_premium',
            'custom_labels',
        ];

        foreach ($columns as $column) {
            if (!Schema::hasColumn('products', $column)) {
                continue;
            }

            Schema::table('products', function (Blueprint $table) use ($column) {
                $table->dropColumn($column);
            });
        }
    }

    private function addString(string $column): void
    {
        if (Schema::hasColumn('products', $column)) {
            return;
        }

        Schema::table('products', function (Blueprint $table) use ($column) {
            $table->string($column)->nullable();
        });
    }

    private function addText(string $column): void
    {
        if (Schema::hasColumn('products', $column)) {
            return;
        }

        Schema::table('products', function (Blueprint $table) use ($column) {
            $table->text($column)->nullable();
        });
    }

    private function addBoolean(string $column, bool $default): void
    {
        if (Schema::hasColumn('products', $column)) {
            return;
        }

        Schema::table('products', function (Blueprint $table) use ($column, $default) {
            $table->boolean($column)->default($default);
        });
    }
};
