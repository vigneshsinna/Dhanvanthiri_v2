<?php

declare(strict_types=1);

// Attempt to increase execution time for extracting large vendor folders
@set_time_limit(300);
@ini_set('max_execution_time', '300');

$secretKey = 'dhanvanthiri2026';

if (!isset($_GET['key']) || $_GET['key'] !== $secretKey) {
    http_response_code(403);
    echo '<h1>403 Access Denied</h1><p>Use install.php?key=' . htmlspecialchars($secretKey, ENT_QUOTES, 'UTF-8') . '</p>';
    exit;
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function runArtisan(string $command, array $params = []): array
{
    try {
        $autoloadPath = __DIR__ . '/core/vendor/autoload.php';
        if (!file_exists($autoloadPath)) {
            return [
                'status' => 1,
                'output' => "Composer dependencies are missing. Run composer install in core/ first.\n",
            ];
        }

        static $kernel = null;
        static $app = null;

        if ($app === null) {
            require_once $autoloadPath;
            $app = require __DIR__ . '/core/bootstrap/app.php';
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();
        }

        $buffer = new Symfony\Component\Console\Output\BufferedOutput();
        $status = $kernel->call($command, $params, $buffer);

        return [
            'status' => $status,
            'output' => $buffer->fetch(),
        ];
    } catch (Throwable $exception) {
        return [
            'status' => 500,
            'output' => $exception->getMessage() . "\n" . $exception->getTraceAsString(),
        ];
    }
}

function bootstrapLaravelForInstaller()
{
    static $app = null;
    static $kernel = null;

    if ($app !== null) {
        return $app;
    }

    $autoloadPath = __DIR__ . '/core/vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        throw new RuntimeException('Composer dependencies are missing. Run composer install in core/ first.');
    }

    require_once $autoloadPath;
    $app = require __DIR__ . '/core/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    return $app;
}

function paymentMethodNamesForInstaller(): array
{
    return [
        'paypal',
        'stripe',
        'sslcommerz',
        'instamojo',
        'razorpay',
        'paystack',
        'voguepay',
        'payhere',
        'ngenius',
        'iyzico',
        'nagad',
        'bkash',
        'aamarpay',
        'authorizenet',
        'payku',
        'mercadopago',
        'paymob',
        'tap',
    ];
}

function repairEssentialSeedTablesForInstaller(): array
{
    bootstrapLaravelForInstaller();

    $output = '';

    if (!Illuminate\Support\Facades\Schema::hasTable('languages')) {
        Illuminate\Support\Facades\Schema::create('languages', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('code')->nullable();
            $table->tinyInteger('rtl')->default(0);
            $table->tinyInteger('status')->default(1);
            $table->string('app_lang_code', 100)->nullable();
            $table->timestamps();
        });
        $output .= "Created languages table\n";
    } else {
        $output .= "languages table already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasTable('business_settings')) {
        Illuminate\Support\Facades\Schema::create('business_settings', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->text('value')->nullable();
            $table->string('lang')->nullable();
            $table->timestamps();
        });
        $output .= "Created business_settings table\n";
    } else {
        $output .= "business_settings table already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasTable('translations')) {
        Illuminate\Support\Facades\Schema::create('translations', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->string('lang')->nullable();
            $table->string('lang_key')->nullable();
            $table->text('lang_value')->nullable();
            $table->timestamps();
        });
        $output .= "Created translations table\n";
    } else {
        $output .= "translations table already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasTable('app_translations')) {
        Illuminate\Support\Facades\Schema::create('app_translations', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->string('lang')->nullable();
            $table->string('lang_key')->nullable();
            $table->text('lang_value')->nullable();
            $table->timestamps();
        });
        $output .= "Created app_translations table\n";
    } else {
        $output .= "app_translations table already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasTable('category_translations')) {
        Illuminate\Support\Facades\Schema::create('category_translations', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->string('lang', 10);
            $table->timestamps();
        });
        $output .= "Created category_translations table\n";
    } else {
        $output .= "category_translations table already exists\n";
    }

    return [
        'ok' => true,
        'output' => $output,
    ];
}

