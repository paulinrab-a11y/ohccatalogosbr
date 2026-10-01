import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90000,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium-auth-real', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
