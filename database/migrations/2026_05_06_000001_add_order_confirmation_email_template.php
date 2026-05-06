<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('email_templates')) {
            return;
        }

        Schema::table('email_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('email_templates', 'receiver')) {
                $table->string('receiver', 50)->nullable();
            }
            if (!Schema::hasColumn('email_templates', 'identifier')) {
                $table->string('identifier')->nullable();
            }
            if (!Schema::hasColumn('email_templates', 'email_type')) {
                $table->string('email_type')->nullable();
            }
            if (!Schema::hasColumn('email_templates', 'default_text')) {
                $table->longText('default_text')->nullable();
            }
            if (!Schema::hasColumn('email_templates', 'is_status_changeable')) {
                $table->tinyInteger('is_status_changeable')->default(1);
            }
            if (!Schema::hasColumn('email_templates', 'is_dafault_text_editable')) {
                $table->tinyInteger('is_dafault_text_editable')->default(1);
            }
            if (!Schema::hasColumn('email_templates', 'addon')) {
                $table->string('addon')->nullable();
            }
        });

        $body = '<p><strong>Dear [[customer_name]],</strong></p>'
            . '<p>Thank you for your order from [[store_name]]. Your order has been confirmed successfully.</p>'
            . '<p><strong>Order Number:</strong> [[order_number]]<br>'
            . '<strong>Order Date:</strong> [[order_date]]<br>'
            . '<strong>Order Total:</strong> [[order_amount]]</p>'
            . '<p><strong>Order Items</strong></p>'
            . '[[order_items]]'
            . '<p>Your invoice and order details are included below for your records.</p>'
            . '<p>For order support, contact us at [[contact_email]] or call [[contact_phone]].</p>'
            . '<p>Best regards,<br>The [[store_name]] Team</p>';

        $columns = Schema::getColumnListing('email_templates');
        $values = array_intersect_key([
            'receiver' => 'customer',
            'email_type' => 'Order Confirmation',
            'name' => 'Order Confirmation',
            'type' => 'customer',
            'subject' => 'Order Confirmation - [[order_number]]',
            'default_text' => $body,
            'body' => $body,
            'status' => 1,
            'is_status_changeable' => 1,
            'is_dafault_text_editable' => 1,
            'addon' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ], array_flip($columns));

        DB::table('email_templates')->updateOrInsert(
            ['identifier' => 'order_confirmation_email_to_customer'],
            $values
        );
    }

    public function down(): void
    {
        if (Schema::hasTable('email_templates') && Schema::hasColumn('email_templates', 'identifier')) {
            DB::table('email_templates')
                ->where('identifier', 'order_confirmation_email_to_customer')
                ->delete();
        }
    }
};
