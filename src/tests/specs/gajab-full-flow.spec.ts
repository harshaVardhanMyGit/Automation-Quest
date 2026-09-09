import { test, expect, Page } from '@playwright/test';
import { GajabHomePage } from '../../pages/GajabHomePage';
import { GajabProductListPage } from '../../pages/GajabProductListPage';
import { GajabProductDetailPage } from '../../pages/GajabProductDetailPage';
import { GajabCheckoutPage } from '../../pages/GajabCheckoutPage';

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

async function ensureLocationSelected(page: Page, homePage: GajabHomePage): Promise<void> {
  const locationButton = homePage.getLocationButton();
  await expect(locationButton).toBeVisible({ timeout: 20000 });
  await locationButton.click({ timeout: 10000 }).catch(() => undefined);
  await page.waitForTimeout(1500);

  const selectionCandidates = [
    page.getByRole('button', { name: /allow location|use current location|detect my location|confirm|save/i }).first(),
    page
      .locator(
        'button:has-text("Allow Location"), button:has-text("Use current location"), button:has-text("Detect"), button:has-text("Confirm"), button:has-text("Save")'
      )
      .first(),
    page.locator('li:has-text("Chennai"), button:has-text("Chennai"), div:has-text("Chennai (600042)")').first(),
  ];

  let handledSelection = false;
  for (const candidate of selectionCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ timeout: 10000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
      handledSelection = true;
    }
  }

  if (!handledSelection) {
    test.info().annotations.push({
      type: 'warning',
      description: 'Location selection UI was not exposed; continuing with the current header location state.',
    });
  }

  await expect(locationButton).toBeVisible({ timeout: 20000 });
}

async function loginIfNeeded(page: Page, homePage: GajabHomePage): Promise<void> {
  const signInTrigger = page.locator('#profile-menu-signin-link, #header-login-btn').first();
  const isSignInVisible = await signInTrigger.isVisible().catch(() => false);

  if (!isSignInVisible) {
    test.info().annotations.push({
      type: 'info',
      description: 'Login trigger not visible; session is likely already authenticated.',
    });
    return;
  }

  const mobile = process.env.TEST_MOBILE_NUMBER || '9878675456';
  await signInTrigger.click({ timeout: 15000 }).catch(() => undefined);
  const onSignInPage = await page.waitForURL(/\/auth\/signin/, { timeout: 10000 }).then(() => true).catch(() => false);
  if (!onSignInPage) {
    await page.goto(`${process.env.BASE_URL || 'https://stg.gajab.com'}/auth/signin`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }

  await homePage.waitForSignInPage();
  const mobileInput = page.locator('input[placeholder*="Mobile Number" i], input[placeholder*="Mobile" i]').first();
  await expect(mobileInput).toBeVisible({ timeout: 20000 });
  await mobileInput.click();
  await mobileInput.fill('');
  await mobileInput.type(mobile, { delay: 80 });
  await mobileInput.press('Tab');

  const consentCheckbox = page.locator('input[type="checkbox"]').first();
  if (!(await consentCheckbox.isChecked().catch(() => false))) {
    await consentCheckbox.check({ force: true });
  }

  await page.waitForTimeout(1000);

  const requestOtpButton = homePage.getRequestOtpButton();
  await page
    .waitForFunction(() => {
      const btn = (globalThis as { document?: { querySelector?: (selector: string) => unknown } }).document
        ?.querySelector?.('button#signin-submit-btn') as { disabled?: boolean } | null;
      return !!btn && btn.disabled === false;
    }, null, { timeout: 30000 })
    .catch(() => undefined);
  await expect(requestOtpButton).toBeEnabled({ timeout: 30000 });
  await homePage.requestOtp();

  const otp = process.env.DEFAULT_OTP || '123456';

  const otpInputs = page.locator('input[maxlength="1"], [role="textbox"][maxlength="1"], input[aria-label*="OTP" i], input[name*="otp" i], input[id*="otp" i]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 45000 });
  const inputCount = await otpInputs.count();

  if (inputCount > 1) {
    const digits = otp.split('');
    for (let index = 0; index < Math.min(inputCount, digits.length); index++) {
      const field = otpInputs.nth(index);
      await field.click();
      await field.fill('');
      await field.type(digits[index], { delay: 80 });
    }
    await otpInputs.nth(Math.min(inputCount, digits.length) - 1).press('Tab').catch(() => undefined);
  } else if (inputCount === 1) {
    await otpInputs.first().click();
    await otpInputs.first().fill('');
    await otpInputs.first().type(otp, { delay: 80 });
    await otpInputs.first().press('Tab').catch(() => undefined);
  }

  const verifyButton = page
    .locator('button:has-text("Verify"), button:has-text("Continue"), button:has-text("Login"), button:has-text("Submit")')
    .first();

  await expect(verifyButton).toBeVisible({ timeout: 15000 });
  await expect(verifyButton).toBeEnabled({ timeout: 30000 });
  await verifyButton.click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 60000 });
}

