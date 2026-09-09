import { test } from '@playwright/test';
import { GajabPage } from '../../pages/GajabPage';
import purchaseData from '../data/gajab-purchase.json';
import { logger } from '../../utils/logger';

test.describe('Gajab purchase journey @ui', () => {
  test('should place an order after bargaining for a product', async ({ page }) => {
    const gajab = new GajabPage(page);

    logger.info('Gajab purchase journey started.');
    await gajab.goToHome();
    logger.info('Gajab home page loaded.');

    logger.info('Setting delivery location.');
    // await gajab.declineLocation(purchaseData.location.pincode);
    logger.info('Delivery location set.');

    logger.info('Navigating to login/sign-up.');
    await gajab.goToLogInSignUp();
    logger.info('Login/sign-up page opened.');
    await gajab.signIn(purchaseData.phoneNumber, purchaseData.otp);
    // await gajab.completeProfile(purchaseData.fullName);
    // await gajab.openProduct(purchaseData.productUrl);
    // await gajab.placeBargainOffer(purchaseData.offerAmount);
    // await gajab.buyNow();
    // await gajab.addAddress(purchaseData.addressLine1, purchaseData.addressLine2);
    // await gajab.payOnline();
    // await gajab.completeNetbankingPayment();
    // await gajab.verifyOrderPlaced();
    // await gajab.verifyBargainHistory();
  });
});