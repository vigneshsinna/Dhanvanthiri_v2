<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. App Translations
        if (!Schema::hasTable('app_translations')) {
            Schema::create('app_translations', function (Blueprint $table) {
                $table->id();
                $table->string('lang', 10)->nullable();
                $table->string('lang_key')->nullable();
                $table->string('lang_value')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add viewed columns to conversations
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

        // 3. Spatie Permission Tables
        if (!Schema::hasTable('model_has_permissions')) {
            Schema::create('model_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->index(['model_id', 'model_type'], 'model_has_permissions_model_id_model_type_index');
                $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
                $table->primary(['permission_id', 'model_id', 'model_type'], 'model_has_permissions_permission_model_type_primary');
            });
        }

        if (!Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->index(['model_id', 'model_type'], 'model_has_roles_model_id_model_type_index');
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
                $table->primary(['role_id', 'model_id', 'model_type'], 'model_has_roles_role_model_type_primary');
            });
        }

        if (!Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->unsignedBigInteger('role_id');
                $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
                $table->primary(['permission_id', 'role_id'], 'role_has_permissions_permission_id_role_id_primary');
            });
        }

        // 4. Social Credentials
        if (!Schema::hasTable('social_credentials')) {
            Schema::create('social_credentials', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('user_id')->unsigned()->nullable();
                $table->string('provider')->nullable();
                $table->string('provider_id')->nullable();
                $table->text('access_token')->nullable();
                $table->text('refresh_token')->nullable();
                $table->timestamps();
            });
        }

        // 5. Payku Payments
        if (!Schema::hasTable('payku_payments')) {
            Schema::create('payku_payments', function (Blueprint $table) {
                $table->id();
                $table->string('order_id')->nullable();
                $table->string('transaction_id')->nullable();
                $table->string('status')->nullable();
                $table->string('email')->nullable();
                $table->decimal('amount', 15, 2)->nullable();
                $table->string('currency')->nullable();
                $table->text('payment_url')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('payku_transactions')) {
            Schema::create('payku_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('transaction_id')->nullable();
                $table->string('payment_key')->nullable();
                $table->string('status')->nullable();
                $table->decimal('amount', 15, 2)->nullable();
                $table->string('currency')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payku_transactions');
        Schema::dropIfExists('payku_payments');
        Schema::dropIfExists('social_credentials');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropColumn(['receiver_viewed', 'sender_viewed']);
            });
        }
        
        Schema::dropIfExists('app_translations');
    }
};
