import { test, expect } from '@playwright/test';
import { GajabHomePage } from '../../pages/GajabHomePage';
import { GajabProductListPage } from '../../pages/GajabProductListPage';
import { GajabProductDetailPage } from '../../pages/GajabProductDetailPage';

test.describe('Gajab full web flow (organized)', () => {
  test('runs captured flow until payment step', async ({ page }) => {
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

    await test.step('Open homepage and verify core sections', async () => {
      await homePage.navigateToHome();
      await homePage.expectHomepageSections();
      await expect(homePage.getLocationButton()).toBeVisible();
    });

    await test.step('Open Just Bargained and capture cheapest product', async () => {
      await homePage.openJustBargainedViewAll();
      await listPage.waitForJustBargainedPage();

      const cheapestProduct = await listPage.findCheapestProduct(99);
      expect(cheapestProduct.name).toBeTruthy();
      expect(cheapestProduct.priceValue).toBeGreaterThan(0);
    });

    await test.step('Open Toys and Games and verify filter', async () => {
      await homePage.openToysAndGamesCategory();
      await listPage.waitForToysAndGamesPage();
      await expect(listPage.getFilterButton()).toBeVisible();
    });

    await test.step('Open My Bargains page', async () => {
      await homePage.openMyBargains();
      await listPage.waitForMyBargainsPage();
    });

    await test.step('Open target product and branch by purchase state', async () => {
      await page.goto(productUrl, { waitUntil: 'domcontentloaded' });

      const offerSnapshot = await detailPage.getOfferSnapshot();
      expect(offerSnapshot.productName).toContain('Classic 15.7 Inch Soft Tip Dartboard Game Set');
      expect(offerSnapshot.brandName).toContain("SERA'S BASKET");
      expect(['fresh', 'payment-pending', 'purchased']).toContain(offerSnapshot.purchaseState);

      if (offerSnapshot.purchaseState === 'fresh') {
        await expect(detailPage.getStartBargainingButton()).toBeVisible();
      }

      if (offerSnapshot.purchaseState === 'payment-pending') {
        await expect(detailPage.getRetryPaymentButton()).toBeVisible();
        await detailPage.getRetryPaymentButton().click();
        await expect(page).toHaveURL(/\/checkout|\/my-orders|\/order-detail\//);

        const paymentEntrySignals = page.locator('text=/Payment Method|Payment Incomplete|Retry payment of|Pay Online/i');
        await expect(paymentEntrySignals.first()).toBeVisible({ timeout: 30000 });
      }

      if (offerSnapshot.purchaseState === 'purchased') {
        await expect(detailPage.getBuyNowButton().or(detailPage.getRetryPaymentButton()).first()).toBeVisible();
      }
    });

    await test.step('Stop at payment step boundary', async () => {
      await page.screenshot({ path: 'reports/screenshots/gajab-full-flow-payment-boundary.png', fullPage: true });
      expect(page.url()).toContain(baseUrl.replace(/\/$/, ''));
    });
  });
});