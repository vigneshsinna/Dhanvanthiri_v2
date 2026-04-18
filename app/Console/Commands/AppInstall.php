<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

class AppInstall extends Command
{
    protected $signature = 'app:install {--force : Force reinstall even if already installed}';
    protected $description = 'Install the application: configure database, import data, create admin user, and enable routes';

    private $envPath;

    public function __construct()
    {
        parent::__construct();
        $this->envPath = base_path('.env');
    }

    public function handle()
    {
        $this->info('');
        $this->info('╔══════════════════════════════════════════════════╗');
        $this->info('║     animazon — Installation         ║');
        $this->info('╚══════════════════════════════════════════════════╝');
        $this->info('');

        // Check if already installed
        if (!$this->option('force') && $this->isInstalled()) {
            $this->warn('Application appears to be already installed.');
            if (!$this->confirm('Do you want to run the installer again? This may overwrite existing data.')) {
                return 0;
            }
        }

        // Step 1: Database Configuration
        $this->step1_configureDatabase();

        // Step 2: Test Database Connection
        if (!$this->step2_testConnection()) {
            return 1;
        }

        // Step 3: Import SQL Data
        $this->step3_importData();

        // Step 4: Create Admin User
        $this->step4_createAdmin();

        // Step 5: Enable Routes
        $this->step5_enableRoutes();

        // Step 6: Finalize
        $this->step6_finalize();

        $this->info('');
        $this->info('╔══════════════════════════════════════════════════╗');
        $this->info('║     Installation Complete!                      ║');
        $this->info('╚══════════════════════════════════════════════════╝');
        $this->info('');
        $this->info('You can now run: php artisan serve');
        $this->info('Then visit: ' . config('app.url', 'http://localhost:8000'));
        $this->info('');

        return 0;
    }

    // ── Step 1: Database Configuration ────────────────────────────────

    private function step1_configureDatabase()
    {
        $this->info('');
        $this->info('── Step 1/6: Database Configuration ──');
        $this->info('');

        $driver = $this->choice('Database driver', ['mysql', 'sqlite'], 'mysql');

        if ($driver === 'sqlite') {
            $this->warn('⚠ SQLite is only suitable for basic development.');
            $this->warn('  Many features require MySQL. Use MySQL for production.');
            $dbPath = $this->ask('SQLite database path (relative to project root)', 'database.sqlite');
            $fullPath = base_path($dbPath);

            if (!file_exists($fullPath)) {
                touch($fullPath);
                $this->info("Created SQLite database: {$dbPath}");
            }

            $this->writeEnv('DB_CONNECTION', 'sqlite');
            $this->writeEnv('DB_DATABASE', $fullPath);
            $this->writeEnv('DB_HOST', '');
            $this->writeEnv('DB_PORT', '');
            $this->writeEnv('DB_USERNAME', '');
            $this->writeEnv('DB_PASSWORD', '');
        } else {
            $host = $this->ask('Database host', '127.0.0.1');
            $port = $this->ask('Database port', '3306');
            $database = $this->ask('Database name', 'animazon');
            $username = $this->ask('Database username', 'root');
            $password = $this->secret('Database password (leave empty for none)') ?? '';

            $this->writeEnv('DB_CONNECTION', 'mysql');
            $this->writeEnv('DB_HOST', $host);
            $this->writeEnv('DB_PORT', $port);
            $this->writeEnv('DB_DATABASE', $database);
            $this->writeEnv('DB_USERNAME', $username);
            $this->writeEnv('DB_PASSWORD', $password);
        }

        // Refresh config so new DB settings take effect
        Artisan::call('config:clear');
        $this->refreshDatabaseConfig();

        $this->info('✓ Database configuration saved.');
    }

    // ── Step 2: Test Connection ───────────────────────────────────────

    private function step2_testConnection(): bool
    {
        $this->info('');
        $this->info('── Step 2/6: Testing Database Connection ──');
        $this->info('');

        $driver = config('database.default');

        // For MySQL, try to create the database if it doesn't exist
        if ($driver === 'mysql') {
            try {
                $host = config('database.connections.mysql.host');
                $port = config('database.connections.mysql.port');
                $user = config('database.connections.mysql.username');
                $pass = config('database.connections.mysql.password');
                $dbName = config('database.connections.mysql.database');

                $pdo = new \PDO("mysql:host={$host};port={$port}", $user, $pass);
                $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $this->info("✓ Database '{$dbName}' is ready.");
            } catch (\Exception $e) {
                $this->error('✗ Cannot connect to MySQL server: ' . $e->getMessage());

                if ($this->confirm('Would you like to reconfigure database settings?')) {
                    $this->step1_configureDatabase();
                    return $this->step2_testConnection();
                }
                return false;
            }
        }

        try {
            DB::purge();
            DB::reconnect();
            DB::connection()->getPdo();
            $this->info('✓ Database connection successful!');
            return true;
        } catch (\Exception $e) {
            $this->error('✗ Database connection failed: ' . $e->getMessage());

            if ($this->confirm('Would you like to reconfigure database settings?')) {
                $this->step1_configureDatabase();
                return $this->step2_testConnection();
            }

            return false;
        }
    }

