<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->loadSeederFile('DhanvathiriProductsSeeder.php');
        $this->loadSeederFile('LegacyStorefrontContentSeeder.php');
        $this->loadSeederFile('StorefrontContentSeeder.php');

        $this->call(DhanvathiriProductsSeeder::class);
        $this->call(LegacyStorefrontContentSeeder::class);
    }

    private function loadSeederFile(string $fileName): void
    {
        $path = database_path('seeders/' . $fileName);

        if (file_exists($path)) {
            require_once $path;
        }
    }
}

if (! class_exists('DatabaseSeeder', false)) {
    class_alias(DatabaseSeeder::class, 'DatabaseSeeder');
}
