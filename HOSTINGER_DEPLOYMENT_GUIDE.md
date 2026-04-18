# Hostinger Deployment Guide - Dhanvathiri v2 (Merged Structure)

## Project Structure

The project is now organized as a single merged directory with:

```
root/
├── app/                      # Laravel application source code
├── config/                   # Laravel configuration
├── database/                 # Database migrations & seeds
├── docs/                     # Project documentation & specifications (11-19)
├── frontend/                 # React 18 + Vite frontend (ready to deploy)
├── public/                   # Laravel static files & next-build output
├── resources/                # Laravel blade templates & CSS
├── routes/                   # Laravel API routes
├── vendor/                   # PHP dependencies (composer packages)
├── .env                      # Environment variables (configure for production)
├── artisan                   # Laravel CLI
├── composer.json             # PHP dependencies manifest
├── package.json              # Node dependencies (in frontend/)
├── index.php                 # Laravel entry point
└── HOSTINGER_DEPLOYMENT_GUIDE.md
```

## Deployment Steps

### 1. Backend Setup (Laravel)

On Hostinger, create two accounts/directories:
- **Main Domain (public_html/)**: Points to `root/public/` where Laravel serves requests
- **Private Directory**: Store Laravel application files outside public root

**Process:**
```
- Upload root/* to private directory (e.g., /dhanvathiri_v2/)
- Configure web root at `/dhanvathiri_v2/public`
- Create symbolic link or set index.php entry point
```

### 2. Frontend Setup (React + Vite)

Since we're using Vite (dev server proxy pattern), two deployment options:

**Option A: Dev Server Mode** (Recommended for ease, requires Node.js on Hostinger)
```bash
cd frontend
npm install
npm run dev  # Vite dev server on localhost:5174
```
Vite automatically proxies `/api/v2` to Laravel backend on same server port 8000.

**Option B: Static Build** (Better performance)
```bash
cd frontend
npm run build  # Creates frontend/dist/
```
Upload `dist/` contents to `public/` or separate domain.

### 3. Environment Configuration

**Backend (.env)**
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_HOST=localhost
DB_DATABASE=animazon
DB_USERNAME=animazon_user
DB_PASSWORD=[secure_password]

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=yourdomain.com

# Required System Authentication Key
SYSTEM_KEY=0d279f87add587c1c6d046cd59ee012d
```

`FRONTEND_URL` is the public storefront origin opened by the backend "Browse Website" button. It should point to the live React storefront, not Laravel `route('home')`.

**Frontend (frontend/vite.config.ts)**
- Already configured with proxy: `/api/v2` → `http://127.0.0.1:8000`
- No changes needed if backend on same server

### 4. Database Initialization

```bash
# From root on server:
php artisan migrate --seed
php artisan db:seed --class=AdminSeeder

# Creates admin user:
# Email: admin@animazon.local
# Password: Admin@123
```

## Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@animazon.local` |
| **Password** | `Admin@123` |

⚠️ **IMPORTANT**: Change password immediately after first login in production.

## System Authentication

All V2 API endpoints require the System-Key header:
```
System-Key: 0d279f87add587c1c6d046cd59ee012d
```

This is configured in:
- Backend: `app/Http/Middleware/SystemKeyMiddleware.php`
- Frontend: `frontend/src/lib/headless/client.ts` (automatic injection)

## Testing Deployment

1. **Backend Health Check**
   ```
   GET https://yourdomain.com/api/v2/system/health
   ```
   Returns 200 if backend running

2. **Frontend Access**
   ```
   GET https://yourdomain.com/
   ```
   Should load React storefront

3. **API Call Test**
   ```
   GET https://yourdomain.com/api/v2/products
   Header: System-Key: 0d279f87add587c1c6d046cd59ee012d
   ```
   Should return product list

## Hostinger-Specific Notes

## Storefront Activation / Public Cutover

Recommended production shape:

```text
https://yourdomain.com/          -> React storefront
https://yourdomain.com/api/*     -> Laravel API
https://yourdomain.com/admin/*   -> Laravel admin
https://yourdomain.com/storage/* -> Laravel public assets
```

Routing rules required after cutover:

- `/api/*` must continue to hit Laravel
- `/admin/*` must continue to hit Laravel
- static React assets must be served directly
- every other customer-facing path must fall back to the React `index.html`

Examples of storefront routes that should resolve to React with SPA fallback:

- `/`
- `/category/...`
- `/product/...`
- `/cart`
- `/checkout`
- `/account/...`

Do not keep the Blade storefront as the primary homepage after React cutover. It can remain temporarily for rollback, but the live public entry should be the React build.

- **File Permissions**: Ensure `storage/` and `bootstrap/cache/` are writable (755)
- **PHP Version**: Requires PHP 8.1+ (tested on 8.4.10)
- **MySQL**: Uses MariaDB 10.4.32 or MySQL 8.0+
- **Extensions Required**: 
  - `php-curl`, `php-json`, `php-mbstring`, `php-bcmath`, `php-openssl`
  - Check with: `php artisan tinker` → `phpinfo()`

## Cleanup Notes

- ✅ Removed `.git` connection (fresh deploy, no git history)
- ✅ Deleted redundant `/old` and `/storefront` directories
- ✅ Cleaned old junk files (~300MB freed)
- ✅ Documentation moved to `/docs/`
- ✅ TypeScript compilation: 0 errors verified

## Feature Status

| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Login/Register/Password Reset working |
| Catalog | ✅ Complete | Products, Categories, Filters working |
| Cart | ✅ Complete | Add/Remove/Update/Checkout flow |
| Wishlist | ✅ Complete | Add/Remove wishlist items |
| Checkout | ✅ 95% | Address CRUD, Payment init, Confirmation |
| Orders | ✅ 85% | Order history, returns (partial) |
| CMS | ⚠️ 65% | Blog, FAQs, Menus (limited V2 support) |

## File Locations (For Reference)

- **Adapter Layer**: `frontend/src/lib/headless/`
  - `client.ts` - HTTP client with auth headers
  - `authAdapter.ts` - Login/Register/Profile
  - `catalogAdapter.ts` - Products/Categories
  - `cartAdapter.ts` - Cart operations
  - `checkoutAdapter.ts` - Address/Payment
  - `accountAdapter.ts` - Orders/Wishlist/Returns
  - `cmsAdapter.ts` - Blog/Policies

- **API Routes**: `routes/api.php` (V2 prefix)
- **Middleware**: `app/Http/Middleware/SystemKeyMiddleware.php`
- **Admin Seeder**: `database/seeders/AdminSeeder.php`

## Next Steps

1. Configure `.env` for production server
2. Upload files to Hostinger
3. Run database migrations
4. Set up SSL certificate (Hostinger auto-provisioning)
5. Configure domain DNS
6. Test endpoints via Postman (collection available)
7. Deploy frontend via Vite or static build

---

**Project Completion Date**: April 13, 2026  
**Status**: Ready for Hostinger deployment  
**Contact**: Check IMPLEMENTATION_COMPLETE.md for detailed notes