    // ── Step 3: Import Data ───────────────────────────────────────────

    private function step3_importData()
    {
        $this->info('');
        $this->info('── Step 3/6: Database Setup ──');
        $this->info('');

        $driver = config('database.default');

        if ($driver === 'mysql') {
            $this->importMysqlData();
        } else {
            $this->setupSqlite();
        }
    }

    private function importMysqlData()
    {
        $shopSql = base_path('shop.sql');
        $demoSql = base_path('public/demo.sql');

        if (!file_exists($shopSql)) {
            $this->error('shop.sql not found. Running migrations instead...');
            Artisan::call('migrate', ['--force' => true]);
            $this->info($this->parseArtisanOutput());
            return;
        }

        // Check if tables already exist
        $tablesExist = false;
        try {
            $tablesExist = Schema::hasTable('business_settings');
        } catch (\Exception $e) {
            // Ignore
        }

        if ($tablesExist && !$this->option('force')) {
            $this->warn('Database tables already exist.');
            $action = $this->choice('What would you like to do?', [
                'skip'    => 'Skip — keep existing data',
                'reimport' => 'Drop all tables and reimport shop.sql',
            ], 'skip');

            if ($action === 'skip') {
                $this->info('Skipping database import.');
                return;
            }

            // Drop all tables
            $this->warn('Dropping all tables...');
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');
            $tables = DB::select('SHOW TABLES');
            $dbName = config('database.connections.mysql.database');
            foreach ($tables as $table) {
                $tableName = $table->{"Tables_in_{$dbName}"};
                DB::statement("DROP TABLE IF EXISTS `{$tableName}`");
            }
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        }

        // Import shop.sql
        $this->info('Importing shop.sql (this may take a moment)...');
        try {
            $sql = file_get_contents($shopSql);
            DB::unprepared($sql);
            $this->info('✓ shop.sql imported successfully.');
        } catch (\Exception $e) {
            $this->error('Error importing shop.sql: ' . $e->getMessage());
            $this->warn('Falling back to migrations...');
            Artisan::call('migrate', ['--force' => true]);
        }

        // Optionally import demo data
        if (file_exists($demoSql) && $this->confirm('Would you like to import demo data?', false)) {
            $this->info('Importing demo data...');
            try {
                DB::unprepared(file_get_contents($demoSql));
                $this->info('✓ Demo data imported.');

                // Extract demo images if available
                $uploadsZip = base_path('public/uploads.zip');
                if (file_exists($uploadsZip) && class_exists('ZipArchive')) {
                    $zip = new \ZipArchive;
                    if ($zip->open($uploadsZip) === true) {
                        $zip->extractTo(public_path('uploads/all/'));
                        $zip->close();
                        $this->info('✓ Demo images extracted.');
                    }
                }
            } catch (\Exception $e) {
                $this->warn('Demo data import failed: ' . $e->getMessage());
            }
        }
    }

    private function setupSqlite()
    {
        $this->info('Running migrations for SQLite...');
        Artisan::call('migrate', ['--force' => true]);
        $this->info('✓ Migrations complete.');

        // Create essential tables that migrations may not cover
        $this->createEssentialTables();
    }