function repairPaymentMethodsForInstaller(): array
{
    bootstrapLaravelForInstaller();

    if (!Illuminate\Support\Facades\Schema::hasTable('payment_methods')) {
        return [
            'ok' => false,
            'output' => "payment_methods table is missing. Run Migrate Database first.\n",
        ];
    }

    $output = '';

    if (!Illuminate\Support\Facades\Schema::hasColumn('payment_methods', 'active')) {
        Illuminate\Support\Facades\Schema::table('payment_methods', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->tinyInteger('active')->default(0);
        });
        $output .= "Added payment_methods.active\n";
    } else {
        $output .= "payment_methods.active already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasColumn('payment_methods', 'addon_identifier')) {
        Illuminate\Support\Facades\Schema::table('payment_methods', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->string('addon_identifier', 191)->nullable();
        });
        $output .= "Added payment_methods.addon_identifier\n";
    } else {
        $output .= "payment_methods.addon_identifier already exists\n";
    }

    if (!Illuminate\Support\Facades\Schema::hasColumn('payment_methods', 'status')) {
        Illuminate\Support\Facades\Schema::table('payment_methods', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->tinyInteger('status')->default(1);
        });
        $output .= "Added payment_methods.status\n";
    } else {
        $output .= "payment_methods.status already exists\n";
    }

    $now = Illuminate\Support\Carbon::now();
    foreach (paymentMethodNamesForInstaller() as $name) {
        $exists = Illuminate\Support\Facades\DB::table('payment_methods')->where('name', $name)->exists();
        Illuminate\Support\Facades\DB::table('payment_methods')->updateOrInsert(
            ['name' => $name],
            [
                'image' => null,
                'active' => 0,
                'status' => 1,
                'addon_identifier' => null,
                'updated_at' => $now,
                'created_at' => $exists
                    ? Illuminate\Support\Facades\DB::raw('created_at')
                    : $now,
            ]
        );
    }

    $count = Illuminate\Support\Facades\DB::table('payment_methods')->count();
    $output .= "Seeded/verified payment method rows. Current count: {$count}\n";

    return [
        'ok' => true,
        'output' => $output,
    ];
}

function repairProductCatalogColumnsForInstaller(): array
{
    bootstrapLaravelForInstaller();

    if (!Illuminate\Support\Facades\Schema::hasTable('products')) {
        return [
            'ok' => false,
            'output' => "products table is missing. Run Migrate Database first.\n",
        ];
    }

    $output = '';
    $columns = [
        'tamil_name' => ['string', 191, true, null],
        'badge' => ['string', 191, true, null],
        'chips' => ['text', null, true, null],
        'taste_profile' => ['string', 191, true, null],
        'pair_with' => ['text', null, true, null],
        'about' => ['text', null, true, null],
        'why_love' => ['text', null, true, null],
        'storage' => ['string', 191, true, null],
        'is_premium' => ['boolean', null, false, 0],
        'custom_labels' => ['text', null, true, null],
    ];

    foreach ($columns as $column => $definition) {
        if (Illuminate\Support\Facades\Schema::hasColumn('products', $column)) {
            $output .= "products.{$column} already exists\n";
            continue;
        }

        Illuminate\Support\Facades\Schema::table('products', function (Illuminate\Database\Schema\Blueprint $table) use ($column, $definition) {
            [$type, $length, $nullable, $default] = $definition;

            if ($type === 'string') {
                $columnDefinition = $table->string($column, $length);
            } elseif ($type === 'boolean') {
                $columnDefinition = $table->boolean($column);
            } else {
                $columnDefinition = $table->text($column);
            }

            if ($nullable) {
                $columnDefinition->nullable();
            }

            if ($default !== null) {
                $columnDefinition->default($default);
            }
        });

        $output .= "Added products.{$column}\n";
    }

    return [
        'ok' => true,
        'output' => $output,
    ];
}

function renderPageStart(string $title): void
{
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' . h($title) . '</title>';
    echo '<style>';
    echo 'body{font-family:Arial,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;background:#f5f5f5;color:#1f2937;}';
    echo '.card{background:#fff;border:1px solid #d1d5db;border-radius:8px;padding:20px;margin-bottom:18px;}';
    echo '.btn{display:inline-block;padding:10px 16px;margin:4px 8px 4px 0;background:#166534;color:#fff;text-decoration:none;border-radius:6px;}';
    echo '.btn.alt{background:#1d4ed8;}';
    echo '.btn.warn{background:#b45309;}';
    echo 'pre{background:#111827;color:#d1fae5;padding:16px;border-radius:8px;overflow:auto;white-space:pre-wrap;}';
    echo '.ok{color:#166534;font-weight:bold;}.fail{color:#b91c1c;font-weight:bold;}.note{color:#1d4ed8;font-weight:bold;}';
    echo '</style></head><body>';
    echo '<div class="card"><h1>' . h($title) . '</h1>';
}

function renderPageEnd(): void
{
    echo '<p><a class="btn alt" href="?key=' . h((string)($_GET['key'] ?? '')) . '">Back to menu</a></p>';
    echo '</div></body></html>';
}

