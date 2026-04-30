<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGuestCheckoutSessionsTable extends Migration
{
    public function up(): void
    {
        Schema::create('guest_checkout_sessions', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('guest_user_id');
            $table->string('temp_user_id')->nullable();
            $table->string('guest_checkout_token_hash')->unique();
            $table->string('status');
            $table->unsignedInteger('combined_order_id')->nullable();
            $table->string('order_code')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['guest_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_checkout_sessions');
    }
}
