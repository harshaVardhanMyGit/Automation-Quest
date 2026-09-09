import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GajabCheckoutPage extends BasePage {
  private readonly selectors = {
    failureHeading: 'text=Payment could not be completed',
    failureSubtext: 'text=Please use another method',
    retryText: 'text=/Retry payment of\\s*₹/i',
    paymentOptions: 'text=/UPI|Cards|Show All Options/i',
  };

  constructor(page: Page) {
    super(page);
  }

  async waitForCheckoutPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout|\/my-orders/);
  }

  async expectPaymentFailureModal(): Promise<void> {
    await this.waitForCheckoutPage();
    await expect(this.page.locator(this.selectors.failureHeading)).toBeVisible({ timeout: 45000 });
    await expect(this.page.locator(this.selectors.failureSubtext)).toBeVisible();
    await expect(this.page.locator(this.selectors.retryText)).toBeVisible();
    await expect(this.page.locator(this.selectors.paymentOptions).first()).toBeVisible();
  }

  async capturePaymentFailureEvidence(evidenceName = 'payment-failure-checkpoint'): Promise<void> {
    await this.page.screenshot({
      path: `reports/screenshots/${evidenceName}.png`,
      fullPage: true,
    });
  }
}