# Hostinger Shared Hosting Guide

## Expected server layout

```text
/home/<user>/
  public_html/
    app/                          # React build output
    core/                         # Laravel project root
    .htaccess                     # Hostinger routing rules
    index.php                     # Laravel front controller
    install.php                   # Optional setup helper
  logs/
    scheduler.log
    queue.log
```

## Build the upload package locally

From the repository root, the simplest Windows entrypoint is:

```bat
build_hostinger.bat
```

This build includes `core/vendor/` by default when local Composer dependencies are already present, which is the safest option for Hostinger setups where `exec()` is disabled.

This creates a timestamped deployment folder at the repository root:

```text
hostinger_deploy_YYYYMMDD_HHMMSS/
  app/
  core/
  .htaccess
  index.php
  install.php
  README.md
```

You can also call the PowerShell packager directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\hostinger\build-shared-package.ps1
```

The packaged root `index.php` is a Hostinger-ready front controller that resolves Laravel from:

```text
./core
```

## Upload order

1. Upload the contents of `hostinger_deploy_YYYYMMDD_HHMMSS/` into your Hostinger `public_html/`.
2. In `public_html/core`, review the generated `.env`, keep the commented local values only as reference, and replace the production placeholders:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL=https://dhanvanthirifoods.in`
   - `DB_*` and mail settings
   - Configure Razorpay and PhonePe inside the backend Admin > Payment Methods screen, not in `.env`.
3. If `core/vendor/` is missing because you built with `-SkipVendor`, run Laravel dependency installation on the server:

```bash
cd /home/<user>/public_html/core
composer install --no-dev --optimize-autoloader
```

4. Run Laravel setup commands on the server:

```bash
cd /home/<user>/public_html/core
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
```

5. Or use the packaged installer after `.env` is ready:

```text
https://your-domain.example/install.php?key=dhanvanthiri2026
```

If admin login fails on an existing database, use the installer action `Seed / Reset Admin Users` or run:

```bash
cd /home/<user>/public_html/core
php artisan db:seed --class=Database\\Seeders\\AdminAccessSeeder --force
```

If a deployed database reports `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'status' in 'WHERE'`, the production schema is behind the local schema. First run:

```bash
cd /home/<user>/public_html/core
php artisan migrate --force
```

If Hostinger shell access is unavailable, import `deploy/hostinger/schema_status_repair.sql` through phpMyAdmin, then clear Laravel cache from the installer.

Important: do not fix production schema drift by editing an old migration that already ran on Hostinger. Laravel records migration filenames in the `migrations` table, so changed content inside the same filename is not executed again. Always add a new migration file with a new timestamp/name for every production schema repair.

## Fresh-install admin accounts

The Hostinger package does not store admin usernames in `core/.env` because these accounts come from Laravel database seeders, not environment variables.

After running the seed step on a fresh database, the default accounts are:

- `IT User` (`super_admin`): `it@dhanvanthiri.local` / `password123`
- `Admin User` (`admin`): `admin@dhanvanthiri.local` / `password123`

Change these passwords immediately after first login.

## Cron entries

```cron
* * * * * flock -n /tmp/laravel_schedule.lock sh -c 'cd /home/<user>/public_html/core && /usr/bin/php artisan schedule:run >> /home/<user>/logs/scheduler.log 2>&1'
* * * * * flock -n /tmp/laravel_queue.lock sh -c 'cd /home/<user>/public_html/core && /usr/bin/php artisan queue:work database --stop-when-empty --queue=high,notifications,default --tries=3 --backoff=5 --max-time=50 --memory=128 >> /home/<user>/logs/queue.log 2>&1'
```

## Notes

- The package root `.htaccess` serves frontend files from `app/`, API requests through `index.php`, and blocks direct access to `core/`.
- Laravel admin assets are served from `core/public` through root rewrite rules. If the admin panel appears as plain HTML links, upload the latest root `.htaccess` and confirm `core/public/assets/css/vendors.css` exists.
- The generated package root includes a `README.md` so the uploaded folder stays self-documenting after it is zipped or moved.
- `/storage/*` requests are rewritten to `core/storage/app/public/*`, so no public symlink is required in this package layout.
- The generated `core/.env` includes a commented local reference block plus production-ready defaults modeled after the WaferKings Hostinger package.
- The build clears packaged runtime logs and framework cache files before writing the deployment folder.
- `view:cache` is optional and skipped for this backend because no Blade view directory is packaged.
