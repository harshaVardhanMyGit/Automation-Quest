import { test, expect } from '@playwright/test';
import { GajabHomePage } from '../../pages/GajabHomePage';
import { GajabProductListPage } from '../../pages/GajabProductListPage';
import { GajabProductDetailPage } from '../../pages/GajabProductDetailPage';
import { GajabCheckoutPage } from '../../pages/GajabCheckoutPage';

test.describe('Gajab web journey', () => {
  let gajabHomePage: GajabHomePage;
  let gajabProductListPage: GajabProductListPage;
  let gajabProductDetailPage: GajabProductDetailPage;
  let gajabCheckoutPage: GajabCheckoutPage;

  test.beforeEach(async ({ page }) => {
    gajabHomePage = new GajabHomePage(page);
    gajabProductListPage = new GajabProductListPage(page);
    gajabProductDetailPage = new GajabProductDetailPage(page);
    gajabCheckoutPage = new GajabCheckoutPage(page);
    await gajabHomePage.navigateToHome();
  });

  test('homepage exposes the core merchandising sections', async () => {
    await gajabHomePage.expectHomepageSections();
    await expect(gajabHomePage.getLocationButton()).toBeVisible();
  });

  test('captures homepage merchandising signals after login', async () => {
    const dealOfDay = await gajabHomePage.getDealOfTheDay();
    const trendingProduct = await gajabHomePage.getTopTrendingProduct();
    const latestLiveOrder = await gajabHomePage.getLatestLiveOrder();

    expect(dealOfDay.name).toBeTruthy();
    expect(dealOfDay.priceText).toContain('Asking Price');
    expect(trendingProduct.bargainCount).toBeGreaterThan(0);
    expect(latestLiveOrder).toContain('paid');
  });

  test('finds the cheapest product in Just Bargained view all', async () => {
    await gajabHomePage.openJustBargainedViewAll();
    await gajabProductListPage.waitForJustBargainedPage();

    const cheapestProduct = await gajabProductListPage.findCheapestProduct(99);

    expect(cheapestProduct.name).toBeTruthy();
    expect(cheapestProduct.priceValue).toBeGreaterThan(0);
  });

  test('opens toys and games catalog for the bargaining flow', async () => {
    await gajabHomePage.openToysAndGamesCategory();
    await gajabProductListPage.waitForToysAndGamesPage();

    await expect(gajabProductListPage.getFilterButton()).toBeVisible();
  });

  test('opens My Bargains page', async () => {
    await gajabHomePage.openMyBargains();
    await gajabProductListPage.waitForMyBargainsPage();
  });

  test('verifies the target dartboard product details and purchase state', async ({ page }) => {
    await page.goto('https://stg.gajab.com/product-detail/classic-157-inch-soft-tip-dartboard-game-set-%7C-6-darts-included-%7C-premium-quality-round-target-board-for-kids-adults-%7C-indoor-family-fun-birthday-christmas-gift-multicolor-40-cm/202612786944');

    const offerSnapshot = await gajabProductDetailPage.getOfferSnapshot();

    expect(offerSnapshot.productName).toContain('Classic 15.7 Inch Soft Tip Dartboard Game Set');
    expect(offerSnapshot.brandName).toContain("SERA'S BASKET");
    expect(['fresh', 'payment-pending', 'purchased']).toContain(offerSnapshot.purchaseState);

    if (offerSnapshot.purchaseState === 'payment-pending') {
      await expect(gajabProductDetailPage.getRetryPaymentButton()).toBeVisible();
      expect(offerSnapshot.exclusiveOfferPrice).toContain('₹');
    }

    if (offerSnapshot.purchaseState === 'fresh') {
      await expect(gajabProductDetailPage.getStartBargainingButton()).toBeVisible();
    }
  });

  test('user can reach sign in and request OTP', async () => {
    test.skip(!process.env.TEST_MOBILE_NUMBER, 'Set TEST_MOBILE_NUMBER in .env before running the live sign-in flow.');

    await gajabHomePage.openSignIn();
    await gajabHomePage.fillMobileNumber(process.env.TEST_MOBILE_NUMBER!);
    await gajabHomePage.acceptTermsAndPrivacy();

    await expect(gajabHomePage.getRequestOtpButton()).toBeEnabled();
    await gajabHomePage.requestOtp();
  });

  test('captures payment failure checkpoint on checkout', async ({ page }) => {
    test.skip(
      process.env.RUN_PAYMENT_FAILURE_CHECKPOINT !== 'true',
      'Set RUN_PAYMENT_FAILURE_CHECKPOINT=true to validate the payment failure modal checkpoint.'
    );

    await page.goto(`${process.env.BASE_URL || 'https://stg.gajab.com'}/checkout`, {
      waitUntil: 'domcontentloaded',
    });

    await gajabCheckoutPage.expectPaymentFailureModal();
    await gajabCheckoutPage.capturePaymentFailureEvidence();
  });
});