import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type ProductSummary = {
  name: string;
  priceText: string;
  priceValue: number;
};

export class GajabProductListPage extends BasePage {
  private readonly selectors = {
    pageHeading: 'h1, h2, h3',
    productCards: 'a[href*="/product-detail/"]',
    filterButton: 'button:has-text("Filter")',
    myBargainsHeading: 'h2:has-text("My Bargains")',
    toysAndGamesHeading: 'h3:has-text("Toys & Games")',
  };

  constructor(page: Page) {
    super(page);
  }

  async waitForJustBargainedPage(): Promise<void> {
    await expect(this.page).toHaveURL(/widgetId=10/);
    await expect(this.page.locator('h1:has-text("Just Bargained")')).toBeVisible();
  }

  async waitForToysAndGamesPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/product-list\/toys-games\//);
    await expect(this.page.locator(this.selectors.toysAndGamesHeading)).toBeVisible();
  }

  async waitForMyBargainsPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/my-bargains/);
    await expect(this.page.locator(this.selectors.myBargainsHeading)).toBeVisible();
  }

  async getVisibleProducts(): Promise<ProductSummary[]> {
    const cards = this.page.locator(this.selectors.productCards);
    const count = await cards.count();
    const products: ProductSummary[] = [];

    for (let index = 0; index < count; index++) {
      const card = cards.nth(index);
      const text = ((await card.textContent()) || '').replace(/\s+/g, ' ').trim();
      const priceMatch = text.match(/₹\s?([\d,]+)/);

      if (!text || !priceMatch) {
        continue;
      }

      const priceValue = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      const name = text.replace(/₹[\s\S]*$/, '').trim();

      products.push({
        name,
        priceText: `₹${priceMatch[1]}`,
        priceValue,
      });
    }

    return products;
  }

  async findCheapestProduct(expectedPrice?: number): Promise<ProductSummary> {
    const products = await this.getVisibleProducts();

    if (products.length === 0) {
      throw new Error('No visible products were found on the product listing page.');
    }

    if (expectedPrice !== undefined) {
      const exactMatch = products.find((product) => product.priceValue === expectedPrice);
      if (exactMatch) {
        return exactMatch;
      }
    }

    return products.reduce((currentCheapest, candidate) => {
      return candidate.priceValue < currentCheapest.priceValue ? candidate : currentCheapest;
    });
  }

  async hasFilterButton(): Promise<boolean> {
    return this.page.locator(this.selectors.filterButton).isVisible();
  }

  async openMyBargainsDirectly(): Promise<void> {
    await this.navigate(`${process.env.BASE_URL || 'https://stg.gajab.com'}/my-bargains`);
    await this.waitForMyBargainsPage();
  }

  getFilterButton(): Locator {
    return this.page.locator(this.selectors.filterButton);
  }
}