<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (!Schema::hasColumn('conversations', 'receiver_viewed')) {
                    $table->tinyInteger('receiver_viewed')->default(0);
                }
                if (!Schema::hasColumn('conversations', 'sender_viewed')) {
                    $table->tinyInteger('sender_viewed')->default(0);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (Schema::hasColumn('conversations', 'receiver_viewed')) {
                    $table->dropColumn('receiver_viewed');
                }
                if (Schema::hasColumn('conversations', 'sender_viewed')) {
                    $table->dropColumn('sender_viewed');
                }
            });
        }
    }
};
