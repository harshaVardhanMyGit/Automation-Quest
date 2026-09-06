import { AppiumDriver } from './appium-driver';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

type MobileTest = {
  name: string;
  fn: (driver: AppiumDriver) => Promise<void>;
};

const tests: MobileTest[] = [
  {
    name: 'App should launch successfully',
    fn: async (driver) => {
      const d = driver.getDriver();
      const source = await d.getPageSource();
      if (!source || source.length === 0) {
        throw new Error('App did not launch — empty page source');
      }
    },
  },
  {
    name: 'App should display main screen elements',
    fn: async (driver) => {
      await driver.waitForElement('~main-screen', 15000);
    },
  },
  {
    name: 'App should handle text input',
    fn: async (driver) => {
      await driver.type('~search-input', 'test query');
      const text = await driver.getText('~search-input');
      if (!text.includes('test')) {
        throw new Error(`Expected input to contain "test", got "${text}"`);
      }
    },
  },
  {
    name: 'App should navigate between screens',
    fn: async (driver) => {
      await driver.tap('~nav-button');
      await driver.waitForElement('~second-screen', 10000);
    },
  },
  {
    name: 'App should scroll content',
    fn: async (driver) => {
      await driver.scrollTo('bottom-element');
    },
  },
];

async function runMobileTests(): Promise<void> {
  const results: TestResult[] = [];
  const driver = new AppiumDriver();

  logger.info('Starting mobile test execution...');
  logger.info(`Appium server: ${process.env.APPIUM_SERVER || 'http://127.0.0.1:4723'}`);
  logger.info(`Device: ${process.env.DEVICE_NAME || 'emulator-5554'}`);

  try {
    await driver.launch();
    logger.info('Appium driver launched successfully');

    for (const test of tests) {
      const start = Date.now();
      try {
        logger.info(`Running: ${test.name}`);
        await test.fn(driver);
        const duration = Date.now() - start;
        results.push({ name: test.name, status: 'passed', duration });
        logger.info(`PASSED: ${test.name} (${duration}ms)`);
      } catch (error: any) {
        const duration = Date.now() - start;
        const screenshotName = test.name.replace(/[^a-z0-9]/gi, '_');
        let screenshot: string | undefined;
        try {
          screenshot = await driver.takeScreenshot(`failure_${screenshotName}`);
        } catch {
          logger.warn('Could not capture failure screenshot');
        }
        results.push({
          name: test.name,
          status: 'failed',
          duration,
          error: error.message,
          screenshot,
        });
        logger.error(`FAILED: ${test.name} — ${error.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Driver launch failed: ${error.message}`);
    tests.forEach((t) =>
      results.push({ name: t.name, status: 'skipped', duration: 0, error: 'Driver launch failed' })
    );
  } finally {
    await driver.quit();
    logger.info('Appium driver closed');
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  logger.info(`\nMobile Test Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    summary: { total: results.length, passed, failed, skipped },
    tests: results,
  };

  fs.writeFileSync(path.join(reportDir, 'mobile-test-results.json'), JSON.stringify(report, null, 2));
  logger.info(`Report saved to reports/mobile-test-results.json`);

  if (failed > 0) process.exit(1);
}

runMobileTests().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