function setEnvValue(string $key, string $value): bool
{
    $envPath = __DIR__ . '/core/.env';
    $content = @file_get_contents($envPath);

    if ($content === false) {
        return false;
    }

    $line = $key . '=' . $value;
    if (preg_match('/^' . preg_quote($key, '/') . '=.*$/m', $content)) {
        $content = preg_replace('/^' . preg_quote($key, '/') . '=.*$/m', $line, $content);
    } else {
        $content = rtrim($content) . "\n" . $line . "\n";
    }

    return @file_put_contents($envPath, $content) !== false;
}

$action = $_GET['action'] ?? 'menu';
$requestKey = (string)$_GET['key'];

renderPageStart('Dhanvanthiri Hostinger Installer');

if ($action === 'menu') {
    echo '<p>Use this helper after uploading the package and editing <code>core/.env</code>.</p>';
    echo '<p class="note">Admin and IT User accounts are created from database seeders, not from <code>.env</code>. Run both Migrate Database and Seed Database on a fresh install.</p>';
    echo '<p>';
    if (file_exists(__DIR__ . '/core/vendor.zip')) {
        echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=extract_vendor">0. Extract Vendor Zip</a>';
    }
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=composer_install">1. Composer Install</a>';
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=permissions">2. Fix Permissions</a>';
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=migrate">3. Migrate Database</a>';
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=seed">4. Seed Database</a>';
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=seed_admin_users">5. Seed / Reset Admin Users</a>';
    echo '<a class="btn" href="?key=' . h($requestKey) . '&action=optimize">6. Optimize</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=repair_admin">Repair Production Admin</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=repair_payment_methods">Repair Payment Methods</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=repair_product_catalog">Repair Product Catalog Columns</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=production_check">Production Check</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=seed_products">Seed Products Only</a>';
    echo '<a class="btn alt" href="?key=' . h($requestKey) . '&action=clear_cache">Clear Cache</a>';
    echo '<a class="btn warn" href="?key=' . h($requestKey) . '&action=debug">Debug</a>';
    echo '</p>';
    echo '<p><strong>Fresh-install seeded users</strong><br>IT User (`super_admin`): <code>it@dhanvanthiri.local</code> / <code>password123</code><br>Admin User (`admin`): <code>admin@dhanvanthiri.local</code> / <code>password123</code></p>';
    echo '<p class="note">Storage requests are handled by the root .htaccess rewrite, so no symlink step is required in this package layout.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'extract_vendor') {
    echo '<h2>Extract Vendor Dependencies</h2><pre>';
    $zipPath = __DIR__ . '/core/vendor.zip';
    $extractTo = __DIR__ . '/core/vendor';

    if (!file_exists($zipPath)) {
        echo h("vendor.zip not found.\n");
        echo '</pre><p class="fail">Extraction failed.</p>';
        renderPageEnd();
        exit;
    }

    if (!class_exists('ZipArchive')) {
        echo h("PHP ZipArchive extension is required to extract vendor.zip.\n");
        echo '</pre><p class="fail">Extraction failed.</p>';
        renderPageEnd();
        exit;
    }

    if (!is_dir($extractTo)) {
        mkdir($extractTo, 0755, true);
    }

    $zip = new ZipArchive;
    if ($zip->open($zipPath) === true) {
        $zip->extractTo($extractTo);
        $zip->close();
        echo h("Successfully extracted vendor dependencies!\n");
        unlink($zipPath);
        echo h("Deleted vendor.zip to save space.\n");
        echo '</pre><p class="ok">Vendor extraction completed.</p>';
    } else {
        echo h("Failed to open vendor.zip.\n");
        echo '</pre><p class="fail">Extraction failed.</p>';
    }

    renderPageEnd();
    exit;
}

