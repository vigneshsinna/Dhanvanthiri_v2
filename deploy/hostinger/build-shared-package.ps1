param(
    [string]$OutputDir,
    [switch]$SkipFrontendBuild,
    [switch]$IncludeVendor,
    [switch]$SkipVendor
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$frontendDir = Join-Path $repoRoot 'frontend'
$backendDir = $repoRoot
$installKey = 'dhanvanthiri2026'

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $OutputDir = Join-Path $repoRoot "hostinger_deploy_$timestamp"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
    $OutputDir = Join-Path $repoRoot $OutputDir
}

$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)

$appDir = Join-Path $OutputDir 'app'
$coreDir = Join-Path $OutputDir 'core'
$packageReadmePath = Join-Path $OutputDir 'README.md'

function New-CleanDirectory {
    param([string]$Path)

    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Path | Out-Null
}

function Copy-BackendItem {
    param(
        [string]$SourceName,
        [string]$TargetRoot
    )

    $sourcePath = Join-Path $backendDir $SourceName
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination (Join-Path $TargetRoot $SourceName) -Recurse -Force
    }
}

function New-AppKey {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return 'base64:' + [Convert]::ToBase64String($bytes)
}

function New-HexSecret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

function Write-ProductionEnv {
    param([string]$Path)

    $localEnvSource = Join-Path $backendDir '.env'
    if (-not (Test-Path $localEnvSource)) {
        $localEnvSource = Join-Path $backendDir '.env.example'
    }

    $commentedLocalLines = @()
    if (Test-Path $localEnvSource) {
        $commentedLocalLines = Get-Content -Path $localEnvSource | ForEach-Object {
            if ([string]::IsNullOrWhiteSpace($_)) {
                ''
            } elseif ($_ -match '^(RAZOR|RAZORPAY|PHONEPE)_') {
                '# ' + ($_ -replace '=.*$', '=REDACTED_ADMIN_MANAGED')
            } else {
                '# ' + $_
            }
        }
    }

    $appKey = New-AppKey
    $jwtSecret = New-HexSecret

    $productionLines = @(
        'APP_NAME="Dhanvanthiri Foods"',
        'APP_ENV=production',
        "APP_KEY=$appKey",
        'APP_DEBUG=false',
        'APP_TIMEZONE=Asia/Kolkata',
        'APP_URL=https://puregrains.animazon.in',
        'LARAVEL_APP_URL=https://puregrains.animazon.in',
        'ASSET_URL=https://puregrains.animazon.in',
        'HOSTINGER_SHARED_MODE=true',
        'DEBUGBAR_ENABLED=false',
        '',
        'LOG_CHANNEL=single',
        'LOG_LEVEL=error',
        '',
        'DB_CONNECTION=mysql',
        'DB_HOST=localhost',
        'DB_PORT=3306',
        'DB_DATABASE=REPLACE_WITH_DATABASE_NAME',
        'DB_USERNAME=REPLACE_WITH_DATABASE_USER',
        'DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD',
        '',
        'BROADCAST_CONNECTION=log',
        'CACHE_STORE=file',
        'FILESYSTEM_DISK=public',
        'QUEUE_CONNECTION=database',
        'SESSION_DRIVER=file',
        'SESSION_LIFETIME=120',
        '',
        "JWT_SECRET=$jwtSecret",
        'JWT_TTL=60',
        'JWT_REFRESH_TTL=20160',
        'JWT_ALGO=HS256',
        '',
        'PAYMENT_DEFAULT_GATEWAY=razorpay',
        '',
        '# Payment gateway credentials are managed in the backend Admin > Payment Methods screen.',
        '# Do not put Razorpay or PhonePe secrets in this .env unless you intentionally need legacy fallback.',
        '',
        'MAIL_MAILER=smtp',
        'MAIL_HOST=smtp.hostinger.com',
        'MAIL_PORT=465',
        'MAIL_USERNAME=REPLACE_WITH_SMTP_USERNAME',
        'MAIL_PASSWORD=REPLACE_WITH_SMTP_PASSWORD',
        'MAIL_ENCRYPTION=ssl',
        'MAIL_FROM_ADDRESS="support@dhanvanthirifoods.com"',
        'MAIL_FROM_NAME="Dhanvanthiri Foods"'
    )

    $content = @(
        '# Local development reference values',
        '# These are copied from the current backend env and commented out on purpose.',
        ''
    ) + $commentedLocalLines + @(
        '',
        '# Fresh-install seeded admin accounts (reference only)',
        '# These users are created by `php artisan db:seed --force`.',
        '# They are not read from env at runtime.',
        '# IT_USER_EMAIL=it@dhanvanthiri.local',
        '# IT_USER_PASSWORD=password123',
        '# ADMIN_USER_EMAIL=admin@dhanvanthiri.local',
        '# ADMIN_USER_PASSWORD=password123',
        '',
        '# Production values for the Hostinger package',
        '# Replace placeholder values before going live.',
        ''
    ) + $productionLines

    [System.IO.File]::WriteAllText($Path, ($content -join [Environment]::NewLine), [System.Text.Encoding]::UTF8)
}

