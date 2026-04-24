<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // ── Users: add missing columns ──────────────────────────
        if (!Schema::hasColumn('users', 'user_type')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('user_type', 20)->default('customer')->after('email');
                $table->string('referred_by')->nullable()->after('id');
                $table->string('provider')->nullable();
                $table->text('refresh_token')->nullable();
                $table->text('access_token')->nullable();
                $table->string('verification_code')->nullable();
                $table->string('new_email_verificiation_code')->nullable();
                $table->string('device_token')->nullable();
                $table->integer('avatar')->nullable();
                $table->string('avatar_original')->nullable();
                $table->string('address')->nullable();
                $table->string('country')->nullable();
                $table->string('state')->nullable();
                $table->string('city')->nullable();
                $table->string('postal_code')->nullable();
                $table->string('phone')->nullable();
                $table->double('balance', 18, 2)->default(0.00);
                $table->tinyInteger('banned')->default(0);
                $table->string('referral_code')->nullable();
                $table->integer('customer_package_id')->nullable();
                $table->integer('remaining_uploads')->default(0);
            });
        }

        // ── Uploads ─────────────────────────────────────────────
        if (!Schema::hasTable('uploads')) {
            Schema::create('uploads', function (Blueprint $table) {
                $table->id();
                $table->string('file_original_name')->nullable();
                $table->string('file_name')->nullable();
                $table->integer('user_id')->nullable();
                $table->integer('file_size')->nullable();
                $table->string('extension', 10)->nullable();
                $table->string('type', 20)->nullable();
                $table->string('external_link')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // ── Categories ──────────────────────────────────────────
        if (!Schema::hasTable('categories')) {
            Schema::create('categories', function (Blueprint $table) {
                $table->id();
                $table->integer('parent_id')->default(0);
                $table->integer('level')->default(0);
                $table->string('name');
                $table->integer('order_level')->default(0);
                $table->double('commision_rate', 8, 2)->default(0);
                $table->string('banner')->nullable();
                $table->string('icon')->nullable();
                $table->string('cover_image')->nullable();
                $table->tinyInteger('featured')->default(0);
                $table->tinyInteger('top')->default(0);
                $table->tinyInteger('digital')->default(0);
                $table->tinyInteger('hot_category')->default(0);
                $table->string('slug')->nullable();
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->double('discount', 18, 2)->default(0);
                $table->integer('discount_start_date')->nullable();
                $table->integer('discount_end_date')->nullable();
                $table->integer('size_chart_id')->nullable();
                $table->timestamps();
            });
        }

        // ── Category Translations ───────────────────────────────
        if (!Schema::hasTable('category_translations')) {
            Schema::create('category_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('category_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Brands ──────────────────────────────────────────────
        if (!Schema::hasTable('brands')) {
            Schema::create('brands', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('logo')->nullable();
                $table->tinyInteger('top')->default(0);
                $table->string('slug')->nullable();
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        // ── Brand Translations ──────────────────────────────────
        if (!Schema::hasTable('brand_translations')) {
            Schema::create('brand_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('brand_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Products ────────────────────────────────────────────
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('added_by', 20)->default('admin');
                $table->integer('user_id');
                $table->integer('category_id')->nullable();
                $table->integer('brand_id')->nullable();
                $table->text('photos')->nullable();
                $table->string('thumbnail_img')->nullable();
                $table->string('video_provider', 20)->nullable();
                $table->string('video_link')->nullable();
                $table->text('tags')->nullable();
                $table->longText('description')->nullable();
                $table->double('unit_price', 18, 2)->default(0);
                $table->double('purchase_price', 18, 2)->nullable();
                $table->tinyInteger('variant_product')->default(0);
                $table->text('attributes')->default('[]');
                $table->text('choice_options')->default('[]');
                $table->text('colors')->default('[]');
                $table->text('variations')->nullable();
                $table->tinyInteger('todays_deal')->default(0);
                $table->tinyInteger('published')->default(1);
                $table->tinyInteger('approved')->default(1);
                $table->string('stock_visibility_state', 20)->default('quantity');
                $table->tinyInteger('cash_on_delivery')->default(1);
                $table->tinyInteger('featured')->default(0);
                $table->tinyInteger('seller_featured')->default(0);
                $table->integer('current_stock')->default(0);
                $table->string('unit', 20)->nullable();
                $table->double('weight', 8, 2)->default(0);
                $table->integer('min_qty')->default(1);
                $table->integer('low_stock_quantity')->default(1);
                $table->double('discount', 18, 2)->default(0);
                $table->string('discount_type', 20)->default('amount');
                $table->integer('discount_start_date')->nullable();
                $table->integer('discount_end_date')->nullable();
                $table->double('tax', 8, 2)->nullable();
                $table->string('tax_type', 20)->nullable();
                $table->string('shipping_type', 20)->default('free');
                $table->double('shipping_cost', 18, 2)->default(0);
                $table->tinyInteger('is_quantity_multiplied')->default(0);
                $table->integer('est_shipping_days')->nullable();
                $table->integer('num_of_sale')->default(0);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->string('meta_img')->nullable();
                $table->string('pdf')->nullable();
                $table->string('slug');
                $table->double('rating', 3, 2)->default(0);
                $table->string('barcode')->nullable();
                $table->tinyInteger('digital')->default(0);
                $table->tinyInteger('auction_product')->default(0);
                $table->string('file_name')->nullable();
                $table->string('file_path')->nullable();
                $table->string('external_link')->nullable();
                $table->string('external_link_btn')->nullable();
                $table->tinyInteger('wholesale_product')->default(0);
                $table->integer('warranty_id')->nullable();
                $table->integer('warranty_note_id')->nullable();
                $table->integer('refund_note_id')->nullable();
                $table->timestamps();
            });
        }

        // ── Product Translations ────────────────────────────────
        if (!Schema::hasTable('product_translations')) {
            Schema::create('product_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('product_id')->unsigned();
                $table->string('name');
                $table->string('unit', 20)->nullable();
                $table->longText('description')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Product Categories (pivot) ──────────────────────────
        if (!Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('product_id')->unsigned();
                $table->bigInteger('category_id')->unsigned();
            });
        }

        // ── Product Stocks ──────────────────────────────────────
        if (!Schema::hasTable('product_stocks')) {
            Schema::create('product_stocks', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('product_id')->unsigned();
                $table->string('variant')->nullable();
                $table->string('sku')->nullable();
                $table->double('price', 18, 2)->default(0);
                $table->integer('qty')->default(0);
                $table->string('image')->nullable();
                $table->timestamps();
            });
        }

        // ── Product Taxes ───────────────────────────────────────
        if (!Schema::hasTable('product_taxes')) {
            Schema::create('product_taxes', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('product_id')->unsigned();
                $table->bigInteger('tax_id')->unsigned();
                $table->double('tax', 8, 2)->default(0);
                $table->string('tax_type', 20)->default('amount');
                $table->timestamps();
            });
        }

        // ── Taxes ───────────────────────────────────────────────
        if (!Schema::hasTable('taxes')) {
            Schema::create('taxes', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->double('tax_rate', 8, 2)->default(0);
                $table->tinyInteger('tax_status')->default(1);
                $table->timestamps();
            });
        }

        // ── Orders ──────────────────────────────────────────────
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->integer('combined_order_id')->nullable();
                $table->integer('user_id')->nullable();
                $table->integer('seller_id')->nullable();
                $table->integer('guest_id')->nullable();
                $table->string('shipping_address')->nullable();
                $table->string('delivery_status', 20)->default('pending');
                $table->string('payment_type', 50)->nullable();
                $table->string('payment_status', 20)->default('unpaid');
                $table->text('payment_details')->nullable();
                $table->double('grand_total', 18, 2)->default(0);
                $table->double('coupon_discount', 18, 2)->default(0);
                $table->string('code')->nullable();
                $table->string('tracking_code')->nullable();
                $table->tinyInteger('viewed')->default(0);
                $table->integer('assign_delivery_boy')->nullable();
                $table->integer('pickup_point_id')->nullable();
                $table->integer('carrier_id')->nullable();
                $table->string('shipping_type', 50)->nullable();
                $table->timestamps();
            });
        }

        // ── Order Details ───────────────────────────────────────
        if (!Schema::hasTable('order_details')) {
            Schema::create('order_details', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('order_id')->unsigned();
                $table->integer('seller_id')->nullable();
                $table->bigInteger('product_id')->unsigned()->nullable();
                $table->string('variation')->nullable();
                $table->double('price', 18, 2)->default(0);
                $table->double('tax', 18, 2)->default(0);
                $table->double('shipping_cost', 18, 2)->default(0);
                $table->integer('quantity')->default(0);
                $table->string('payment_status', 20)->default('unpaid');
                $table->string('delivery_status', 20)->default('pending');
                $table->integer('pickup_point_id')->nullable();
                $table->string('shipping_type', 50)->nullable();
                $table->timestamps();
            });
        }

        // ── Combined Orders ─────────────────────────────────────
        if (!Schema::hasTable('combined_orders')) {
            Schema::create('combined_orders', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id')->nullable();
                $table->double('grand_total', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Shops ───────────────────────────────────────────────
        if (!Schema::hasTable('shops')) {
            Schema::create('shops', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('name')->nullable();
                $table->string('logo')->nullable();
                $table->text('sliders')->nullable();
                $table->string('top_banner')->nullable();
                $table->string('banner_full_width_1')->nullable();
                $table->string('banners_half_width')->nullable();
                $table->string('banner_full_width_2')->nullable();
                $table->string('phone')->nullable();
                $table->string('address')->nullable();
                $table->double('rating', 3, 2)->default(0);
                $table->integer('num_of_reviews')->default(0);
                $table->integer('num_of_sale')->default(0);
                $table->integer('seller_package_id')->nullable();
                $table->integer('product_upload_limit')->default(0);
                $table->string('package_invalid_at')->nullable();
                $table->integer('verification_status')->default(0);
                $table->text('verification_info')->nullable();
                $table->tinyInteger('cash_on_delivery_status')->default(0);
                $table->double('admin_to_pay', 18, 2)->default(0);
                $table->string('facebook')->nullable();
                $table->string('instagram')->nullable();
                $table->string('google')->nullable();
                $table->string('twitter')->nullable();
                $table->string('youtube')->nullable();
                $table->string('slug')->nullable();
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->integer('pick_up_point_id')->nullable();
                $table->double('shipping_cost', 18, 2)->default(0);
                $table->string('delivery_pickup_latitude')->nullable();
                $table->string('delivery_pickup_longitude')->nullable();
                $table->string('bank_name')->nullable();
                $table->string('bank_acc_name')->nullable();
                $table->string('bank_acc_no')->nullable();
                $table->string('bank_routing_no')->nullable();
                $table->tinyInteger('bank_payment_status')->default(0);
                $table->timestamps();
            });
        }

        // ── Sellers ─────────────────────────────────────────────
        if (!Schema::hasTable('sellers')) {
            Schema::create('sellers', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('seller_package_id')->nullable();
                $table->tinyInteger('verification_status')->default(0);
                $table->text('verification_info')->nullable();
                $table->double('admin_to_pay', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Customers ───────────────────────────────────────────
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->timestamps();
            });
        }

        // ── Carts ───────────────────────────────────────────────
        if (!Schema::hasTable('carts')) {
            Schema::create('carts', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id')->nullable();
                $table->string('temp_user_id')->nullable();
                $table->integer('owner_id')->nullable();
                $table->integer('address_id')->nullable();
                $table->integer('product_id')->nullable();
                $table->string('variation')->nullable();
                $table->double('price', 18, 2)->default(0);
                $table->double('tax', 18, 2)->default(0);
                $table->double('shipping_cost', 18, 2)->default(0);
                $table->double('discount', 18, 2)->default(0);
                $table->string('product_referral_code')->nullable();
                $table->string('coupon_code')->nullable();
                $table->tinyInteger('coupon_applied')->default(0);
                $table->integer('quantity')->default(1);
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Currencies ──────────────────────────────────────────
        if (!Schema::hasTable('currencies')) {
            Schema::create('currencies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('symbol', 20)->nullable();
                $table->double('exchange_rate', 18, 6)->default(1);
                $table->tinyInteger('status')->default(1);
                $table->string('code', 10)->nullable();
                $table->tinyInteger('system_default')->default(0);
                $table->timestamps();
            });
        }

        // ── Countries ───────────────────────────────────────────
        if (!Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('code', 5);
                $table->string('name');
                $table->tinyInteger('status')->default(1);
                $table->integer('zone_id')->nullable();
                $table->timestamps();
            });
        }

        // ── States ──────────────────────────────────────────────
        if (!Schema::hasTable('states')) {
            Schema::create('states', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('country_id');
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Cities ──────────────────────────────────────────────
        if (!Schema::hasTable('cities')) {
            Schema::create('cities', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('state_id')->nullable();
                $table->integer('country_id')->nullable();
                $table->double('cost', 18, 2)->default(0);
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── City Translations ───────────────────────────────────
        if (!Schema::hasTable('city_translations')) {
            Schema::create('city_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('city_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Addresses ───────────────────────────────────────────
        if (!Schema::hasTable('addresses')) {
            Schema::create('addresses', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('address')->nullable();
                $table->integer('country_id')->nullable();
                $table->integer('state_id')->nullable();
                $table->integer('city_id')->nullable();
                $table->integer('area_id')->nullable();
                $table->string('postal_code')->nullable();
                $table->string('phone')->nullable();
                $table->tinyInteger('set_default')->default(0);
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->timestamps();
            });
        }

        // ── Zones ───────────────────────────────────────────────
        if (!Schema::hasTable('zones')) {
            Schema::create('zones', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamps();
            });
        }

        // ── Areas ───────────────────────────────────────────────
        if (!Schema::hasTable('areas')) {
            Schema::create('areas', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('city_id');
                $table->double('cost', 18, 2)->default(0);
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Area Translations ───────────────────────────────────
        if (!Schema::hasTable('area_translations')) {
            Schema::create('area_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('area_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Coupons ─────────────────────────────────────────────
        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id')->nullable();
                $table->string('type', 20)->nullable();
                $table->string('code')->nullable();
                $table->text('details')->nullable();
                $table->double('discount', 18, 2)->default(0);
                $table->string('discount_type', 20)->default('amount');
                $table->integer('start_date')->nullable();
                $table->integer('end_date')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Coupon Usages ───────────────────────────────────────
        if (!Schema::hasTable('coupon_usages')) {
            Schema::create('coupon_usages', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('coupon_id');
                $table->timestamps();
            });
        }

        // ── User Coupons ────────────────────────────────────────
        if (!Schema::hasTable('user_coupons')) {
            Schema::create('user_coupons', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('coupon_id');
                $table->timestamps();
            });
        }

        // ── Reviews ─────────────────────────────────────────────
        if (!Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table) {
                $table->id();
                $table->integer('product_id');
                $table->integer('user_id');
                $table->integer('rating')->default(0);
                $table->text('comment')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->tinyInteger('viewed')->default(0);
                $table->timestamps();
            });
        }

        // ── Wishlists ───────────────────────────────────────────
        if (!Schema::hasTable('wishlists')) {
            Schema::create('wishlists', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('product_id');
                $table->timestamps();
            });
        }

        // ── Blogs ───────────────────────────────────────────────
        if (!Schema::hasTable('blogs')) {
            Schema::create('blogs', function (Blueprint $table) {
                $table->id();
                $table->integer('category_id')->nullable();
                $table->string('title');
                $table->string('slug');
                $table->text('short_description')->nullable();
                $table->longText('description')->nullable();
                $table->integer('banner')->nullable();
                $table->string('meta_title')->nullable();
                $table->string('meta_img')->nullable();
                $table->text('meta_description')->nullable();
                $table->string('meta_keywords')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // ── Blog Categories ─────────────────────────────────────
        if (!Schema::hasTable('blog_categories')) {
            Schema::create('blog_categories', function (Blueprint $table) {
                $table->id();
                $table->string('category_name');
                $table->string('slug')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // ── Flash Deals ─────────────────────────────────────────
        if (!Schema::hasTable('flash_deals')) {
            Schema::create('flash_deals', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->integer('start_date')->nullable();
                $table->integer('end_date')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->tinyInteger('featured')->default(0);
                $table->string('background_color')->nullable();
                $table->string('text_color')->nullable();
                $table->string('banner')->nullable();
                $table->string('slug')->nullable();
                $table->timestamps();
            });
        }

        // ── Flash Deal Products ─────────────────────────────────
        if (!Schema::hasTable('flash_deal_products')) {
            Schema::create('flash_deal_products', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('flash_deal_id')->unsigned();
                $table->bigInteger('product_id')->unsigned();
                $table->double('discount', 18, 2)->default(0);
                $table->string('discount_type', 20)->nullable();
                $table->timestamps();
            });
        }

        // ── Flash Deal Translations ─────────────────────────────
        if (!Schema::hasTable('flash_deal_translations')) {
            Schema::create('flash_deal_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('flash_deal_id')->unsigned();
                $table->string('title');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Pages ───────────────────────────────────────────────
        if (!Schema::hasTable('pages')) {
            Schema::create('pages', function (Blueprint $table) {
                $table->id();
                $table->string('type', 50)->default('custom_page');
                $table->string('title');
                $table->string('slug');
                $table->longText('content')->nullable();
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->string('meta_image')->nullable();
                $table->text('keywords')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Page Translations ───────────────────────────────────
        if (!Schema::hasTable('page_translations')) {
            Schema::create('page_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('page_id')->unsigned();
                $table->string('title')->nullable();
                $table->longText('content')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Payments ────────────────────────────────────────────
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->integer('seller_id')->nullable();
                $table->double('amount', 18, 2)->default(0);
                $table->string('payment_method', 50)->nullable();
                $table->text('payment_details')->nullable();
                $table->timestamps();
            });
        }

        // ── Payment Methods ─────────────────────────────────────
        if (!Schema::hasTable('payment_methods')) {
            Schema::create('payment_methods', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('image')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Manual Payment Methods ──────────────────────────────
        if (!Schema::hasTable('manual_payment_methods')) {
            Schema::create('manual_payment_methods', function (Blueprint $table) {
                $table->id();
                $table->string('heading');
                $table->string('type', 20)->default('manual_payment');
                $table->text('description')->nullable();
                $table->string('photo')->nullable();
                $table->text('bank_info')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Roles ───────────────────────────────────────────────
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamps();
            });
        }

        // ── Role Translations ───────────────────────────────────
        if (!Schema::hasTable('role_translations')) {
            Schema::create('role_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('role_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Permissions ─────────────────────────────────────────
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('section')->nullable();
                $table->timestamps();
            });
        }

        // ── Role Permissions (pivot) ────────────────────────────
        if (!Schema::hasTable('role_permission')) {
            Schema::create('role_permission', function (Blueprint $table) {
                $table->id();
                $table->integer('role_id');
                $table->integer('permission_id');
            });
        }

        // ── Staff ───────────────────────────────────────────────
        if (!Schema::hasTable('staff')) {
            Schema::create('staff', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('role_id');
                $table->timestamps();
            });
        }

        // ── Attributes ──────────────────────────────────────────
        if (!Schema::hasTable('attributes')) {
            Schema::create('attributes', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamps();
            });
        }

        // ── Attribute Translations ──────────────────────────────
        if (!Schema::hasTable('attribute_translations')) {
            Schema::create('attribute_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('attribute_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Attribute Values ────────────────────────────────────
        if (!Schema::hasTable('attribute_values')) {
            Schema::create('attribute_values', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('attribute_id')->unsigned();
                $table->string('value');
                $table->timestamps();
            });
        }

        // ── Attribute Category (pivot) ──────────────────────────
        if (!Schema::hasTable('attribute_category')) {
            Schema::create('attribute_category', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('attribute_id')->unsigned();
                $table->bigInteger('category_id')->unsigned();
            });
        }

        // ── Colors ──────────────────────────────────────────────
        if (!Schema::hasTable('colors')) {
            Schema::create('colors', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 10);
                $table->timestamps();
            });
        }

        // ── Subscribers ─────────────────────────────────────────
        if (!Schema::hasTable('subscribers')) {
            Schema::create('subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->timestamps();
            });
        }

        // ── Sliders ─────────────────────────────────────────────
        if (!Schema::hasTable('sliders')) {
            Schema::create('sliders', function (Blueprint $table) {
                $table->id();
                $table->string('photo')->nullable();
                $table->string('link')->nullable();
                $table->timestamps();
            });
        }

        // ── Banners ─────────────────────────────────────────────
        if (!Schema::hasTable('banners')) {
            Schema::create('banners', function (Blueprint $table) {
                $table->id();
                $table->string('photo')->nullable();
                $table->string('url')->nullable();
                $table->integer('position')->default(1);
                $table->tinyInteger('published')->default(1);
                $table->timestamps();
            });
        }

        // ── Searches ────────────────────────────────────────────
        if (!Schema::hasTable('searches')) {
            Schema::create('searches', function (Blueprint $table) {
                $table->id();
                $table->string('query');
                $table->integer('count')->default(1);
                $table->timestamps();
            });
        }

        // ── Wallets ─────────────────────────────────────────────
        if (!Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->double('amount', 18, 2)->default(0);
                $table->string('payment_method', 50)->nullable();
                $table->text('payment_details')->nullable();
                $table->tinyInteger('approval')->default(1);
                $table->string('offline_payment')->default(0);
                $table->string('reciept')->nullable();
                $table->timestamps();
            });
        }

        // ── Conversations ───────────────────────────────────────
        if (!Schema::hasTable('conversations')) {
            Schema::create('conversations', function (Blueprint $table) {
                $table->id();
                $table->integer('sender_id');
                $table->integer('receiver_id');
                $table->string('title')->nullable();
                $table->timestamps();
            });
        }

        // ── Messages ────────────────────────────────────────────
        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->integer('conversation_id');
                $table->integer('user_id');
                $table->longText('message')->nullable();
                $table->timestamps();
            });
        }

        // ── Tickets ─────────────────────────────────────────────
        if (!Schema::hasTable('tickets')) {
            Schema::create('tickets', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('code')->nullable();
                $table->string('subject');
                $table->text('details')->nullable();
                $table->text('files')->nullable();
                $table->string('status', 20)->default('pending');
                $table->tinyInteger('viewed')->default(0);
                $table->timestamps();
            });
        }

        // ── Ticket Replies ──────────────────────────────────────
        if (!Schema::hasTable('ticket_replies')) {
            Schema::create('ticket_replies', function (Blueprint $table) {
                $table->id();
                $table->integer('ticket_id');
                $table->integer('user_id');
                $table->text('reply')->nullable();
                $table->text('files')->nullable();
                $table->timestamps();
            });
        }

        // ── Refund Requests ─────────────────────────────────────
        if (!Schema::hasTable('refund_requests')) {
            Schema::create('refund_requests', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('order_id');
                $table->integer('order_detail_id');
                $table->integer('seller_id')->nullable();
                $table->tinyInteger('seller_approval')->default(0);
                $table->tinyInteger('admin_approval')->default(0);
                $table->double('refund_amount', 18, 2)->default(0);
                $table->string('reason')->nullable();
                $table->tinyInteger('refund_status')->default(0);
                $table->timestamps();
            });
        }

        // ── Commission Histories ────────────────────────────────
        if (!Schema::hasTable('commission_histories')) {
            Schema::create('commission_histories', function (Blueprint $table) {
                $table->id();
                $table->integer('order_id');
                $table->integer('seller_id')->nullable();
                $table->double('admin_commission', 18, 2)->default(0);
                $table->double('seller_earning', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Seller Withdraw Requests ────────────────────────────
        if (!Schema::hasTable('seller_withdraw_requests')) {
            Schema::create('seller_withdraw_requests', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->double('amount', 18, 2)->default(0);
                $table->string('status', 20)->default('pending');
                $table->string('message')->nullable();
                $table->timestamps();
            });
        }

        // ── Seller Packages ─────────────────────────────────────
        if (!Schema::hasTable('seller_packages')) {
            Schema::create('seller_packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->double('amount', 18, 2)->default(0);
                $table->integer('product_upload_limit')->default(0);
                $table->string('logo')->nullable();
                $table->integer('duration')->default(30);
                $table->timestamps();
            });
        }

        // ── Seller Package Translations ─────────────────────────
        if (!Schema::hasTable('seller_package_translations')) {
            Schema::create('seller_package_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('seller_package_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Seller Package Payments ─────────────────────────────
        if (!Schema::hasTable('seller_package_payments')) {
            Schema::create('seller_package_payments', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('seller_package_id');
                $table->string('payment_method', 50)->nullable();
                $table->text('payment_details')->nullable();
                $table->tinyInteger('approval')->default(0);
                $table->string('offline_payment')->default(0);
                $table->string('reciept')->nullable();
                $table->timestamps();
            });
        }

        // ── Seller Categories ───────────────────────────────────
        if (!Schema::hasTable('seller_categories')) {
            Schema::create('seller_categories', function (Blueprint $table) {
                $table->id();
                $table->integer('seller_id');
                $table->integer('category_id');
                $table->double('commission', 8, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Customer Packages ───────────────────────────────────
        if (!Schema::hasTable('customer_packages')) {
            Schema::create('customer_packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->double('amount', 18, 2)->default(0);
                $table->integer('product_upload')->default(0);
                $table->string('logo')->nullable();
                $table->timestamps();
            });
        }

        // ── Customer Package Translations ───────────────────────
        if (!Schema::hasTable('customer_package_translations')) {
            Schema::create('customer_package_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('customer_package_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Customer Package Payments ───────────────────────────
        if (!Schema::hasTable('customer_package_payments')) {
            Schema::create('customer_package_payments', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('customer_package_id');
                $table->string('payment_method', 50)->nullable();
                $table->text('payment_details')->nullable();
                $table->timestamps();
            });
        }

        // ── Customer Products ───────────────────────────────────
        if (!Schema::hasTable('customer_products')) {
            Schema::create('customer_products', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('category_id')->nullable();
                $table->string('name');
                $table->string('slug');
                $table->string('brand')->nullable();
                $table->text('photos')->nullable();
                $table->string('thumbnail_img')->nullable();
                $table->string('conditon', 20)->nullable();
                $table->string('location')->nullable();
                $table->text('description')->nullable();
                $table->double('unit_price', 18, 2)->default(0);
                $table->string('phone')->nullable();
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->string('meta_img')->nullable();
                $table->string('pdf')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->string('status_reason')->nullable();
                $table->timestamps();
            });
        }

        // ── Customer Product Translations ───────────────────────
        if (!Schema::hasTable('customer_product_translations')) {
            Schema::create('customer_product_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('customer_product_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Club Points ─────────────────────────────────────────
        if (!Schema::hasTable('club_points')) {
            Schema::create('club_points', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('order_id')->nullable();
                $table->integer('points')->default(0);
                $table->tinyInteger('convert_status')->default(0);
                $table->timestamps();
            });
        }

        // ── Club Point Details ──────────────────────────────────
        if (!Schema::hasTable('club_point_details')) {
            Schema::create('club_point_details', function (Blueprint $table) {
                $table->id();
                $table->integer('club_point_id');
                $table->integer('product_id');
                $table->integer('point')->default(0);
                $table->timestamps();
            });
        }

        // ── Contacts ────────────────────────────────────────────
        if (!Schema::hasTable('contacts')) {
            Schema::create('contacts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('subject')->nullable();
                $table->text('message')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }

        // ── Policies ────────────────────────────────────────────
        if (!Schema::hasTable('policies')) {
            Schema::create('policies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->longText('content')->nullable();
                $table->timestamps();
            });
        }

        // ── FAQs ────────────────────────────────────────────────
        if (!Schema::hasTable('faqs')) {
            Schema::create('faqs', function (Blueprint $table) {
                $table->id();
                $table->string('question');
                $table->text('answer')->nullable();
                $table->string('slug')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── FAQ Translations ────────────────────────────────────
        if (!Schema::hasTable('faq_translations')) {
            Schema::create('faq_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('faq_id')->unsigned();
                $table->string('question');
                $table->text('answer')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Elements ────────────────────────────────────────────
        if (!Schema::hasTable('elements')) {
            Schema::create('elements', function (Blueprint $table) {
                $table->id();
                $table->integer('element_type_id');
                $table->integer('page_id')->nullable();
                $table->integer('priority')->default(0);
                $table->text('content')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Element Types ───────────────────────────────────────
        if (!Schema::hasTable('element_types')) {
            Schema::create('element_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->nullable();
                $table->timestamps();
            });
        }

        // ── Element Translations ────────────────────────────────
        if (!Schema::hasTable('element_translations')) {
            Schema::create('element_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('element_id')->unsigned();
                $table->text('content')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Element Styles ──────────────────────────────────────
        if (!Schema::hasTable('element_styles')) {
            Schema::create('element_styles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type', 50)->nullable();
                $table->text('settings')->nullable();
                $table->timestamps();
            });
        }

        // ── Top Banners ─────────────────────────────────────────
        if (!Schema::hasTable('top_banners')) {
            Schema::create('top_banners', function (Blueprint $table) {
                $table->id();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('banner')->nullable();
                $table->string('link')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Top Banner Translations ─────────────────────────────
        if (!Schema::hasTable('top_banner_translations')) {
            Schema::create('top_banner_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('top_banner_id')->unsigned();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Custom Alerts ───────────────────────────────────────
        if (!Schema::hasTable('custom_alerts')) {
            Schema::create('custom_alerts', function (Blueprint $table) {
                $table->id();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('background_color')->nullable();
                $table->string('text_color')->nullable();
                $table->string('link')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }

        // ── Custom Labels ───────────────────────────────────────
        if (!Schema::hasTable('custom_labels')) {
            Schema::create('custom_labels', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('color', 20)->nullable();
                $table->timestamps();
            });
        }

        // ── Custom Label Translations ───────────────────────────
        if (!Schema::hasTable('custom_label_translations')) {
            Schema::create('custom_label_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('custom_label_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Dynamic Popups ──────────────────────────────────────
        if (!Schema::hasTable('dynamic_popups')) {
            Schema::create('dynamic_popups', function (Blueprint $table) {
                $table->id();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('banner')->nullable();
                $table->string('link')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->tinyInteger('is_cookie')->default(0);
                $table->timestamps();
            });
        }

        // ── Notes ───────────────────────────────────────────────
        if (!Schema::hasTable('notes')) {
            Schema::create('notes', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->longText('content')->nullable();
                $table->timestamps();
            });
        }

        // ── Note Translations ───────────────────────────────────
        if (!Schema::hasTable('note_translations')) {
            Schema::create('note_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('note_id')->unsigned();
                $table->string('title')->nullable();
                $table->longText('content')->nullable();
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Warranties ──────────────────────────────────────────
        if (!Schema::hasTable('warranties')) {
            Schema::create('warranties', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('text')->nullable();
                $table->string('logo')->nullable();
                $table->timestamps();
            });
        }

        // ── Warranty Translations ───────────────────────────────
        if (!Schema::hasTable('warranty_translations')) {
            Schema::create('warranty_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('warranty_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Size Charts ─────────────────────────────────────────
        if (!Schema::hasTable('size_charts')) {
            Schema::create('size_charts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamps();
            });
        }

        // ── Size Chart Details ──────────────────────────────────
        if (!Schema::hasTable('size_chart_details')) {
            Schema::create('size_chart_details', function (Blueprint $table) {
                $table->id();
                $table->integer('size_chart_id');
                $table->string('name');
                $table->text('values')->nullable();
                $table->timestamps();
            });
        }

        // ── Carriers ────────────────────────────────────────────
        if (!Schema::hasTable('carriers')) {
            Schema::create('carriers', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('logo')->nullable();
                $table->tinyInteger('transit_time')->default(0);
                $table->tinyInteger('free_shipping')->default(0);
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Carrier Ranges ──────────────────────────────────────
        if (!Schema::hasTable('carrier_ranges')) {
            Schema::create('carrier_ranges', function (Blueprint $table) {
                $table->id();
                $table->integer('carrier_id');
                $table->string('billing_type', 20)->default('weight_based');
                $table->double('delimiter1', 18, 2)->default(0);
                $table->double('delimiter2', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Carrier Range Prices ────────────────────────────────
        if (!Schema::hasTable('carrier_range_prices')) {
            Schema::create('carrier_range_prices', function (Blueprint $table) {
                $table->id();
                $table->integer('carrier_range_id');
                $table->integer('zone_id');
                $table->double('price', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Pickup Points ───────────────────────────────────────
        if (!Schema::hasTable('pickup_points')) {
            Schema::create('pickup_points', function (Blueprint $table) {
                $table->id();
                $table->integer('staff_id')->nullable();
                $table->string('name');
                $table->text('address')->nullable();
                $table->string('phone')->nullable();
                $table->integer('pick_up_status')->default(1);
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->timestamps();
            });
        }

        // ── Pickup Point Translations ───────────────────────────
        if (!Schema::hasTable('pickup_point_translations')) {
            Schema::create('pickup_point_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('pickup_point_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Pickup Addresses ────────────────────────────────────
        if (!Schema::hasTable('pickup_addresses')) {
            Schema::create('pickup_addresses', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('address')->nullable();
                $table->integer('country_id')->nullable();
                $table->integer('state_id')->nullable();
                $table->integer('city_id')->nullable();
                $table->string('postal_code')->nullable();
                $table->string('phone')->nullable();
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->timestamps();
            });
        }

        // ── Shipping Systems ────────────────────────────────────
        if (!Schema::hasTable('shipping_systems')) {
            Schema::create('shipping_systems', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }

        // ── Shipping Box Sizes ──────────────────────────────────
        if (!Schema::hasTable('shipping_box_sizes')) {
            Schema::create('shipping_box_sizes', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->double('height', 8, 2)->default(0);
                $table->double('length', 8, 2)->default(0);
                $table->double('width', 8, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Transactions ────────────────────────────────────────
        if (!Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('gateway', 50)->nullable();
                $table->double('amount', 18, 2)->default(0);
                $table->string('payment_method', 50)->nullable();
                $table->text('attributes')->nullable();
                $table->timestamps();
            });
        }

        // ── Follow Sellers ──────────────────────────────────────
        if (!Schema::hasTable('follow_sellers')) {
            Schema::create('follow_sellers', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('shop_id');
                $table->timestamps();
            });
        }

        // ── Frequently Bought Products ──────────────────────────
        if (!Schema::hasTable('frequently_bought_products')) {
            Schema::create('frequently_bought_products', function (Blueprint $table) {
                $table->id();
                $table->integer('product_id');
                $table->integer('frequently_bought_product_id')->nullable();
                $table->integer('category_id')->nullable();
                $table->timestamps();
            });
        }

        // ── Last Viewed Products ────────────────────────────────
        if (!Schema::hasTable('last_viewed_products')) {
            Schema::create('last_viewed_products', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('product_id');
                $table->timestamps();
            });
        }

        // ── Custom Sale Alerts ──────────────────────────────────
        if (!Schema::hasTable('custom_sale_alerts')) {
            Schema::create('custom_sale_alerts', function (Blueprint $table) {
                $table->id();
                $table->integer('product_id');
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Wholesale Prices ────────────────────────────────────
        if (!Schema::hasTable('wholesale_prices')) {
            Schema::create('wholesale_prices', function (Blueprint $table) {
                $table->id();
                $table->integer('product_stock_id');
                $table->integer('min_qty')->default(1);
                $table->integer('max_qty')->default(1);
                $table->double('price', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Email Templates ─────────────────────────────────────
        if (!Schema::hasTable('email_templates')) {
            Schema::create('email_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type', 50)->nullable();
                $table->text('subject')->nullable();
                $table->longText('body')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── SMS Templates ───────────────────────────────────────
        if (!Schema::hasTable('sms_templates')) {
            Schema::create('sms_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('identifier', 50);
                $table->text('body')->nullable();
                $table->string('template_id')->nullable();
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }

        // ── OTP Configurations ──────────────────────────────────
        if (!Schema::hasTable('otp_configurations')) {
            Schema::create('otp_configurations', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->string('value')->nullable();
                $table->timestamps();
            });
        }

        // ── Firebase Notifications ──────────────────────────────
        if (!Schema::hasTable('firebase_notifications')) {
            Schema::create('firebase_notifications', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('content')->nullable();
                $table->string('image')->nullable();
                $table->string('link')->nullable();
                $table->timestamps();
            });
        }

        // ── Notification Types ──────────────────────────────────
        if (!Schema::hasTable('notification_types')) {
            Schema::create('notification_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type', 50)->nullable();
                $table->text('default_text')->nullable();
                $table->string('image')->nullable();
                $table->tinyInteger('status')->default(1);
                $table->timestamps();
            });
        }

        // ── Notification Type Translations ──────────────────────
        if (!Schema::hasTable('notification_type_translations')) {
            Schema::create('notification_type_translations', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('notification_type_id')->unsigned();
                $table->string('name');
                $table->string('lang', 10);
                $table->timestamps();
            });
        }

        // ── Delivery Boys ───────────────────────────────────────
        if (!Schema::hasTable('delivery_boys')) {
            Schema::create('delivery_boys', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->double('total_collection', 18, 2)->default(0);
                $table->double('total_earning', 18, 2)->default(0);
                $table->double('monthly_salary', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Delivery Boy Collections ────────────────────────────
        if (!Schema::hasTable('delivery_boy_collections')) {
            Schema::create('delivery_boy_collections', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('order_id');
                $table->double('collection_amount', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Delivery Boy Payments ───────────────────────────────
        if (!Schema::hasTable('delivery_boy_payments')) {
            Schema::create('delivery_boy_payments', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('payment_type', 50)->nullable();
                $table->double('amount', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Delivery Histories ──────────────────────────────────
        if (!Schema::hasTable('delivery_histories')) {
            Schema::create('delivery_histories', function (Blueprint $table) {
                $table->id();
                $table->integer('order_id');
                $table->integer('delivery_boy_id')->nullable();
                $table->string('delivery_status', 20)->nullable();
                $table->string('payment_type', 50)->nullable();
                $table->timestamps();
            });
        }

        // ── Auction Product Bids ────────────────────────────────
        if (!Schema::hasTable('auction_product_bids')) {
            Schema::create('auction_product_bids', function (Blueprint $table) {
                $table->id();
                $table->integer('product_id');
                $table->integer('user_id');
                $table->double('amount', 18, 2)->default(0);
                $table->timestamps();
            });
        }

        // ── Proxy Payments ──────────────────────────────────────
        if (!Schema::hasTable('proxy_payments')) {
            Schema::create('proxy_payments', function (Blueprint $table) {
                $table->id();
                $table->integer('order_id')->nullable();
                $table->string('proxy_cart_reference_id')->nullable();
                $table->string('payment_method', 50)->nullable();
                $table->double('amount', 18, 2)->default(0);
                $table->string('status', 20)->default('pending');
                $table->timestamps();
            });
        }

        // ── Registration Verification Codes ─────────────────────
        if (!Schema::hasTable('registration_verification_codes')) {
            Schema::create('registration_verification_codes', function (Blueprint $table) {
                $table->id();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('code');
                $table->timestamps();
            });
        }

        // ── Affiliate configs / tables ──────────────────────────
        if (!Schema::hasTable('affiliate_configs')) {
            Schema::create('affiliate_configs', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_users')) {
            Schema::create('affiliate_users', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->tinyInteger('status')->default(0);
                $table->double('balance', 18, 2)->default(0);
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_logs')) {
            Schema::create('affiliate_logs', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('referred_by')->nullable();
                $table->integer('order_id')->nullable();
                $table->integer('order_detail_id')->nullable();
                $table->double('amount', 18, 2)->default(0);
                $table->string('affiliate_type', 50)->nullable();
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_options')) {
            Schema::create('affiliate_options', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->text('details')->nullable();
                $table->double('percentage', 8, 2)->default(0);
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_payments')) {
            Schema::create('affiliate_payments', function (Blueprint $table) {
                $table->id();
                $table->integer('affiliate_user_id');
                $table->double('amount', 18, 2)->default(0);
                $table->string('payment_method', 50)->nullable();
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_stats')) {
            Schema::create('affiliate_stats', function (Blueprint $table) {
                $table->id();
                $table->integer('affiliate_user_id');
                $table->integer('no_of_click')->default(0);
                $table->integer('no_of_order_item')->default(0);
                $table->integer('no_of_delivered')->default(0);
                $table->integer('no_of_cancel')->default(0);
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('affiliate_withdraw_requests')) {
            Schema::create('affiliate_withdraw_requests', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->double('amount', 18, 2)->default(0);
                $table->string('status', 20)->default('pending');
                $table->timestamps();
            });
        }

        // ── Measurement Points ──────────────────────────────────
        if (!Schema::hasTable('measurement_points')) {
            Schema::create('measurement_points', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('image')->nullable();
                $table->timestamps();
            });
        }

        // ── App Settings ────────────────────────────────────────
        if (!Schema::hasTable('app_settings')) {
            Schema::create('app_settings', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }

        // ── Preorder tables (basic) ─────────────────────────────
        if (!Schema::hasTable('preorder_products')) {
            Schema::create('preorder_products', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->string('name');
                $table->string('slug');
                $table->longText('description')->nullable();
                $table->double('unit_price', 18, 2)->default(0);
                $table->string('thumbnail_img')->nullable();
                $table->text('photos')->nullable();
                $table->tinyInteger('published')->default(1);
                $table->timestamps();
            });
        }
        if (!Schema::hasTable('preorder_product_categories')) {
            Schema::create('preorder_product_categories', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('preorder_product_id')->unsigned();
                $table->bigInteger('category_id')->unsigned();
            });
        }
        if (!Schema::hasTable('preorders')) {
            Schema::create('preorders', function (Blueprint $table) {
                $table->id();
                $table->integer('user_id');
                $table->integer('preorder_product_id');
                $table->double('amount', 18, 2)->default(0);
                $table->string('status', 20)->default('pending');
                $table->timestamps();
            });
        }

        // ── Cart Product (if used separately) ───────────────────
        if (!Schema::hasTable('cart_products')) {
            Schema::create('cart_products', function (Blueprint $table) {
                $table->id();
                $table->integer('cart_id');
                $table->integer('product_id');
                $table->integer('quantity')->default(1);
                $table->timestamps();
            });
        }

        // ── Brands Import ───────────────────────────────────────
        if (!Schema::hasTable('brands_imports')) {
            Schema::create('brands_imports', function (Blueprint $table) {
                $table->id();
                $table->string('file_path')->nullable();
                $table->timestamps();
            });
        }

        // ── Products Import ─────────────────────────────────────
        if (!Schema::hasTable('products_imports')) {
            Schema::create('products_imports', function (Blueprint $table) {
                $table->id();
                $table->string('file_path')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        // Drop in reverse order of creation (respect FKs)
        $tables = [
            'products_imports','brands_imports','cart_products','preorders',
            'preorder_product_categories','preorder_products','app_settings',
            'measurement_points','affiliate_withdraw_requests','affiliate_stats',
            'affiliate_payments','affiliate_options','affiliate_logs','affiliate_users',
            'affiliate_configs','registration_verification_codes','proxy_payments',
            'auction_product_bids','delivery_histories','delivery_boy_payments',
            'delivery_boy_collections','delivery_boys','notification_type_translations',
            'notification_types','firebase_notifications','otp_configurations',
            'sms_templates','email_templates','wholesale_prices','custom_sale_alerts',
            'last_viewed_products','frequently_bought_products','follow_sellers',
            'transactions','shipping_box_sizes','shipping_systems','pickup_addresses',
            'pickup_point_translations','pickup_points','carrier_range_prices',
            'carrier_ranges','carriers','size_chart_details','size_charts',
            'warranty_translations','warranties','note_translations','notes',
            'dynamic_popups','custom_label_translations','custom_labels',
            'custom_alerts','top_banner_translations','top_banners',
            'element_styles','element_translations','element_types','elements',
            'faq_translations','faqs','policies','contacts',
            'club_point_details','club_points','customer_product_translations',
            'customer_products','customer_package_payments','customer_package_translations',
            'customer_packages','seller_categories','seller_package_payments',
            'seller_package_translations','seller_packages','seller_withdraw_requests',
            'commission_histories','refund_requests','ticket_replies','tickets',
            'messages','conversations','wallets','searches','banners','sliders',
            'subscribers','colors','attribute_category','attribute_values',
            'attribute_translations','attributes','staff','role_permission',
            'permissions','role_translations','roles','manual_payment_methods',
            'payment_methods','payments','page_translations','pages',
            'flash_deal_translations','flash_deal_products','flash_deals',
            'blog_categories','blogs','wishlists','reviews','user_coupons',
            'coupon_usages','coupons','areas','area_translations','zones',
            'addresses','city_translations','cities','states','countries',
            'currencies','carts','customers','sellers','shops',
            'combined_orders','order_details','orders','product_taxes','product_stocks',
            'product_categories','product_translations','products',
            'brand_translations','brands','category_translations','categories','uploads',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }

        // Remove added columns from users
        if (Schema::hasColumn('users', 'user_type')) {
            Schema::table('users', function (Blueprint $table) {
                $cols = [
                    'user_type','referred_by','provider','refresh_token','access_token',
                    'verification_code','new_email_verificiation_code','device_token',
                    'avatar','avatar_original','address','country','state','city',
                    'postal_code','phone','balance','banned','referral_code',
                    'customer_package_id','remaining_uploads'
                ];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('users', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
