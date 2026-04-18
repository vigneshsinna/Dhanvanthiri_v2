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
            $table->string('tamil_name')->nullable()->after('name');
            $table->string('badge')->nullable()->after('tamil_name');
            $table->text('chips')->nullable()->after('badge'); // JSON
            $table->string('taste_profile')->nullable()->after('chips');
            $table->text('pair_with')->nullable()->after('taste_profile'); // JSON
            $table->text('about')->nullable()->after('pair_with');
            $table->text('why_love')->nullable()->after('about'); // JSON
            $table->string('storage')->nullable()->after('why_love');
            $table->boolean('is_premium')->default(false)->after('storage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'tamil_name', 'badge', 'chips', 'taste_profile', 
                'pair_with', 'about', 'why_love', 'storage', 'is_premium'
            ]);
        });
    }
};