function Reset-PackagedStorage {
    param([string]$CorePath)

    $storageRoot = Join-Path $CorePath 'storage'
    $logDir = Join-Path $storageRoot 'logs'
    $frameworkDir = Join-Path $storageRoot 'framework'

    if (Test-Path $logDir) {
        Get-ChildItem -Path $logDir -File -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    $frameworkSubDirs = @(
        (Join-Path $frameworkDir 'cache'),
        (Join-Path $frameworkDir 'cache\data'),
        (Join-Path $frameworkDir 'sessions'),
        (Join-Path $frameworkDir 'views'),
        (Join-Path $frameworkDir 'testing')
    )

    foreach ($dir in $frameworkSubDirs) {
        if (Test-Path $dir) {
            Get-ChildItem -Path $dir -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bootstrapCacheDir = Join-Path $CorePath 'bootstrap\cache'
    if (Test-Path $bootstrapCacheDir) {
        Get-ChildItem -Path $bootstrapCacheDir -File -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $bootstrapCacheDir -Force | Out-Null
    }
}

function Write-PackageReadme {
    param(
        [string]$Path,
        [string]$SecretKey
    )

    $content = @'
# Dhanvanthiri Hostinger Deployment Package

## Generated Output

Upload the contents of this folder directly into your Hostinger site root so it looks like:

```text
app/        -> React build output
core/       -> Laravel application
.htaccess   -> Hostinger routing rules
index.php   -> Laravel front controller
install.php -> Optional setup helper
schema_status_repair.sql -> Optional phpMyAdmin repair for legacy databases
```

## Upload Order

1. Upload or extract this folder's contents into `public_html/`
2. Review `core/.env`, replace database/mail placeholders, and keep payment gateway credentials in Admin > Payment Methods
3. If this package was built without `core/vendor/`, run `composer install --no-dev --optimize-autoloader`
4. Open `https://your-domain.example/install.php?key=INSTALL_KEY`
5. In the installer, run Migrate Database
6. Run Repair Production Admin, Repair Payment Methods, and Repair Product Catalog Columns
7. Run Seed Storefront Content Only to copy header/footer/settings, About, FAQ, Contact, policies, blogs, and blog images into admin-managed records
8. Run Enrich Products Only to copy product details, SKU/stock data, product images, categories, product badges/chips, descriptions, reviews/stars metadata, and detail-page content into admin-managed records
9. In Admin > Payment Methods, enable/configure Razorpay and PhonePe credentials, then run Production Check and Optimize/Clear Cache
10. If admin login fails on an existing database, run Seed / Reset Admin Users
11. Avoid the broad Seed Database action on an existing live catalog unless you intentionally want to rebuild the baseline product catalog
12. If the error is `Unknown column 'status'` or `Unknown column 'active'`, run Repair Production Admin or Repair Payment Methods; if shell access is unavailable, import `schema_status_repair.sql` in phpMyAdmin
13. Delete `install.php` after setup is complete

## Manual Laravel Commands

```bash
cd /home/<user>/public_html/core
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --class=Database\\Seeders\\LegacyStorefrontContentSeeder --force
php artisan db:seed --class=Database\\Seeders\\DhanvathiriProductsSeeder --force
php artisan config:cache
php artisan view:cache
```

## Notes

- Frontend assets are served from `app/`
- API requests are routed through the root `index.php`
- Direct access to `core/` internals is blocked by `.htaccess`
- Laravel admin assets are served from `core/public` through root rewrite rules. If admin appears as plain HTML links, upload the latest root `.htaccess` and confirm `core/public/assets/css/vendors.css` exists.
- `/storage/*` requests are rewritten to `core/storage/app/public/*`, so no symlink is required
- `view:cache` is intentionally skipped for this package when `core/resources/views` is absent
- `route:cache` is intentionally skipped because this legacy route set has duplicate route names; Laravel works normally without route cache.
- Never edit an old migration file to fix production. Laravel only checks migration filenames in the `migrations` table, so production needs a new migration filename for each schema repair.

## Fresh-install admin accounts

- `IT User` (`super_admin`): `it@dhanvanthiri.local` / `password123`
- `Admin User` (`admin`): `admin@dhanvanthiri.local` / `password123`

These users come from database seeders, not from `core/.env`.

If login fails on an existing database, run:

```bash
php artisan db:seed --class=Database\\Seeders\\AdminAccessSeeder --force
```
'@

    $content = $content.Replace('INSTALL_KEY', $SecretKey)
    [System.IO.File]::WriteAllText($Path, $content, [System.Text.Encoding]::UTF8)
}

if (-not $SkipFrontendBuild) {
    Push-Location $frontendDir
    try {
        Write-Host '[1/5] Building frontend for Hostinger package...'
        $process = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "build" -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -ne 0) {
            throw "Frontend build failed with exit code $($process.ExitCode)."
        }
    }
    finally {
        Pop-Location
    }
}

$frontendDistDir = Join-Path $frontendDir 'dist'
if (-not (Test-Path $frontendDistDir)) {
    throw 'Frontend dist folder was not found. Run the frontend build first or omit -SkipFrontendBuild.'
}

Write-Host '[2/5] Creating deployment folder...'
New-CleanDirectory -Path $OutputDir
New-CleanDirectory -Path $appDir
New-CleanDirectory -Path $coreDir

Write-Host '[3/5] Copying frontend build into app/...'
Copy-Item -Path (Join-Path $frontendDistDir '*') -Destination $appDir -Recurse -Force

Write-Host '[4/5] Copying Laravel backend into core/...'
$backendItems = @(
    'app',
    'artisan',
    'bootstrap',
    'composer.json',
    'composer.lock',
    'config',
    'database',
    'products.json',
    'public',
    'resources',
    'routes',
    'storage',
    '.env.example'
)

foreach ($item in $backendItems) {
    Copy-BackendItem -SourceName $item -TargetRoot $coreDir
}

$shouldIncludeVendor = -not $SkipVendor -and (Test-Path (Join-Path $backendDir 'vendor'))
if ($shouldIncludeVendor) {
    Write-Host '     Zipping backend vendor directory for reliable Hostinger upload...'
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $vendorSource = Join-Path $backendDir 'vendor'
    $vendorZip = Join-Path $coreDir 'vendor.zip'
    [System.IO.Compression.ZipFile]::CreateFromDirectory($vendorSource, $vendorZip)
}

Write-Host '     Resetting packaged storage/log/cache directories...'
Reset-PackagedStorage -CorePath $coreDir

Write-Host '     Writing production-ready core/.env...'
Write-ProductionEnv -Path (Join-Path $coreDir '.env')

Copy-Item -Path (Join-Path $PSScriptRoot 'root.htaccess') -Destination (Join-Path $OutputDir '.htaccess') -Force
Copy-Item -Path (Join-Path $PSScriptRoot 'root.index.php') -Destination (Join-Path $OutputDir 'index.php') -Force
Copy-Item -Path (Join-Path $PSScriptRoot 'install.php') -Destination (Join-Path $OutputDir 'install.php') -Force
Copy-Item -Path (Join-Path $PSScriptRoot 'schema_status_repair.sql') -Destination (Join-Path $OutputDir 'schema_status_repair.sql') -Force

Write-Host '[5/5] Writing deployment README...'
Write-PackageReadme -Path $packageReadmePath -SecretKey $installKey

Write-Host ''
Write-Host 'Hostinger package created successfully:'
Write-Host "  $OutputDir"
Write-Host ''
Write-Host 'Package layout:'
Write-Host '  app/'
Write-Host '  core/'
Write-Host '  .htaccess'
Write-Host '  index.php'
Write-Host '  install.php'
Write-Host '  schema_status_repair.sql'
Write-Host '  README.md'
Write-Host ''
Write-Host 'Next steps:'
Write-Host '  1. Zip the generated folder'
Write-Host '  2. Upload it to Hostinger public_html'
Write-Host '  3. Review and update core/.env placeholders'
if ($shouldIncludeVendor) {
    Write-Host "  4. Open install.php?key=$installKey"
Write-Host '  5. Run Migrate Database, repairs, Seed Storefront Content Only, Enrich Products Only, and Optimize in the installer'
} else {
    Write-Host '  4. Install Composer dependencies in core/ using SSH or terminal access'
    Write-Host "  5. Open install.php?key=$installKey"
    Write-Host '  6. Run Migrate Database, repairs, Seed Storefront Content Only, Enrich Products Only, and Optimize in the installer'
}
