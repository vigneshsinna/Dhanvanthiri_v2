<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair existing Hostinger databases where tables were created manually
     * before the full local schema was turned into Laravel migrations.
     */
    public function up(): void
    {
        $tinyIntegerStatuses = [
            'affiliate_logs' => 0,
            'affiliate_options' => 0,
            'affiliate_users' => 0,
            'areas' => 1,
            'blogs' => 1,
            'carriers' => 1,
            'carts' => 1,
            'cities' => 1,
            'contacts' => 0,
            'countries' => 1,
            'coupons' => 1,
            'currencies' => 1,
            'custom_alerts' => 0,
            'custom_sale_alerts' => 1,
            'customer_products' => 0,
            'dynamic_popups' => 0,
            'elements' => 1,
            'email_templates' => 1,
            'faqs' => 1,
            'flash_deals' => 0,
            'languages' => 1,
            'manual_payment_methods' => 1,
            'notification_types' => 1,
            'pages' => 1,
            'payment_methods' => 1,
            'reviews' => 1,
            'shipping_systems' => 0,
            'sms_templates' => 0,
            'states' => 1,
            'top_banners' => 1,
        ];

        foreach ($tinyIntegerStatuses as $tableName => $default) {
            $this->addTinyIntegerStatus($tableName, $default);
        }

        $stringStatuses = [
            'affiliate_withdraw_requests' => ['length' => 20, 'default' => 'pending', 'nullable' => false],
            'guest_checkout_sessions' => ['length' => 191, 'default' => 'active', 'nullable' => false],
            'payku_transactions' => ['length' => 191, 'default' => null, 'nullable' => true],
            'preorders' => ['length' => 20, 'default' => 'pending', 'nullable' => false],
            'proxy_payments' => ['length' => 20, 'default' => 'pending', 'nullable' => false],
            'seller_withdraw_requests' => ['length' => 20, 'default' => 'pending', 'nullable' => false],
            'tickets' => ['length' => 20, 'default' => 'pending', 'nullable' => false],
        ];

        foreach ($stringStatuses as $tableName => $definition) {
            $this->addStringStatus($tableName, $definition);
        }
    }

    public function down(): void
    {
        $tables = [
            'affiliate_logs',
            'affiliate_options',
            'affiliate_users',
            'affiliate_withdraw_requests',
            'areas',
            'blogs',
            'carriers',
            'carts',
            'cities',
            'contacts',
            'countries',
            'coupons',
            'currencies',
            'custom_alerts',
            'custom_sale_alerts',
            'customer_products',
            'dynamic_popups',
            'elements',
            'email_templates',
            'faqs',
            'flash_deals',
            'guest_checkout_sessions',
            'languages',
            'manual_payment_methods',
            'notification_types',
            'pages',
            'payku_transactions',
            'payment_methods',
            'preorders',
            'proxy_payments',
            'reviews',
            'seller_withdraw_requests',
            'shipping_systems',
            'sms_templates',
            'states',
            'tickets',
            'top_banners',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'status')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('status');
                });
            }
        }
    }

    private function addTinyIntegerStatus(string $tableName, int $default): void
    {
        if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'status')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($default) {
            $table->tinyInteger('status')->default($default);
        });
    }

    private function addStringStatus(string $tableName, array $definition): void
    {
        if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'status')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($definition) {
            $column = $table->string('status', $definition['length']);

            if ($definition['nullable']) {
                $column->nullable();
            } else {
                $column->default($definition['default']);
            }
        });
    }
};
