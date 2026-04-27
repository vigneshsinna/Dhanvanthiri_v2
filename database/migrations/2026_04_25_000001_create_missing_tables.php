<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates tables that were missing from the original consolidated migration.
 * These tables are referenced by Eloquent models, Spatie Permission package,
 * and Laravel framework features but were never defined in any migration file.
 *
 * Source of truth: local XAMPP database at animazon.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Addons ──────────────────────────────────────────────
        if (!Schema::hasTable('addons')) {
            Schema::create('addons', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('unique_identifier')->nullable()->index();
                $table->string('version')->nullable();
                $table->boolean('activated')->default(0);
                $table->string('image')->nullable();
                $table->timestamps();
            });
        }

        // ── Spatie Permission: model_has_permissions ─────────────
        if (!Schema::hasTable('model_has_permissions')) {
            Schema::create('model_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->index(['model_id', 'model_type'], 'model_has_permissions_model_id_model_type_index');
                $table->foreign('permission_id')
                    ->references('id')
                    ->on('permissions')
                    ->onDelete('cascade');
                $table->primary(['permission_id', 'model_id', 'model_type'],
                    'model_has_permissions_permission_model_type_primary');
            });
        }

        // ── Spatie Permission: model_has_roles ───────────────────
        if (!Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->index(['model_id', 'model_type'], 'model_has_roles_model_id_model_type_index');
                $table->foreign('role_id')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
                $table->primary(['role_id', 'model_id', 'model_type'],
                    'model_has_roles_role_model_type_primary');
            });
        }

        // ── Spatie Permission: role_has_permissions ──────────────
        if (!Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->unsignedBigInteger('role_id');
                $table->foreign('permission_id')
                    ->references('id')
                    ->on('permissions')
                    ->onDelete('cascade');
                $table->foreign('role_id')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
                $table->primary(['permission_id', 'role_id'],
                    'role_has_permissions_permission_id_role_id_primary');
            });
        }

        // ── Social Credentials ──────────────────────────────────
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

        // ── Payku Payments ──────────────────────────────────────
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

        // ── Payku Transactions ──────────────────────────────────
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

        // ── Sessions ────────────────────────────────────────────
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }

        // ── Failed Jobs ─────────────────────────────────────────
        if (!Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        // ── Jobs ────────────────────────────────────────────────
        if (!Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        // ── Notifications ───────────────────────────────────────
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }

        // ── Cache ───────────────────────────────────────────────
        if (!Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->integer('expiration');
            });
        }

        if (!Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->integer('expiration');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('payku_transactions');
        Schema::dropIfExists('payku_payments');
        Schema::dropIfExists('social_credentials');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('addons');
    }
};
