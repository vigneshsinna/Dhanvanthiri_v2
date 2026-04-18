<?php

namespace Tests\Feature\Admin;

use App\Models\BusinessSetting;
use App\Models\Language;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminBladeLoginRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $_SERVER['SERVER_NAME'] = $_SERVER['SERVER_NAME'] ?? 'localhost';

        if (!Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table): void {
                $table->id();
                $table->string('name')->nullable();
                $table->string('code')->nullable();
                $table->boolean('rtl')->default(false);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('business_settings')) {
            Schema::create('business_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('type')->nullable();
                $table->text('value')->nullable();
                $table->string('lang')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('translations')) {
            Schema::create('translations', function (Blueprint $table): void {
                $table->id();
                $table->string('lang')->nullable();
                $table->string('lang_key')->nullable();
                $table->text('lang_value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('app_translations')) {
            Schema::create('app_translations', function (Blueprint $table): void {
                $table->id();
                $table->string('lang')->nullable();
                $table->string('lang_key')->nullable();
                $table->text('lang_value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('addons')) {
            Schema::create('addons', function (Blueprint $table): void {
                $table->id();
                $table->string('name')->nullable();
                $table->string('unique_identifier')->nullable();
                $table->boolean('activated')->default(false);
                $table->timestamps();
            });
        }
    }

    public function test_guest_admin_requests_redirect_to_the_blade_admin_login_page(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect('/admin/login');
    }

    public function test_admin_login_page_renders_the_blade_login_view(): void
    {
        $this->seedAuthenticationViewSettings();

        $response = $this->get('/admin/login');

        $response->assertOk();
        $response->assertViewIs('auth.login');
        $response->assertSee('id="login-form"', false);
        $response->assertDontSee('http://localhost:5173/@vite/client', false);
    }

    public function test_authenticated_admins_are_redirected_to_the_dashboard_from_home(): void
    {
        $admin = new User();
        $admin->forceFill([
            'id' => 1,
            'name' => 'Admin User',
            'user_type' => 'admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get('/');

        $response->assertRedirect('/admin');
    }

    private function seedAuthenticationViewSettings(): void
    {
        Cache::forget('business_settings');

        $language = new Language();
        $language->forceFill([
            'code' => config('app.locale', 'en'),
            'rtl' => 0,
        ]);
        $language->save();

        $setting = new BusinessSetting();
        $setting->forceFill([
            'type' => 'authentication_layout_select',
            'value' => 'boxed',
        ]);
        $setting->save();

        Cache::forget('business_settings');
    }
}
