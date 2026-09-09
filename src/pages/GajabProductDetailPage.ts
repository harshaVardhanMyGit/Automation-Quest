import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type ProductOfferSnapshot = {
  productName: string;
  brandName: string;
  exclusiveOfferPrice?: string;
  savingsText?: string;
  purchaseState: 'fresh' | 'payment-pending' | 'purchased';
};

export class GajabProductDetailPage extends BasePage {
  private readonly selectors = {
    productHeading: 'h1',
    brandName: 'a[href*="/shop/"], p',
    soldByLink: 'a[href*="/shop/"]',
    exclusiveOfferPrice: 'h1:has-text("₹")',
    savingsText: 'h3:has-text("Savings by bargain")',
    retryPaymentButton: 'button:has-text("Retry Payment")',
    buyNowButton: 'button:has-text("Buy Now"), button:has-text("By Now")',
    startBargainingButton: 'button:has-text("Start Bargaining")',
    getSupportLink: 'a:has-text("Get Support")',
    boughtBanner: 'text=/You bought this on/i',
  };

  constructor(page: Page) {
    super(page);
  }

  async waitForProductPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/product-detail\//);
    // Wait for page to fully load
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.page.locator(this.selectors.productHeading)).toBeVisible({ timeout: 30000 });
  }

  async getOfferSnapshot(): Promise<ProductOfferSnapshot> {
    await this.waitForProductPage();

    const productName = ((await this.page.locator(this.selectors.productHeading).textContent()) || '').trim();
    
    // Get brand name without requiring visibility (element might be hidden but in DOM)
    const soldByLink = this.page.locator(this.selectors.soldByLink).first();
    const brandName = ((await soldByLink.textContent().catch(() => '')) || '').trim();

    const hasRetryPayment = await this.page.locator(this.selectors.retryPaymentButton).isVisible().catch(() => false);
    const hasBoughtBanner = await this.page.locator(this.selectors.boughtBanner).isVisible().catch(() => false);
    const hasStartBargaining = await this.page.locator(this.selectors.startBargainingButton).isVisible().catch(() => false);

    let purchaseState: ProductOfferSnapshot['purchaseState'] = 'fresh';
    if (hasRetryPayment) {
      purchaseState = 'payment-pending';
    } else if (hasBoughtBanner) {
      purchaseState = 'purchased';
    } else if (hasStartBargaining) {
      purchaseState = 'fresh';
    }

    const exclusiveOfferPrice = await this.page.locator(this.selectors.exclusiveOfferPrice).first().textContent().catch(() => null);
    const savingsText = await this.page.locator(this.selectors.savingsText).textContent().catch(() => null);

    return {
      productName,
      brandName,
      exclusiveOfferPrice: exclusiveOfferPrice?.trim() || undefined,
      savingsText: savingsText?.replace(/\s+/g, ' ').trim() || undefined,
      purchaseState,
    };
  }

  getRetryPaymentButton(): Locator {
    return this.page.locator(this.selectors.retryPaymentButton).first();
  }

  getStartBargainingButton(): Locator {
    return this.page.locator(this.selectors.startBargainingButton).first();
  }

  getBuyNowButton(): Locator {
    return this.page.locator(this.selectors.buyNowButton).first();
  }

  async openSupportForPlacedOrder(): Promise<void> {
    await this.page.locator(this.selectors.getSupportLink).click();
  }
}