if ($action === 'composer_install') {
    echo '<h2>Composer Install</h2><pre>';

    if (file_exists(__DIR__ . '/core/vendor/autoload.php')) {
        echo h("Composer dependencies are already bundled in this package. No install step is required.\n");
        echo '</pre><p class="ok">Composer install is not needed for this build.</p>';
        renderPageEnd();
        exit;
    }

    if (!function_exists('exec')) {
        echo h("exec() is disabled on this host, and this package does not include core/vendor.\n");
        echo h("Rebuild the Hostinger package with bundled vendor or run composer manually through SSH/terminal access.\n");
    } else {
        $corePath = __DIR__ . '/core';
        $command = 'cd ' . escapeshellarg($corePath) . ' && composer install --no-dev --optimize-autoloader 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);
        echo h(implode("\n", $output) . "\n");
        echo $exitCode === 0 ? '</pre><p class="ok">Composer install completed.</p>' : '</pre><p class="fail">Composer install failed.</p>';
        renderPageEnd();
        exit;
    }

    echo '</pre><p class="fail">Composer install was not executed.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'permissions') {
    echo '<h2>Fix Permissions</h2><pre>';
    $directories = [
        'core/storage',
        'core/storage/app',
        'core/storage/app/public',
        'core/storage/framework',
        'core/storage/framework/cache',
        'core/storage/framework/sessions',
        'core/storage/framework/views',
        'core/storage/logs',
        'core/bootstrap/cache',
    ];

    foreach ($directories as $directory) {
        $fullPath = __DIR__ . '/' . $directory;
        if (!is_dir($fullPath)) {
            if (@mkdir($fullPath, 0755, true)) {
                echo h("Created {$directory}\n");
            } else {
                echo h("Failed to create {$directory}\n");
            }
            continue;
        }

        @chmod($fullPath, 0755);
        echo h("Prepared {$directory}\n");
    }

    echo '</pre><p class="ok">Permissions step completed.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'migrate') {
    echo '<h2>Migrate Database</h2><pre>';
    try {
        $repair = repairEssentialSeedTablesForInstaller();
        echo h("Repair seed prerequisite tables\n" . trim($repair['output']) . "\n\n");
    } catch (Throwable $exception) {
        echo h("Seed prerequisite repair failed: " . $exception->getMessage() . "\n\n");
    }
    $result = runArtisan('migrate', ['--force' => true]);
    echo h($result['output']);
    echo $result['status'] === 0 ? '</pre><p class="ok">Database migration completed.</p>' : '</pre><p class="fail">Database migration failed. Check core/.env first.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'seed') {
    echo '<h2>Seed Database</h2><pre>';
    echo h("Run this only on a fresh install or when you explicitly want the baseline catalog and admin accounts.\n\n");

    // Fix: Composer classmap may point to database/seeds (old) instead of database/seeders (new).
    // Manually register seeder classes so the autoloader can find them.
    $seedersDir = __DIR__ . '/core/database/seeders';
    if (is_dir($seedersDir)) {
        foreach (glob($seedersDir . '/*.php') as $seederFile) {
            require_once $seederFile;
        }
        echo h("Registered seeder classes from database/seeders/\n");
    }

    $result = runArtisan('db:seed', ['--force' => true]);
    echo h($result['output']);
    echo $result['status'] === 0
        ? '</pre><p class="ok">Database seed completed. Initial IT User and Admin User accounts are now available.</p>'
        : '</pre><p class="fail">Database seed failed. Make sure migrations ran first and the database is ready for baseline data.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'seed_admin_users') {
    echo '<h2>Seed / Reset Admin Users</h2><pre>';
    echo h("This action provisions only the IT User and Admin User accounts.\n");
    echo h("Use it when login fails or when you need to restore the baseline admin credentials without rerunning the full product seed.\n\n");
    $result = runArtisan('db:seed', [
        '--class' => 'Database\\Seeders\\AdminAccessSeeder',
        '--force' => true,
    ]);
    echo h($result['output']);
    echo $result['status'] === 0
        ? '</pre><p class="ok">Admin users were seeded/reset successfully.</p>'
        : '</pre><p class="fail">Admin user recovery failed. Check database connectivity and migration status first.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'seed_products') {
    @set_time_limit(600);
    @ini_set('max_execution_time', '600');

    echo '<h2>Seed Products Only</h2><pre>';
    echo h("This seeds the Dhanvathiri catalog products. It does not reset admin users.\n");
    echo h("Warning: the current seeder truncates products, product_categories, and product_stocks before inserting the packaged catalog.\n\n");
    @ob_flush();
    @flush();

    try {
        bootstrapLaravelForInstaller();

        $requiredTables = ['products', 'product_categories', 'product_stocks', 'categories', 'uploads'];
        foreach ($requiredTables as $table) {
            if (!Illuminate\Support\Facades\Schema::hasTable($table)) {
                throw new RuntimeException("Required table is missing: {$table}");
            }
        }

        $catalogRepair = repairProductCatalogColumnsForInstaller();
        echo h("Product catalog column repair\n" . trim($catalogRepair['output']) . "\n\n");

        $requiredProductColumns = [
            'name',
            'tamil_name',
            'added_by',
            'user_id',
            'category_id',
            'photos',
            'thumbnail_img',
            'unit_price',
            'published',
            'approved',
            'cash_on_delivery',
            'current_stock',
            'slug',
            'badge',
            'chips',
            'taste_profile',
            'pair_with',
            'about',
            'why_love',
            'storage',
            'is_premium',
        ];
        foreach ($requiredProductColumns as $column) {
            if (!Illuminate\Support\Facades\Schema::hasColumn('products', $column)) {
                throw new RuntimeException("products.{$column} column is missing. Run Repair Production Admin first.");
            }
        }

        echo h("Before seeding\n");
        foreach (['products', 'product_categories', 'product_stocks', 'uploads'] as $table) {
            echo h($table . ': ' . Illuminate\Support\Facades\DB::table($table)->count() . "\n");
        }
        echo h("\nRunning DhanvathiriProductsSeeder...\n\n");
        @ob_flush();
        @flush();

        $seederFile = __DIR__ . '/core/database/seeders/DhanvathiriProductsSeeder.php';
        if (file_exists($seederFile)) {
            require_once $seederFile;
        }

        $result = runArtisan('db:seed', [
            '--class' => 'Database\\Seeders\\DhanvathiriProductsSeeder',
            '--force' => true,
        ]);
        echo h($result['output']);

        echo h("\nAfter seeding\n");
        foreach (['products', 'product_categories', 'product_stocks', 'uploads'] as $table) {
            echo h($table . ': ' . Illuminate\Support\Facades\DB::table($table)->count() . "\n");
        }

        echo $result['status'] === 0
            ? '</pre><p class="ok">Product catalog seeded successfully.</p>'
            : '</pre><p class="fail">Product seeding failed. Check the output above.</p>';
    } catch (Throwable $exception) {
        echo h("Product seeding failed before completion: " . $exception->getMessage() . "\n");
        echo h($exception->getTraceAsString() . "\n");
        echo '</pre><p class="fail">Product seeding failed. Check the output above.</p>';
    }

    renderPageEnd();
    exit;
}

