import { defineConfig, devices } from '@playwright/test';
// No mock backend or fixture catalog is started by this configuration.
// Start the real services first. UAT_BASE_URL may point to approved staging.
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.UAT_BASE_URL || 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
});