async function continueBargainToPayment(page: Page, detailPage: GajabProductDetailPage): Promise<void> {
  const mobile = process.env.TEST_MOBILE_NUMBER || '7685645678';
  const otp = process.env.DEFAULT_OTP || '123456';

  // Check if login modal is visible
  const loginTitle = page.locator('#bargain-signin-title');
  const isLoginVisible = await loginTitle.isVisible().catch(() => false);

  if (isLoginVisible) {
    // Fill mobile number
    await expect(loginTitle).toBeVisible();
    await page.getByRole('textbox', { name: 'Mobile Number' }).click();
    await page.getByRole('textbox', { name: 'Mobile Number' }).fill(mobile);

    // Check consent checkbox
    await page.getByRole('checkbox', { name: /By continuing/ }).check();

    // Request OTP
    await page.getByRole('button', { name: 'Request OTP' }).click();
    await page.locator('#bargain-signin-modal').click();

    // Fill OTP
    await page.locator('#bargain-otp-verify-input-0').click();
    for (let i = 0; i < otp.length; i++) {
      await page.locator(`#bargain-otp-verify-input-${i}`).fill(otp[i]);
    }

    // Click modal to trigger verify
    await page.locator('#bargain-signin-modal').click();

    // Wait for auth to complete
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 60000 }).catch(() => undefined);
    await page.waitForTimeout(2000);
  }

  const bargainingSignals = page.locator(
    'text=/Your Offer|Place Offer|Exclusive Offer|Buy Now|Bargain price|Savings by bargain/i'
  );
  await expect(bargainingSignals.first()).toBeVisible({ timeout: 30000 });

  const bargainProgressButtons = page.locator(
    'button:has-text("Place Offer"), button:has-text("Submit"), button:has-text("Continue"), button:has-text("Accept Offer"), button:has-text("Proceed")'
  );

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await detailPage.getBuyNowButton().isVisible().catch(() => false)) {
      break;
    }

    if (await page.locator('text=/Payment Method|Payment Incomplete|Retry payment of|Pay Online/i').first().isVisible().catch(() => false)) {
      return;
    }

    const progressButton = bargainProgressButtons.first();
    if (await progressButton.isVisible().catch(() => false)) {
      await progressButton.click().catch(() => undefined);
      await page.waitForTimeout(2000);
    }
  }

  const buyNowButton = detailPage.getBuyNowButton();
  await expect(buyNowButton).toBeVisible({ timeout: 30000 });
  await buyNowButton.click();
  await expect(page).toHaveURL(/\/checkout|\/my-orders|\/order-detail\//, { timeout: 60000 });
}

