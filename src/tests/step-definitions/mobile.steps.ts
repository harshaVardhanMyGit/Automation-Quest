import { Given, When, Then, After, setDefaultTimeout } from '@cucumber/cucumber';
import { AppiumDriver } from '../../mobile/appium-driver';
import { expect } from '@playwright/test';

setDefaultTimeout(60000);

let driver: AppiumDriver;

Given('the mobile app is launched', async function () {
  driver = new AppiumDriver();
  await driver.launch();
});

Then('the main screen should be displayed', async function () {
  const displayed = await driver.isDisplayed('~main-screen');
  expect(displayed).toBeTruthy();
});

When('the user taps the navigation button', async function () {
  await driver.tap('~nav-button');
});

Then('the next screen should be displayed', async function () {
  await driver.waitForElement('~second-screen', 10000);
  const displayed = await driver.isDisplayed('~second-screen');
  expect(displayed).toBeTruthy();
});

When('the user enters {string} in the search field', async function (text: string) {
  await driver.type('~search-input', text);
});

Then('the search field should contain {string}', async function (expected: string) {
  const actual = await driver.getText('~search-input');
  expect(actual).toContain(expected);
});

When('the user scrolls down the page', async function () {
  await driver.scrollTo('bottom-content');
});

Then('the bottom content should be visible', async function () {
  const displayed = await driver.isDisplayed('~bottom-content');
  expect(displayed).toBeTruthy();
});

When('the user navigates to a sub-screen', async function () {
  await driver.tap('~nav-button');
  await driver.waitForElement('~second-screen', 10000);
});

When('the user presses the back button', async function () {
  const d = driver.getDriver();
  await d.back();
});

After(async function () {
  if (driver) {
    await driver.quit();
  }
});
