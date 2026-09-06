import { test as base, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { logger } from './logger';

type SelfHealingFixtures = {
  basePage: BasePage;
  selfHealingPage: Page;
};

export const test = base.extend<SelfHealingFixtures>({
  selfHealingPage: async ({ page }, use) => {
    await use(page);

    const basePage = new BasePage(page);
    const healingLog = basePage.getHealingLog();
    if (healingLog.length > 0) {
      logger.info(`Self-healing summary: ${healingLog.length} locator(s) healed`);
      healingLog.forEach((entry) => {
        logger.info(`  "${entry.original}" -> "${entry.healed}" at ${entry.timestamp}`);
      });
    }
  },

  basePage: async ({ page }, use) => {
    const basePage = new BasePage(page);
    await use(basePage);
  },
});

export { expect } from '@playwright/test';
