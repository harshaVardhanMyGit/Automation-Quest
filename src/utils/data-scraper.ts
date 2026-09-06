import { Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class DataScraper {
  private basePage: BasePage;

  constructor(private page: Page) {
    this.basePage = new BasePage(page);
  }

  async scrapeTable(selector: string): Promise<Record<string, string>[]> {
    return this.basePage.extractTableData(selector);
  }

  async scrapeList(selector: string): Promise<string[]> {
    return this.page.locator(selector).allTextContents();
  }

  async scrapeFormFields(formSelector: string): Promise<Record<string, string>[]> {
    const inputs = this.page.locator(`${formSelector} input, ${formSelector} select, ${formSelector} textarea`);
    const count = await inputs.count();
    const fields: Record<string, string>[] = [];

    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      const name = (await el.getAttribute('name')) || (await el.getAttribute('id')) || `field-${i}`;
      const type = (await el.getAttribute('type')) || 'text';
      const value = (await el.inputValue()) || '';
      fields.push({ name, type, value });
    }
    return fields;
  }

  async scrapeAllText(): Promise<string> {
    return this.page.locator('body').innerText();
  }

  async scrapeLinks(): Promise<{ text: string; href: string }[]> {
    return this.basePage.extractAllLinks();
  }

  async scrapeImages(): Promise<{ alt: string; src: string }[]> {
    const images = this.page.locator('img');
    const count = await images.count();
    const results: { alt: string; src: string }[] = [];

    for (let i = 0; i < count; i++) {
      const alt = (await images.nth(i).getAttribute('alt')) || '';
      const src = (await images.nth(i).getAttribute('src')) || '';
      results.push({ alt, src });
    }
    return results;
  }
}
