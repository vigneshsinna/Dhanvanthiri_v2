<?php

namespace Tests\Feature\Api\V2;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Schema\Blueprint;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminModuleActivationRequestRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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
        });
    }

    public function test_super_admin_can_submit_activation_request_for_a_specific_module_id(): void
    {
        if (!Schema::hasTable('addons')) {
            Schema::create('addons', function (Blueprint $table): void {
                $table->id();
                $table->string('name')->nullable();
                $table->string('unique_identifier')->nullable();
                $table->string('version')->nullable();
                $table->boolean('activated')->default(false);
            });
        }

        $admin = new User();
        $admin->forceFill([
            'name' => 'Super Admin',
            'user_type' => 'super_admin',
            'email_verified_at' => now(),
            'email' => 'super-admin@example.com',
            'password' => bcrypt('secret123'),
        ]);
        $admin->save();

        Sanctum::actingAs($admin);

        DB::table('addons')->insert([
            'id' => 7,
            'name' => 'Shiprocket',
            'unique_identifier' => 'shiprocket',
            'version' => '1.0.0',
            'activated' => 0,
        ]);

        $response = $this->withHeaders([
            'System-Key' => '0d279f87add587c1c6d046cd59ee012d',
            'Accept' => 'application/json',
        ])->postJson('/api/admin/modules/7/activation-request', [
            'reason' => 'Needed for production shipping workflows',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.module_id', 7)
            ->assertJsonPath('data.reason', 'Needed for production shipping workflows');
    }
}
