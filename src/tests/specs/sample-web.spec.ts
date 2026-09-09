import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';
import { DataScraper } from '../../utils/data-scraper';

test.describe('Web Application Tests @ui', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.navigate(process.env.BASE_URL || '/');
  });

  test('should load homepage successfully', async ({ page }) => {
    const title = await basePage.getPageTitle();
    expect(title).toBeTruthy();
    await expect(page).toHaveURL(/.*\//);
  });

  test('should display navigation menu', async () => {
    const navVisible = await basePage.isVisible('nav');
    expect(navVisible).toBeTruthy();
  });

  test('should extract and validate table data', async ({ page }) => {
    const scraper = new DataScraper(page);
    const tableData = await scraper.scrapeTable('table');
    expect(tableData.length).toBeGreaterThan(0);
    console.log(`Scraped ${tableData.length} rows from table`);
  });

  test('should extract all links from page', async ({ page }) => {
    const scraper = new DataScraper(page);
    const links = await scraper.scrapeLinks();
    expect(links.length).toBeGreaterThan(0);
    console.log(`Found ${links.length} links on page`);
  });

  test('should submit form and verify response', async () => {
    await basePage.fill('input[name="name"]', 'Test User');
    await basePage.fill('input[name="email"]', 'test@example.com');
    await basePage.click('button[type="submit"]');
    await basePage.waitForNavigation();
    const successMessage = await basePage.getText('.success-message');
    expect(successMessage).toBeTruthy();
  });
});