if ($action === 'production_check') {
    echo '<h2>Production Check</h2><pre>';

    try {
        require_once __DIR__ . '/core/vendor/autoload.php';
        $app = require __DIR__ . '/core/bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        $tables = [
            'users',
            'products',
            'product_categories',
            'product_stocks',
            'categories',
            'payment_methods',
            'business_settings',
            'languages',
            'translations',
            'app_translations',
            'uploads',
        ];

        echo h("Database table counts\n");
        foreach ($tables as $table) {
            if (Illuminate\Support\Facades\Schema::hasTable($table)) {
                echo h($table . ': ' . Illuminate\Support\Facades\DB::table($table)->count() . "\n");
            } else {
                echo h($table . ': MISSING TABLE' . "\n");
            }
        }

        if (Illuminate\Support\Facades\Schema::hasTable('products')) {
            echo h("\nProduct visibility counts\n");
            echo h('published=1: ' . (Illuminate\Support\Facades\Schema::hasColumn('products', 'published') ? Illuminate\Support\Facades\DB::table('products')->where('published', 1)->count() : 'published column missing') . "\n");
            echo h('approved=1: ' . (Illuminate\Support\Facades\Schema::hasColumn('products', 'approved') ? Illuminate\Support\Facades\DB::table('products')->where('approved', 1)->count() : 'approved column missing') . "\n");
            echo h("added_by=admin: " . (Illuminate\Support\Facades\Schema::hasColumn('products', 'added_by') ? Illuminate\Support\Facades\DB::table('products')->where('added_by', 'admin')->count() : 'added_by column missing') . "\n");
            echo h("draft=0: " . (Illuminate\Support\Facades\Schema::hasColumn('products', 'draft') ? Illuminate\Support\Facades\DB::table('products')->where('draft', 0)->count() : 'draft column missing') . "\n");

            echo h("\nRequired product seeder columns\n");
            foreach (['name', 'tamil_name', 'thumbnail_img', 'badge', 'chips', 'taste_profile', 'pair_with', 'why_love', 'storage', 'is_premium'] as $column) {
                echo h("products.{$column}: " . (Illuminate\Support\Facades\Schema::hasColumn('products', $column) ? 'yes' : 'MISSING') . "\n");
            }
        }

        if (Illuminate\Support\Facades\Schema::hasTable('payment_methods')) {
            echo h("\nPayment methods and Blade partials\n");
            $paymentColumns = ['id', 'name'];
            foreach (['active', 'status', 'addon_identifier'] as $column) {
                echo h("payment_methods.{$column}: " . (Illuminate\Support\Facades\Schema::hasColumn('payment_methods', $column) ? 'yes' : 'MISSING') . "\n");
                if (Illuminate\Support\Facades\Schema::hasColumn('payment_methods', $column)) {
                    $paymentColumns[] = $column;
                }
            }

            $methodsQuery = Illuminate\Support\Facades\DB::table('payment_methods')->orderBy('name');
            if (Illuminate\Support\Facades\Schema::hasColumn('payment_methods', 'addon_identifier')) {
                $methodsQuery->whereNull('addon_identifier');
            }
            $methods = $methodsQuery->get($paymentColumns);
            foreach ($methods as $method) {
                $partial = __DIR__ . '/core/resources/views/backend/setup_configurations/payment_method/partials/' . $method->name . '.blade.php';
                $active = property_exists($method, 'active') ? $method->active : 'missing';
                $status = property_exists($method, 'status') ? $method->status : 'missing';
                echo h("#{$method->id} {$method->name} active={$active} status={$status} partial=" . (file_exists($partial) ? 'yes' : 'NO') . "\n");
            }
        }

        echo h("\nRoute checks\n");
        foreach (['api/v2/products', 'api/v2/categories', 'api/v2/payment-types'] as $uri) {
            $route = Illuminate\Support\Facades\Route::getRoutes()->match(Illuminate\Http\Request::create('/' . $uri, 'GET'));
            echo h('/' . $uri . ' -> ' . $route->getName() . ' ' . $route->uri() . "\n");
        }
    } catch (Throwable $exception) {
        echo h("Production check failed: " . $exception->getMessage() . "\n" . $exception->getTraceAsString() . "\n");
    }

    echo h("\nRecent Laravel logs\n");
    foreach (glob(__DIR__ . '/core/storage/logs/*.log') ?: [] as $logPath) {
        echo h("\n--- " . basename($logPath) . " ---\n");
        $lines = @file($logPath, FILE_IGNORE_NEW_LINES) ?: [];
        echo h(implode("\n", array_slice($lines, -80)) . "\n");
    }

    echo '</pre><p class="ok">Production check complete.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'repair_payment_methods') {
    echo '<h2>Repair Payment Methods</h2><pre>';

    try {
        $repair = repairPaymentMethodsForInstaller();
        echo h($repair['output']);
        echo $repair['ok']
            ? '</pre><p class="ok">Payment methods schema/data repaired.</p>'
            : '</pre><p class="fail">Payment methods repair failed.</p>';
    } catch (Throwable $exception) {
        echo h("Payment methods repair failed: " . $exception->getMessage() . "\n" . $exception->getTraceAsString() . "\n");
        echo '</pre><p class="fail">Payment methods repair failed.</p>';
    }

    renderPageEnd();
    exit;
}

