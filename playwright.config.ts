import { defineConfig, devices } from '@playwright/test';
import { scryptSync } from 'node:crypto';

const testPassword = process.env.E2E_ADMIN_PASSWORD || 'Portfolio-test-only-2026!';
const testSalt = '11223344556677889900aabbccddeeff';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: 'development',
      STORAGE_DRIVER: 'local',
      LOCAL_DATA_DIR: '.data/e2e',
      ADMIN_PASSWORD_HASH: `scrypt:${testSalt}:${scryptSync(testPassword, testSalt, 64).toString('hex')}`,
      SESSION_SECRET: 'isolated-e2e-only-not-a-production-session-secret',
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
    },
  },
});
