import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  reporter: [['html', { open: 'never' }], ['json', { outputFile: 'reports/complex-results.json' }], ['list']],
  use: { baseURL: 'http://127.0.0.1:4273', trace: 'on', screenshot: 'only-on-failure' },
  webServer: { command: 'npx ts-node server.ts', url: 'http://127.0.0.1:4273', reuseExistingServer: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
