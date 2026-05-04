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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'delivery_viewed')) {
                $table->integer('delivery_viewed')->default(0)->after('viewed');
            }
            if (!Schema::hasColumn('orders', 'payment_status_viewed')) {
                $table->integer('payment_status_viewed')->default(0)->nullable()->after('delivery_viewed');
            }
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (!Schema::hasColumn('personal_access_tokens', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('abilities');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'delivery_viewed')) {
                $table->dropColumn('delivery_viewed');
            }
            if (Schema::hasColumn('orders', 'payment_status_viewed')) {
                $table->dropColumn('payment_status_viewed');
            }
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('personal_access_tokens', 'expires_at')) {
                $table->dropColumn('expires_at');
            }
        });
    }
};
