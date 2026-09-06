import { Given, When, Then, After, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';
import { expect } from '@playwright/test';

setDefaultTimeout(30000);

let browser: Browser;
let page: Page;
let basePage: BasePage;

Given('the user navigates to the application', async function () {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  basePage = new BasePage(page);
  await basePage.navigate(process.env.BASE_URL || 'https://example.com');
});

Then('the page title should be displayed', async function () {
  const title = await basePage.getPageTitle();
  expect(title).toBeTruthy();
});

Then('the navigation menu should be visible', async function () {
  const visible = await basePage.isVisible('nav');
  expect(visible).toBeTruthy();
});

When('the user searches for {string}', async function (query: string) {
  await basePage.fill('input[type="search"]', query);
  await basePage.click('button[type="submit"]');
  await basePage.waitForNavigation();
});

Then('search results should be displayed', async function () {
  const visible = await basePage.isVisible('.search-results');
  expect(visible).toBeTruthy();
});

Then('the results count should be greater than {int}', async function (count: number) {
  const resultCount = await basePage.getElementCount('.search-result-item');
  expect(resultCount).toBeGreaterThan(count);
});

When('the user navigates to the data page', async function () {
  await basePage.click('a[href*="data"]');
  await basePage.waitForNavigation();
});

Then('the data table should be visible', async function () {
  await basePage.waitForElement('table');
});

Then('the table should have rows', async function () {
  const rowCount = await basePage.getElementCount('table tbody tr');
  expect(rowCount).toBeGreaterThan(0);
});

When('the user fills the form with {string} and {string}', async function (name: string, email: string) {
  await basePage.fill('input[name="name"]', name);
  await basePage.fill('input[name="email"]', email);
});

When('the user submits the form', async function () {
  await basePage.click('button[type="submit"]');
});

Then('a success message should be displayed', async function () {
  await basePage.waitForElement('.success-message');
  const text = await basePage.getText('.success-message');
  expect(text).toBeTruthy();
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

AfterAll(async function () {
  if (browser) {
    await browser.close();
  }
});
