<?php

namespace Tests\Feature\Api\V2;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthHeadlessAdminLoginTest extends TestCase
{
    use RefreshDatabase;

    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    protected function setUp(): void
    {
        parent::setUp();

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

        if (!Schema::hasTable('business_settings')) {
            Schema::create('business_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('type')->nullable();
                $table->string('value')->nullable();
                $table->string('lang')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('personal_access_tokens') && !Schema::hasColumn('personal_access_tokens', 'expires_at')) {
            Schema::table('personal_access_tokens', function (Blueprint $table): void {
                $table->timestamp('expires_at')->nullable();
            });
        }

        Schema::table('users', function (Blueprint $table): void {
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->string('user_type')->nullable();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'banned')) {
                $table->boolean('banned')->default(false);
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            if (!Schema::hasColumn('users', 'avatar_original')) {
                $table->string('avatar_original')->nullable();
            }
        });
    }

    public function test_admin_can_log_in_from_headless_storefront_identity_matrix(): void
    {
        $admin = new User();
        $admin->forceFill([
            'name' => 'Admin User',
            'user_type' => 'admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret123'),
            'email_verified_at' => now(),
        ]);
        $admin->save();

        $response = $this->withHeader('System-Key', self::SYSTEM_KEY)
            ->postJson('/api/v2/auth/login', [
                'email' => $admin->email,
                'password' => 'secret123',
                'login_by' => 'email',
                'identity_matrix' => 'headless-storefront',
            ]);

        $response->assertOk()
            ->assertJsonPath('result', true)
            ->assertJsonPath('user.id', $admin->id)
            ->assertJsonPath('user.role', 'admin');
    }
}