    private function createEssentialTables()
    {
        // Create business_settings if not exists
        if (!Schema::hasTable('business_settings')) {
            Schema::create('business_settings', function ($table) {
                $table->increments('id');
                $table->string('type', 255)->nullable();
                $table->longText('value')->nullable();
                $table->string('lang', 10)->nullable()->default(null);
                $table->timestamps();
            });
            $this->info('  Created business_settings table.');
        }

        // Add user_type column if missing
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'user_type')) {
            Schema::table('users', function ($table) {
                $table->string('user_type', 20)->default('customer')->after('email');
            });
            $this->info('  Added user_type column to users table.');
        }

        // Publish and run spatie permission migrations
        try {
            if (!Schema::hasTable('roles')) {
                Artisan::call('vendor:publish', [
                    '--provider' => 'Spatie\Permission\PermissionServiceProvider',
                    '--tag' => 'permission-migrations',
                ]);
                Artisan::call('migrate', ['--force' => true]);
                $this->info('  Created permission tables (roles, permissions).');
            }
        } catch (\Exception $e) {
            $this->warn('  Could not create permission tables: ' . $e->getMessage());
        }

        // Seed essential business settings
        $this->seedEssentialSettings();
    }

    private function seedEssentialSettings()
    {
        $defaults = [
            ['type' => 'system_default_currency', 'value' => '1'],
            ['type' => 'home_default_currency', 'value' => '1'],
            ['type' => 'system_logo_white', 'value' => null],
            ['type' => 'system_logo_black', 'value' => null],
            ['type' => 'email_verification', 'value' => '0'],
            ['type' => 'google_recaptcha', 'value' => '0'],
        ];

        foreach ($defaults as $setting) {
            DB::table('business_settings')->updateOrInsert(
                ['type' => $setting['type']],
                $setting
            );
        }
        $this->info('  Seeded essential business settings.');
    }

    // ── Step 4: Create Admin ──────────────────────────────────────────

    private function step4_createAdmin()
    {
        $this->info('');
        $this->info('── Step 4/6: Admin User Setup ──');
        $this->info('');

        // Check for existing admin
        $existingAdmin = null;
        try {
            if (Schema::hasColumn('users', 'user_type')) {
                $existingAdmin = User::where('user_type', 'admin')->first();
            }
        } catch (\Exception $e) {
            // Table may not exist yet
        }

        if ($existingAdmin && !$this->option('force')) {
            $this->info("Admin user already exists: {$existingAdmin->email}");
            if (!$this->confirm('Create a new admin user?', false)) {
                // Still ensure role is assigned
                $this->ensureAdminRole($existingAdmin);
                return;
            }
        }

        $name = $this->ask('Admin name', 'Admin');
        $email = $this->ask('Admin email', 'admin@example.com');

        // Validate email
        while (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');
            $email = $this->ask('Admin email');
        }

        $password = $this->secret('Admin password (min 6 characters)');
        while (strlen($password) < 6) {
            $this->error('Password must be at least 6 characters.');
            $password = $this->secret('Admin password (min 6 characters)');
        }

        $confirmPassword = $this->secret('Confirm admin password');
        while ($password !== $confirmPassword) {
            $this->error('Passwords do not match.');
            $password = $this->secret('Admin password (min 6 characters)');
            $confirmPassword = $this->secret('Confirm admin password');
        }

        // Remove any existing user with that email
        try {
            User::where('email', $email)->delete();
        } catch (\Exception $e) {
            // Ignore
        }

        // Create admin user — bypass $fillable to set user_type
        $admin = new User();
        $admin->name = $name;
        $admin->email = $email;
        $admin->password = Hash::make($password);
        $admin->email_verified_at = now();
        if (Schema::hasColumn('users', 'user_type')) {
            $admin->user_type = 'admin';
        }
        $admin->save();

        $this->ensureAdminRole($admin);

        $this->info("✓ Admin user created successfully!");
        $this->info("  Email: {$email}");
    }

    private function ensureAdminRole(User $admin)
    {
        try {
            if (!Schema::hasTable('roles')) {
                return;
            }

            // Create Super Admin role if it doesn't exist
            $roleModel = config('permission.models.role', \Spatie\Permission\Models\Role::class);
            $guardName = $admin->getGuardNames()->first() ?? 'web';

            $role = $roleModel::firstOrCreate(
                ['name' => 'Super Admin', 'guard_name' => $guardName]
            );

            if (!$admin->hasRole('Super Admin')) {
                $admin->assignRole('Super Admin');
            }

            $this->info('  ✓ Super Admin role assigned.');
        } catch (\Exception $e) {
            $this->warn("  Could not assign role: " . $e->getMessage());
        }
    }

    // ── Step 5: Enable Routes ─────────────────────────────────────────

    private function step5_enableRoutes()
    {
        $this->info('');
        $this->info('── Step 5/6: Enabling Routes ──');
        $this->info('');

        $routeServiceProviderTxt = base_path('app/Providers/RouteServiceProvider.txt');
        $routeServiceProviderPhp = base_path('app/Providers/RouteServiceProvider.php');

        if (file_exists($routeServiceProviderTxt)) {
            copy($routeServiceProviderTxt, $routeServiceProviderPhp);
            $this->info('✓ All application routes enabled.');
        } else {
            // Manually uncomment routes in the PHP file
            $this->enableRoutesManually($routeServiceProviderPhp);
        }
    }

    private function enableRoutesManually(string $filePath)
    {
        $content = file_get_contents($filePath);

        $routesToEnable = [
            'mapWebRoutes',
            'mapAdminRoutes',
            'mapSellerRoutes',
        ];

        foreach ($routesToEnable as $route) {
            $content = preg_replace(
                '/\/\/\s*\$this->' . $route . '\(\);/',
                '$this->' . $route . '();',
                $content
            );
        }

        file_put_contents($filePath, $content);
        $this->info('✓ Core routes (web, admin, seller) enabled.');
    }

    // ── Step 6: Finalize ──────────────────────────────────────────────

    private function step6_finalize()
    {
        $this->info('');
        $this->info('── Step 6/6: Finalizing Installation ──');
        $this->info('');

        // Generate app key if not set
        if (empty(config('app.key')) || config('app.key') === 'base64:') {
            Artisan::call('key:generate', ['--force' => true]);
            $this->info('✓ Application key generated.');
        } else {
            $this->info('✓ Application key already set.');
        }

        // Generate SYSTEM_KEY for API authentication
        $currentKey = env('SYSTEM_KEY');
        if (empty($currentKey)) {
            $systemKey = bin2hex(random_bytes(16));
            $this->writeEnv('SYSTEM_KEY', $systemKey);
            $this->info("✓ System key generated: {$systemKey}");
            $this->warn('  Save this key — it is required in the System-Key header for API requests.');
        } else {
            $this->info('✓ System key already set.');
        }

        // Set APP_DEBUG to true for development
        $this->writeEnv('APP_DEBUG', 'true');

        // Clear all caches
        try {
            Artisan::call('optimize:clear');
        } catch (\Exception $e) {
            // Individual clears as fallback
            try { Artisan::call('config:clear'); } catch (\Exception $e) {}
            try { Artisan::call('cache:clear'); } catch (\Exception $e) {}
            try { Artisan::call('route:clear'); } catch (\Exception $e) {}
            try { Artisan::call('view:clear'); } catch (\Exception $e) {}
        }
        $this->info('✓ Caches cleared.');

        // Mark as installed
        $this->writeEnv('APP_INSTALLED', 'true');
        $this->info('✓ Application marked as installed.');
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function isInstalled(): bool
    {
        return env('APP_INSTALLED') === 'true' || env('APP_INSTALLED') === true;
    }

    private function writeEnv(string $key, string $value)
    {
        $path = $this->envPath;
        if (!file_exists($path)) {
            return;
        }

        $content = file_get_contents($path);
        $escapedValue = $value;

        // Quote values that contain spaces or special characters
        if (preg_match('/[\s#"\'\\\\]/', $value) || $value === '') {
            $escapedValue = '"' . str_replace('"', '\\"', $value) . '"';
        }

        // Check if key exists
        $pattern = '/^' . preg_quote($key, '/') . '=.*/m';
        if (preg_match($pattern, $content)) {
            $content = preg_replace($pattern, $key . '=' . $escapedValue, $content);
        } else {
            $content .= "\n" . $key . '=' . $escapedValue;
        }

        file_put_contents($path, $content);
    }

    private function refreshDatabaseConfig()
    {
        // Re-read .env and update runtime config
        $envContent = file_get_contents($this->envPath);
        $lines = explode("\n", $envContent);
        $envMap = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"");
                $envMap[$k] = $v;
            }
        }

        $connection = $envMap['DB_CONNECTION'] ?? 'mysql';
        config(['database.default' => $connection]);

        if ($connection === 'mysql') {
            config([
                'database.connections.mysql.host'     => $envMap['DB_HOST'] ?? '127.0.0.1',
                'database.connections.mysql.port'     => $envMap['DB_PORT'] ?? '3306',
                'database.connections.mysql.database' => $envMap['DB_DATABASE'] ?? '',
                'database.connections.mysql.username' => $envMap['DB_USERNAME'] ?? '',
                'database.connections.mysql.password' => $envMap['DB_PASSWORD'] ?? '',
            ]);
        } elseif ($connection === 'sqlite') {
            config([
                'database.connections.sqlite.database' => $envMap['DB_DATABASE'] ?? database_path('database.sqlite'),
            ]);
        }

        DB::purge();
    }

    private function parseArtisanOutput(): string
    {
        return trim(Artisan::output());
    }
}
