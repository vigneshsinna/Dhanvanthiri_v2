export const e2eConfig = {
  storefrontUrl: trimTrailingSlash(process.env.STOREFRONT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'),
  laravelUrl: trimTrailingSlash(process.env.LARAVEL_APP_URL || process.env.APP_URL || 'http://127.0.0.1:8000'),
  adminBaseUrl: trimTrailingSlash(process.env.ADMIN_BASE_URL || `${process.env.LARAVEL_APP_URL || process.env.APP_URL || 'http://127.0.0.1:8000'}/admin`),
  apiBaseUrl: trimTrailingSlash(process.env.API_BASE_URL || `${process.env.LARAVEL_APP_URL || process.env.APP_URL || 'http://127.0.0.1:8000'}/api`),
  adminEmail: process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@animazon.local',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123',
  customerEmail: process.env.E2E_CUSTOMER_EMAIL || process.env.CUSTOMER_EMAIL || '',
  customerPassword: process.env.E2E_CUSTOMER_PASSWORD || process.env.CUSTOMER_PASSWORD || '',
  systemKey: process.env.E2E_SYSTEM_KEY || process.env.VITE_SYSTEM_KEY || '0d279f87add587c1c6d046cd59ee012d',
  allowMutations: ['1', 'true', 'yes'].includes(String(process.env.E2E_ALLOW_MUTATION || '').toLowerCase()),
  dbIsDisposable: ['1', 'true', 'yes'].includes(String(process.env.E2E_DB_IS_DISPOSABLE || '').toLowerCase()),
};

export function canMutateAdminData() {
  return e2eConfig.allowMutations && e2eConfig.dbIsDisposable;
}

export function adminPath(path = '') {
  const cleanPath = path.replace(/^\/?admin\/?/, '').replace(/^\//, '');
  return cleanPath ? `${e2eConfig.adminBaseUrl}/${cleanPath}` : e2eConfig.adminBaseUrl;
}

export function storefrontPath(path = '') {
  return `${e2eConfig.storefrontUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiPath(path = '') {
  return `${e2eConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function hasCustomerCredentials() {
  return Boolean(e2eConfig.customerEmail && e2eConfig.customerPassword);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}
