import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TEMPLATE: Copy this file and rename for your actual page.
 * Fill in selectors and methods once the problem statement is revealed.
 */
export class SamplePage extends BasePage {
  // --- Locators (fill during hackathon) ---
  private readonly selectors = {
    heading: 'h1',
    navigationMenu: 'nav',
    searchInput: 'input[type="search"]',
    submitButton: 'button[type="submit"]',
    articleList: '.article-list .article-item',
    articleTitle: '.article-title',
    articleLink: '.article-link',
    articleDate: '.article-date',
    productName: '.product-name',
    productPrice: '.product-price',
    productDescription: '.product-description',
    carousel: '.carousel',
    carouselItem: '.carousel-item',
    nextButton: '.next-btn',
    prevButton: '.prev-btn',
  };

  constructor(page: Page) {
    super(page);
  }

  async getHeading(): Promise<string> {
    return this.getText(this.selectors.heading);
  }

  async search(query: string): Promise<void> {
    await this.fill(this.selectors.searchInput, query);
    await this.click(this.selectors.submitButton);
    await this.waitForNavigation();
  }

  async getArticles(): Promise<{ title: string; link: string; date: string }[]> {
    const items = this.page.locator(this.selectors.articleList);
    const count = await items.count();
    const articles: { title: string; link: string; date: string }[] = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const title = (await item.locator(this.selectors.articleTitle).textContent()) || '';
      const link = (await item.locator(this.selectors.articleLink).getAttribute('href')) || '';
      const date = (await item.locator(this.selectors.articleDate).textContent()) || '';
      articles.push({ title: title.trim(), link, date: date.trim() });
    }
    return articles;
  }

  async getProducts(): Promise<{ name: string; price: string; description: string }[]> {
    const names = await this.getTexts(this.selectors.productName);
    const prices = await this.getTexts(this.selectors.productPrice);
    const descriptions = await this.getTexts(this.selectors.productDescription);

    return names.map((name, i) => ({
      name: name.trim(),
      price: prices[i]?.trim() || '',
      description: descriptions[i]?.trim() || '',
    }));
  }

  async navigateCarousel(): Promise<string[]> {
    const items: string[] = [];
    const carouselItems = this.page.locator(this.selectors.carouselItem);
    const count = await carouselItems.count();

    for (let i = 0; i < count; i++) {
      const text = (await carouselItems.nth(i).textContent()) || '';
      items.push(text.trim());
      if (i < count - 1) {
        await this.click(this.selectors.nextButton);
        await this.page.waitForTimeout(500);
      }
    }
    return items;
  }
}
