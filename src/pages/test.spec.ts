import { test, expect, Page } from '@playwright/test';

async function handleLocationPopup(page: Page): Promise<void> {
  const popupCandidates = [
    page.getByRole('button', { name: /allow location|allow|use current location|enable location/i }).first(),
    page
      .locator(
        'button:has-text("Allow Location"), button:has-text("Allow"), button:has-text("Use current location"), button:has-text("Enable Location")'
      )
      .first(),
  ];

  for (const candidate of popupCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ timeout: 5000 }).catch(() => undefined);
      return;
    }
  }
}

test('test', async ({ page, context }) => {
  // Grant geolocation permission before navigating so the location prompt doesn't block interactions
  await context.grantPermissions(['geolocation'], { origin: 'https://stg.gajab.com' });
  await page.goto('https://stg.gajab.com/');
  await handleLocationPopup(page);
  await page.locator('#home-bargain-guide-portal-overlay').click();
  // Verify the first 2 items' bargain counts instead of hardcoding exact values, since counts change dynamically
  const bargainCounts = page.locator('[id^="home-wp2-item-bargain-count-"]');
  for (let i = 0; i < 2; i++) {
    const bargainCount = bargainCounts.nth(i);
    await expect(bargainCount).toBeVisible();
    await expect(bargainCount).toHaveText(/⚡️ \d+ Times Bargained/);
  }
  await page.locator('#home-wp1-header').getByText('View All').click();
  await page.goto('https://stg.gajab.com/product-list/all?widgetId=10&position=WP1');
  // Click "More" repeatedly until the target brand filter option is visible
  while (!(await page.getByText("SERA'S BASKET").isVisible())) {
    await page.locator('#brand-filter-load-more-btn').click();
  }
  await expect(page.getByText("SERA'S BASKET")).toBeVisible();
  await page.getByText("SERA'S BASKET").click();
  await page.getByRole('button', { name: 'More' }).click();
  // Drag the min-price slider thumb via mouse actions instead of fill(), since the styled range thumb needs a real drag to update
  const priceSliderTrack = page.locator('#price-filter-website-slider-track-container');
  const priceSliderBox = await priceSliderTrack.boundingBox();
  if (priceSliderBox) {
    const minValue = 142;
    const maxValue = 670;
    const targetValue = 427;
    const percentage = (targetValue - minValue) / (maxValue - minValue);
    const startX = priceSliderBox.x;
    const targetX = priceSliderBox.x + priceSliderBox.width * percentage;
    const y = priceSliderBox.y + priceSliderBox.height / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(targetX, y, { steps: 10 });
    await page.mouse.up();
  }

  const productTitle = page.getByText('Classic 15.7 Inch Soft Tip Dartboard Game Set | 6 Darts Included | Premium Quality Round Target Board for Kids & Adults | Indoor Family Fun, Birthday & Christmas Gift (Multicolor, 40 cm)');
  await expect(productTitle).toBeVisible();
  await productTitle.click();
  await expect(page.locator('#pdp-product-title')).toHaveText('Classic 15.7 Inch Soft Tip Dartboard Game Set | 6 Darts Included | Premium Quality Round Target Board for Kids & Adults | Indoor Family Fun, Birthday & Christmas Gift (Multicolor, 40 cm)');
  await page.getByText('Start Bargaining').first().click();
  await expect(page.locator('#bargain-signin-title')).toBeVisible();
  await page.getByRole('textbox', { name: 'Mobile Number' }).click();
  await page.getByRole('textbox', { name: 'Mobile Number' }).fill('7685645678');
  await page.getByRole('checkbox', { name: 'uncheck By continuing, you' }).check();
  await page.getByRole('button', { name: 'Request OTP' }).click();
  await expect(page.getByText('OTP sent to your mobile number')).toBeVisible();
  await expect(page.locator('#otp-verification-title')).toBeVisible();
  const otp = '123456';
  for (let i = 0; i < otp.length; i++) {
    await page.locator(`#otp-input-${i}`).fill(otp[i]);
  }
  await page.getByRole('slider', { name: 'Adjust offer amount' }).fill('3.71');
  await page.getByRole('button', { name: 'Offer Your Price' }).click();
  // Save the bargained savings amount for later comparison
  const bargainSavingsText = await page.locator('#bargain-accepted-savings-badge').innerText();
  await page.locator('body').press('ControlOrMeta+-');
  await page.locator('body').press('ControlOrMeta+-');
  await page.locator('body').press('ControlOrMeta+-');
  await page.getByRole('button', { name: 'Buy Now' }).click();
  await page.getByRole('textbox', { name: 'Name *' }).fill('gytyut');
  await page.getByRole('textbox', { name: 'Address line 1 *' }).click();
  await page.getByRole('textbox', { name: 'Address line 1 *' }).fill('fedfef');
  await page.getByRole('textbox', { name: 'Address Line 2 *' }).click();
  await page.getByRole('textbox', { name: 'Address Line 2 *' }).fill('frfer');
  await page.getByText('Set as default address').click();
  await page.getByText('Use same for billing address').click();
  await page.getByRole('img', { name: 'uncheck', exact: true }).click();
  await page.getByRole('img', { name: 'uncheck', exact: true }).check();
  await page.getByRole('button', { name: 'Save Address' }).click();
  await page.getByRole('textbox', { name: 'Pincode *' }).click();
  await page.getByRole('textbox', { name: 'Pincode *' }).fill('626117');
  await page.getByRole('button', { name: 'Save Address' }).click();
  await page.getByRole('button', { name: 'Pay ₹' }).click();
//   await page.locator('iframe').press('ControlOrMeta+-');
//   await page.locator('iframe').press('ControlOrMeta+-');
//   await page.locator('iframe').contentFrame().getByRole('radio', { name: 'Netbanking BARB_R CNRB PUNB_R' }).check();
//   const page1Promise = page.waitForEvent('popup');
//   await page.locator('iframe').contentFrame().getByTestId('netbanking').click();
//   const page1 = await page1Promise;
//   await page.locator('iframe').contentFrame().getByTestId('bank-option-CNRB').first().click();
//   await expect(page1.getByRole('heading', { name: 'Welcome to Razorpay Software' })).toBeVisible();
//   await page1.getByRole('button', { name: 'Success' }).click();
//   await page.locator('iframe').contentFrame().getByTestId('payment-status-heading').click();
//   await page.getByRole('button', { name: 'Close' }).click();
//   await expect(page.getByText('Order placed!Yay! Your order')).toBeVisible();
//   await page.getByRole('heading', { name: 'Order placed!' }).click();
//   await page.getByRole('link', { name: 'My Bargains bargains' }).click();
//   await expect(page.getByText('You Saved ₹')).toBeVisible();
});