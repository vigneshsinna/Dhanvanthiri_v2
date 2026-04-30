<?php

namespace Database\Seeders;

use App\Support\LegacyStorefrontContentImporter;
use Illuminate\Database\Seeder;

class LegacyStorefrontContentSeeder extends Seeder
{
    public function run(): void
    {
        app(LegacyStorefrontContentImporter::class)->import();
    }
}
