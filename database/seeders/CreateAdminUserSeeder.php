<?php

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@animazon.local',
            'password' => Hash::make('Admin@123'),
            'email_verified_at' => now(),
        ]);

        $this->command->info('✓ Admin user created successfully!');
        $this->command->info('Email: admin@animazon.local');
        $this->command->info('Password: Admin@123');
    }
}
