import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: process.env.PLAYWRIGHT_TEST_DIR || './src/tests/specs',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [
    ['html', { open: 'never' }],
    ['allure-playwright'],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /(?:sample-api|api-performance)\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /(?:sample-api|api-performance)\.spec\.ts/,
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      testIgnore: /(?:sample-api|api-performance)\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: /(?:sample-api|api-performance)\.spec\.ts/,
    },
    {
      name: 'api',
      testMatch: /(?:sample-api|api-performance)\.spec\.ts/,
      use: {},
    },
  ],
});