if ($action === 'repair_product_catalog') {
    echo '<h2>Repair Product Catalog Columns</h2><pre>';

    try {
        $repair = repairProductCatalogColumnsForInstaller();
        echo h($repair['output']);
        echo $repair['ok']
            ? '</pre><p class="ok">Product catalog columns repaired.</p>'
            : '</pre><p class="fail">Product catalog repair failed.</p>';
    } catch (Throwable $exception) {
        echo h("Product catalog repair failed: " . $exception->getMessage() . "\n" . $exception->getTraceAsString() . "\n");
        echo '</pre><p class="fail">Product catalog repair failed.</p>';
    }

    renderPageEnd();
    exit;
}

if ($action === 'optimize') {
    echo '<h2>Optimize</h2><pre>';
    $commands = [
        ['config:cache', 'Config cache'],
    ];
    echo h("Route cache\nSkipped because this legacy route set contains duplicate route names. Laravel runs normally without route cache.\n\n");

    $viewsPath = __DIR__ . '/core/resources/views';
    if (is_dir($viewsPath)) {
        $commands[] = ['view:cache', 'View cache'];
    } else {
        echo h("View cache\nSkipped because core/resources/views is not present in this package.\n\n");
    }

    $allPassed = true;
    foreach ($commands as [$command, $label]) {
        $result = runArtisan($command);
        echo h($label . "\n" . trim($result['output']) . "\n\n");
        if ($result['status'] !== 0) {
            $allPassed = false;
        }
    }

    echo $allPassed ? '</pre><p class="ok">Optimization completed.</p>' : '</pre><p class="fail">One or more optimize commands failed.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'clear_cache') {
    echo '<h2>Clear Cache</h2><pre>';
    $result = runArtisan('optimize:clear');
    echo h($result['output']);
    echo $result['status'] === 0 ? '</pre><p class="ok">Cache cleared.</p>' : '</pre><p class="fail">Cache clear failed.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'repair_admin') {
    echo '<h2>Repair Production Admin</h2><pre>';

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $appUrl = $host !== '' ? $scheme . '://' . $host : '';

    $envUpdates = [
        'APP_ENV' => 'production',
        'APP_DEBUG' => 'false',
        'HOSTINGER_SHARED_MODE' => 'true',
        'DEBUGBAR_ENABLED' => 'false',
    ];

    if ($appUrl !== '') {
        $envUpdates['APP_URL'] = $appUrl;
        $envUpdates['LARAVEL_APP_URL'] = $appUrl;
        $envUpdates['ASSET_URL'] = $appUrl;
    }

    foreach ($envUpdates as $key => $value) {
        echo h("Setting {$key}={$value} ... ");
        echo setEnvValue($key, $value) ? h("ok\n") : h("failed\n");
    }

    $commands = [
        ['optimize:clear', [], 'Clear all Laravel caches'],
        ['view:clear', [], 'Clear compiled Blade views'],
        ['config:clear', [], 'Clear config cache'],
        ['route:clear', [], 'Clear route cache'],
        ['cache:clear', [], 'Clear application cache'],
        ['migrate', ['--force' => true], 'Run pending migrations'],
        ['config:cache', [], 'Rebuild production config cache'],
    ];
    echo h("\nRoute cache\nSkipped because this legacy route set contains duplicate route names. Laravel runs normally without route cache.\n");

    $viewsPath = __DIR__ . '/core/resources/views';
    if (is_dir($viewsPath)) {
        $commands[] = ['view:cache', [], 'Rebuild view cache'];
    }

    $allPassed = true;
    try {
        $repair = repairEssentialSeedTablesForInstaller();
        echo h("\nRepair seed prerequisite tables\n" . trim($repair['output']) . "\n");
    } catch (Throwable $exception) {
        $allPassed = false;
        echo h("\nRepair seed prerequisite tables\n" . $exception->getMessage() . "\n");
    }

    foreach ($commands as [$command, $params, $label]) {
        $result = runArtisan($command, $params);
        echo h("\n{$label}\n" . trim($result['output']) . "\n");
        if ($result['status'] !== 0) {
            $allPassed = false;
            echo h("Status: {$result['status']}\n");
        }
    }

    try {
        $repair = repairPaymentMethodsForInstaller();
        echo h("\nRepair payment_methods schema/data\n" . trim($repair['output']) . "\n");
        if (!$repair['ok']) {
            $allPassed = false;
        }
    } catch (Throwable $exception) {
        $allPassed = false;
        echo h("\nRepair payment_methods schema/data\n" . $exception->getMessage() . "\n");
    }

    try {
        $repair = repairProductCatalogColumnsForInstaller();
        echo h("\nRepair products catalog columns\n" . trim($repair['output']) . "\n");
        if (!$repair['ok']) {
            $allPassed = false;
        }
    } catch (Throwable $exception) {
        $allPassed = false;
        echo h("\nRepair products catalog columns\n" . $exception->getMessage() . "\n");
    }

    $assetChecks = [
        'core/public/assets/css/vendors.css',
        'core/public/assets/css/aiz-core.css',
        'core/public/assets/js/vendors.js',
        'core/resources/views/backend/layouts/app.blade.php',
    ];

    echo h("\nAsset/layout checks\n");
    foreach ($assetChecks as $relativePath) {
        echo h($relativePath . ': ' . (file_exists(__DIR__ . '/' . $relativePath) ? 'yes' : 'NO') . "\n");
    }

    echo $allPassed
        ? '</pre><p class="ok">Production admin repair completed. Hard refresh /admin with Ctrl+F5 or test in incognito.</p>'
        : '</pre><p class="fail">Repair finished with one or more command failures. Check the output above.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'debug') {
    echo '<h2>Debug</h2><pre>';
    $checks = [
        'PHP version' => PHP_VERSION,
        'exec() available' => function_exists('exec') ? 'yes' : 'no',
        'core/.env exists' => file_exists(__DIR__ . '/core/.env') ? 'yes' : 'no',
        'core/vendor/autoload.php exists' => file_exists(__DIR__ . '/core/vendor/autoload.php') ? 'yes' : 'no',
        'app/index.html exists' => file_exists(__DIR__ . '/app/index.html') ? 'yes' : 'no',
        'core/resources/views exists' => is_dir(__DIR__ . '/core/resources/views') ? 'yes' : 'no',
        'storage directory exists' => is_dir(__DIR__ . '/core/storage/app/public') ? 'yes' : 'no',
        'core/resources/views/backend exists' => is_dir(__DIR__ . '/core/resources/views/backend') ? 'yes' : 'no',
        'core/resources/views/auth exists' => is_dir(__DIR__ . '/core/resources/views/auth') ? 'yes' : 'no',
    ];

    foreach ($checks as $label => $value) {
        echo h($label . ': ' . $value . "\n");
    }

    // Show APP_KEY status
    $envContent = @file_get_contents(__DIR__ . '/core/.env');
    if ($envContent) {
        preg_match('/^APP_KEY=(.*)$/m', $envContent, $m);
        $appKey = trim($m[1] ?? '');
        echo h('APP_KEY set: ' . ($appKey !== '' ? 'yes (' . strlen($appKey) . ' chars)' : 'NO - THIS IS THE PROBLEM') . "\n");
        preg_match('/^APP_URL=(.*)$/m', $envContent, $m);
        echo h('APP_URL: ' . trim($m[1] ?? '(not set)') . "\n");
        preg_match('/^APP_ENV=(.*)$/m', $envContent, $m);
        echo h('APP_ENV: ' . trim($m[1] ?? '(not set)') . "\n");
    }

    echo "\n--- Laravel Log (last 80 lines) ---\n";
    $logFile = __DIR__ . '/core/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        $lines = file($logFile, FILE_IGNORE_NEW_LINES);
        $tail = array_slice($lines, -80);
        echo h(implode("\n", $tail));
    } else {
        echo h("No log file found at $logFile\n");
    }

    echo '</pre><p class="ok">Debug snapshot complete.</p>';
    renderPageEnd();
    exit;
}

