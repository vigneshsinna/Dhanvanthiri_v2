import { defineConfig, devices } from '@playwright/test';

const storefrontUrl = process.env.STOREFRONT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const laravelUrl = process.env.LARAVEL_APP_URL || process.env.APP_URL || 'http://127.0.0.1:8000';
const shouldStartStorefront = process.env.E2E_START_STOREFRONT !== 'false';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: storefrontUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      Accept: 'application/json',
      'System-Key': process.env.E2E_SYSTEM_KEY || process.env.VITE_SYSTEM_KEY || '0d279f87add587c1c6d046cd59ee012d',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  metadata: {
    laravelUrl,
    storefrontUrl,
    adminBaseUrl: process.env.ADMIN_BASE_URL || `${laravelUrl}/admin`,
    apiBaseUrl: process.env.API_BASE_URL || `${laravelUrl}/api`,
  },
  webServer: shouldStartStorefront ? {
    command: 'npm run dev',
    url: storefrontUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  } : undefined,
});
