import { Page, Locator } from '@playwright/test';
import { SelfHealer } from '../ai/self-healer';
import { logger } from '../utils/logger';
import { NetworkInterceptor, NetworkReport } from '../utils/network-interceptor';

export class BasePage {
  private selfHealer: SelfHealer;
  private networkInterceptor?: NetworkInterceptor;

  constructor(protected page: Page) {
    this.selfHealer = new SelfHealer();
  }

  enableNetworkMonitoring(): void {
    this.networkInterceptor = new NetworkInterceptor();
    this.networkInterceptor.attach(this.page);
  }

  async getNetworkReport(): Promise<NetworkReport | null> {
    if (!this.networkInterceptor) return null;
    return this.networkInterceptor.getFullReport(this.page);
  }

  logNetworkSummary(): void {
    this.networkInterceptor?.logSummary();
  }

  private async resolveLocator(locator: string): Promise<string> {
    try {
      const el = this.page.locator(locator);
      await el.waitFor({ state: 'attached', timeout: 3000 });
      return locator;
    } catch {
      logger.warn(`Locator failed: "${locator}" — attempting self-heal`);
      const healed = await this.selfHealer.heal(this.page, locator);
      if (healed) {
        logger.info(`Self-healed: "${locator}" -> "${healed}"`);
        return healed;
      }
      return locator;
    }
  }

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async click(locator: string): Promise<void> {
    const resolved = await this.resolveLocator(locator);
    await this.page.locator(resolved).click();
  }

  async fill(locator: string, text: string): Promise<void> {
    const resolved = await this.resolveLocator(locator);
    await this.page.locator(resolved).fill(text);
  }

  async getText(locator: string): Promise<string> {
    const resolved = await this.resolveLocator(locator);
    return (await this.page.locator(resolved).textContent()) || '';
  }

  async getTexts(locator: string): Promise<string[]> {
    return this.page.locator(locator).allTextContents();
  }

  async waitForElement(locator: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(locator);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async isVisible(locator: string): Promise<boolean> {
    return this.page.locator(locator).isVisible();
  }

  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getElementAttribute(locator: string, attribute: string): Promise<string | null> {
    return this.page.locator(locator).getAttribute(attribute);
  }

  async selectOption(locator: string, value: string): Promise<void> {
    const resolved = await this.resolveLocator(locator);
    await this.page.locator(resolved).selectOption(value);
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getElementCount(locator: string): Promise<number> {
    return this.page.locator(locator).count();
  }

  async scrollToElement(locator: string): Promise<void> {
    await this.page.locator(locator).scrollIntoViewIfNeeded();
  }

  async extractTableData(tableLocator: string): Promise<Record<string, string>[]> {
    const headers = await this.page.locator(`${tableLocator} thead th`).allTextContents();
    const rows = this.page.locator(`${tableLocator} tbody tr`);
    const rowCount = await rows.count();
    const data: Record<string, string>[] = [];

    for (let i = 0; i < rowCount; i++) {
      const cells = await rows.nth(i).locator('td').allTextContents();
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = cells[index]?.trim() || '';
      });
      data.push(row);
    }
    return data;
  }

  async extractAllLinks(): Promise<{ text: string; href: string }[]> {
    const links = this.page.locator('a[href]');
    const count = await links.count();
    const results: { text: string; href: string }[] = [];

    for (let i = 0; i < count; i++) {
      const text = (await links.nth(i).textContent()) || '';
      const href = (await links.nth(i).getAttribute('href')) || '';
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        results.push({ text: text.trim(), href });
      }
    }
    return results;
  }

  getHealingLog() {
    return this.selfHealer.getHealingLog();
  }
}