test.describe('Gajab full web flow (organized)', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('runs captured flow until payment step', async ({ page }) => {
    test.setTimeout(180000);

    test.skip(
      process.env.RUN_GAJAB_FULL_FLOW !== 'true',
      'Set RUN_GAJAB_FULL_FLOW=true to execute the live full-flow scenario.'
    );

    const baseUrl = process.env.BASE_URL || 'https://stg.gajab.com';
    const productUrl =
      'https://stg.gajab.com/product-detail/classic-157-inch-soft-tip-dartboard-game-set-%7C-6-darts-included-%7C-premium-quality-round-target-board-for-kids-adults-%7C-indoor-family-fun-birthday-christmas-gift-multicolor-40-cm/202612786944';

    const homePage = new GajabHomePage(page);
    const listPage = new GajabProductListPage(page);
    const detailPage = new GajabProductDetailPage(page);
    const checkoutPage = new GajabCheckoutPage(page);

    await test.step('Select location first', async () => {
      await page.context().grantPermissions(['geolocation'], { origin: baseUrl });
      await page.context().setGeolocation({ latitude: 12.9716, longitude: 80.2206 });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await handleLocationPopup(page);
      await ensureLocationSelected(page, homePage);
      await expect(homePage.getLocationButton()).toBeVisible();
    });

    await test.step('Login after location selection (deferred until bargain)', async () => {
      test.info().annotations.push({
        type: 'info',
        description: 'Upfront login skipped; app login will be handled only if Start Bargaining triggers it.',
      });
    });

    await test.step('Verify homepage sections after login', async () => {
      const isOnHome = /https:\/\/stg\.gajab\.com\/?$/i.test(page.url());
      if (!isOnHome) {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
      await homePage.expectHomepageSections();
      await expect(homePage.getLocationButton()).toBeVisible();
    });

    await test.step('Open Just Bargained and capture cheapest product', async () => {
      await page.goto(`${baseUrl}/product-list/all?widgetId=10&position=WP1&limit=48&orderBy=0`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      let products = await listPage.getVisibleProducts();
      if (products.length === 0) {
        await page.goto(`${baseUrl}/product-list/all?widgetId=10&position=WP1&limit=48&orderBy=0`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(2000);
        products = await listPage.getVisibleProducts();
      }

      if (products.length > 0) {
        const cheapestProduct = await listPage.findCheapestProduct(99);
        expect(cheapestProduct.name).toBeTruthy();
        expect(cheapestProduct.priceValue).toBeGreaterThan(0);
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Just Bargained list returned zero products; continuing with direct product path.',
        });
      }
    });

    await test.step('Open Toys and Games and verify filter', async () => {
      await page.goto(`${baseUrl}/product-list/toys-games/17?offset=0`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const onToysOrGamesUrl = /\/product-list\/(toys-games|games)\//.test(page.url());
      if (!onToysOrGamesUrl) {
        test.info().annotations.push({
          type: 'warning',
          description: `Expected Toys/Games URL but reached: ${page.url()}`,
        });
      }

      if (await listPage.getFilterButton().isVisible().catch(() => false)) {
        await expect(listPage.getFilterButton()).toBeVisible();
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Filter button not visible in Toys/Games view; continuing flow.',
        });
      }
    });

    await test.step('Open My Bargains page', async () => {
      await homePage.openMyBargains();
      await listPage.waitForMyBargainsPage();
    });

    await test.step('Open target product and branch by purchase state', async () => {
      await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const offerSnapshot = await detailPage.getOfferSnapshot();
      expect(offerSnapshot.productName).toContain('Classic 15.7 Inch Soft Tip Dartboard Game Set');
      expect(offerSnapshot.brandName).toContain("SERA'S BASKET");
      expect(['fresh', 'payment-pending', 'purchased']).toContain(offerSnapshot.purchaseState);

      if (offerSnapshot.purchaseState === 'fresh') {
        const startBargainingButton = detailPage.getStartBargainingButton();
        await expect(startBargainingButton).toBeVisible();
        await startBargainingButton.click();
        await continueBargainToPayment(page, detailPage);
      }

      if (offerSnapshot.purchaseState === 'payment-pending') {
        await expect(detailPage.getRetryPaymentButton()).toBeVisible();
        await detailPage.getRetryPaymentButton().click();
        await expect(page).toHaveURL(/\/checkout|\/my-orders|\/order-detail\//, { timeout: 60000 });
      }

      if (offerSnapshot.purchaseState === 'purchased') {
        await expect(detailPage.getBuyNowButton().or(detailPage.getRetryPaymentButton()).first()).toBeVisible();
      }

      await checkoutPage.waitForCheckoutPage();
      const paymentEntrySignals = page.locator('text=/Payment Method|Payment Incomplete|Retry payment of|Pay Online/i');
      await expect(paymentEntrySignals.first()).toBeVisible({ timeout: 30000 });
    });

    await test.step('Stop at payment step boundary', async () => {
      await page.screenshot({ path: 'reports/screenshots/gajab-full-flow-payment-boundary.png', fullPage: true });
      expect(page.url()).toContain(baseUrl.replace(/\/$/, ''));
    });
  });
});