if ($action === 'test_route') {
    echo '<h2>Test Laravel Route</h2><pre>';
    try {
        $result = runArtisan('route:list', ['--path' => 'admin', '--columns' => 'method,uri,name']);
        echo h("Admin routes:\n" . $result['output']);
    } catch (Throwable $e) {
        echo h("Route list error: " . $e->getMessage());
    }
    echo '</pre>';
    renderPageEnd();
    exit;
}

if ($action === 'test_boot') {
    echo '<h2>Test Laravel HTTP Boot</h2><pre>';
    try {
        echo h("Step 1: Checking index.php exists...\n");
        $indexPath = __DIR__ . '/index.php';
        echo h("  index.php exists: " . (file_exists($indexPath) ? 'yes' : 'NO') . "\n");

        echo h("\nStep 2: Checking autoload...\n");
        $autoloadPath = __DIR__ . '/core/vendor/autoload.php';
        echo h("  autoload.php exists: " . (file_exists($autoloadPath) ? 'yes' : 'NO') . "\n");

        echo h("\nStep 3: Checking bootstrap/app.php...\n");
        $bootstrapPath = __DIR__ . '/core/bootstrap/app.php';
        echo h("  bootstrap/app.php exists: " . (file_exists($bootstrapPath) ? 'yes' : 'NO') . "\n");

        echo h("\nStep 4: Loading autoloader...\n");
        require_once $autoloadPath;
        echo h("  Autoloader loaded OK\n");

        echo h("\nStep 5: Loading application...\n");
        $app = require_once $bootstrapPath;
        echo h("  Application loaded OK\n");
        echo h("  Base path: " . $app->basePath() . "\n");
        echo h("  Public path: " . $app->publicPath() . "\n");
        echo h("  Storage path: " . $app->storagePath() . "\n");
        echo h("  Config path: " . $app->configPath() . "\n");

        echo h("\nStep 6: Getting HTTP kernel...\n");
        $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
        echo h("  HTTP kernel created OK\n");

        echo h("\nStep 7: Creating test request for /admin/login...\n");
        $request = Illuminate\Http\Request::create('/admin/login', 'GET');
        echo h("  Request created OK\n");

        echo h("\nStep 8: Handling request (this is where the 500 happens)...\n");
        $response = $kernel->handle($request);
        echo h("  Response status: " . $response->getStatusCode() . "\n");

        if ($response->getStatusCode() >= 400) {
            echo h("\n--- Response Body (first 2000 chars) ---\n");
            echo h(substr($response->getContent(), 0, 2000));
        }

        $kernel->terminate($request, $response);
        echo h("\n  Request handled OK\n");
    } catch (Throwable $e) {
        echo h("\nERROR: " . $e->getMessage() . "\n");
        echo h("File: " . $e->getFile() . ":" . $e->getLine() . "\n");
        echo h("\nStack trace:\n" . $e->getTraceAsString() . "\n");
    }
    echo '</pre>';
    renderPageEnd();
    exit;
}

echo '<p class="fail">Unknown action.</p>';
renderPageEnd();
