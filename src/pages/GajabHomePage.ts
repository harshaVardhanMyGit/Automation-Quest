import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type DealOfDay = {
  name: string;
  priceText: string;
};

type TrendingProduct = {
  name: string;
  priceText: string;
  bargainCount: number;
};

export class GajabHomePage extends BasePage {
  private readonly selectors = {
    profileSignInLink: '#profile-menu-signin-link, #header-login-btn',
    signInHeading: 'h1:has-text("Log in / Sign up")',
    mobileNumberInput: 'input[placeholder*="Mobile Number"], input[placeholder*="Mobile"]',
    consentCheckbox: 'input[type="checkbox"]',
    requestOtpButton: 'button:has-text("Request OTP")',
    locationButton: 'button:has-text("Location"), button:has-text("Chennai")',
    dealOfDayHeading: 'h2:has-text("Gajab Deal Of The Day")',
    justBargainedHeading: 'h2:has-text("Just Bargained")',
    justBargainedViewAllLink: 'a[href*="widgetId=10"][href*="position=WP1"]',
    trendingHeading: 'h2:has-text("Trending")',
    trendingCards: 'a[href*="/product-detail/"]:has-text("Times Bargained")',
    liveOrderCards: 'article',
    toysAndGamesLink: 'a[href*="/product-list/toys-games/"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async navigateToHome(): Promise<void> {
    await this.navigate(process.env.BASE_URL || 'https://stg.gajab.com/');
  }

  async openSignIn(): Promise<void> {
    const signInLink = this.page.locator(this.selectors.profileSignInLink).first();
    await signInLink.waitFor({ state: 'visible', timeout: 15000 });
    await signInLink.click();
    await this.waitForSignInPage();
  }

  async waitForSignInPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/signin/);
    await this.page.locator(this.selectors.signInHeading).waitFor({ state: 'visible', timeout: 15000 });
  }

  async fillMobileNumber(mobileNumber: string): Promise<void> {
    await this.fill(this.selectors.mobileNumberInput, mobileNumber);
  }

  async acceptTermsAndPrivacy(): Promise<void> {
    const checkbox = this.page.locator(this.selectors.consentCheckbox).first();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  getRequestOtpButton(): Locator {
    return this.page.locator(this.selectors.requestOtpButton);
  }

  async requestOtp(): Promise<void> {
    await this.getRequestOtpButton().click();
  }

  async expectHomepageSections(): Promise<void> {
    await this.page.locator(this.selectors.justBargainedHeading).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(this.selectors.trendingHeading).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(this.selectors.dealOfDayHeading).waitFor({ state: 'visible', timeout: 15000 });
  }

  async getDealOfTheDay(): Promise<DealOfDay> {
    const section = this.page.locator('section, div').filter({ has: this.page.locator(this.selectors.dealOfDayHeading) }).first();
    const name = ((await section.locator('a[href*="/product-detail/"]').nth(1).textContent()) || '').trim();
    const priceText = ((await section.locator('text=/Asking Price/').locator('..').textContent()) || '').replace(/\s+/g, ' ').trim();
    return { name, priceText };
  }

  async getTopTrendingProduct(): Promise<TrendingProduct> {
    const cards = this.page.locator(this.selectors.trendingCards);
    const count = await cards.count();
    let topProduct: TrendingProduct | null = null;

    for (let index = 0; index < count; index++) {
      const card = cards.nth(index);
      const text = ((await card.textContent()) || '').replace(/\s+/g, ' ').trim();
      const bargainCountMatch = text.match(/([\d,]+)\s+Times Bargained/i);
      const priceMatch = text.match(/₹\s?([\d,]+)/);

      if (!bargainCountMatch || !priceMatch) {
        continue;
      }

      const bargainCount = parseInt(bargainCountMatch[1].replace(/,/g, ''), 10);
      const product: TrendingProduct = {
        name: text.replace(/Asking Price[\s\S]*$/, '').trim(),
        priceText: `₹${priceMatch[1]}`,
        bargainCount,
      };

      if (!topProduct || product.bargainCount > topProduct.bargainCount) {
        topProduct = product;
      }
    }

    if (!topProduct) {
      throw new Error('Could not determine the top trending product.');
    }

    return topProduct;
  }

  async getLatestLiveOrder(): Promise<string> {
    const cards = this.page.locator(this.selectors.liveOrderCards);
    const count = await cards.count();

    for (let index = 0; index < count; index++) {
      const text = ((await cards.nth(index).textContent()) || '').replace(/\s+/g, ' ').trim();
      if (text.includes('paid') && text.includes('₹')) {
        return text;
      }
    }

    throw new Error('Could not find a live order card on the homepage.');
  }

  async openJustBargainedViewAll(): Promise<void> {
    await this.page.locator(this.selectors.justBargainedViewAllLink).first().click();
  }

  async openToysAndGamesCategory(): Promise<void> {
    await this.page.locator(this.selectors.toysAndGamesLink).first().click();
  }

  async openMyBargains(): Promise<void> {
    await this.navigate(`${process.env.BASE_URL || 'https://stg.gajab.com'}/my-bargains`);
  }

  getLocationButton(): Locator {
    return this.page.locator(this.selectors.locationButton).first();
  }
}