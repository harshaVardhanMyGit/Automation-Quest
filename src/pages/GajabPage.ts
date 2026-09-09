import { expect, FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GajabPage extends BasePage {
    private readonly homeUrl = process.env.BASE_URL || 'https://stg.gajab.com/';
    private readonly loginSignUpLink: Locator;
    private readonly bargainGuideOverlay: Locator;
    private readonly locationMenuButton: Locator;
    private readonly pincodeInput: Locator;
    private readonly locationMenuText: Locator;
    private readonly mobileNumberInput: Locator;
    private readonly termsCheckbox: Locator;
    private readonly requestOtpButton: Locator;
    private readonly otpInputs: Locator;
    private readonly fullNameInput: Locator;
    private readonly nextButton: Locator;
    private readonly productContainer: Locator;
    private readonly bargainButton: Locator;
    private readonly offerAmountSlider: Locator;
    private readonly offerPriceButton: Locator;
    private readonly closeBargainButton: Locator;
    private readonly buyNowButton: Locator;
    private readonly addressLine1Input: Locator;
    private readonly addressLine2Input: Locator;
    private readonly saveAddressAsHomeCheckbox: Locator;
    private readonly useSameBillingCheckbox: Locator;
    private readonly saveAddressButton: Locator;
    private readonly payOnlineOption: Locator;
    private readonly payButton: Locator;
    private readonly paymentFrame: FrameLocator;
    private readonly netbankingOption: Locator;
    private readonly canaraBankButton: Locator;
    private readonly paymentStatusHeading: Locator;
    private readonly orderPlacedHeading: Locator;
    private readonly bargainsLink: Locator;
    private readonly bargainHistory: Locator;

    constructor(page: Page) {
        super(page);
        this.loginSignUpLink = page.getByRole('link', { name: 'Log in / Sign up arrow' });
        this.bargainGuideOverlay = page.locator('#home-bargain-guide-portal-overlay');
        this.locationMenuButton = page.locator('#location-desktop-menu-btn').first();
        this.pincodeInput = page.locator(
            'input[placeholder*="PIN" i], input[placeholder*="postal" i], input[aria-label*="PIN" i], input[aria-label*="postal" i]',
        ).first();
        this.locationMenuText = page.locator('#location-desktop-menu-text');
        this.mobileNumberInput = page.getByRole('textbox', { name: 'Enter your Mobile Number here' });
        this.termsCheckbox = page.getByRole('checkbox', { name: /By continuing/i });
        this.requestOtpButton = page.getByRole('button', { name: 'Request OTP' });
        this.otpInputs = page.locator('[id^="otp-input-"]');
        this.fullNameInput = page.getByRole('textbox', { name: 'Enter your Full Name here' });
        this.nextButton = page.getByRole('button', { name: 'Next' });
        this.productContainer = page.locator('#pdp-div-59');
        this.bargainButton = page.locator('#pdp-button-7');
        this.offerAmountSlider = page.getByRole('slider', { name: 'Adjust offer amount' });
        this.offerPriceButton = page.getByRole('button', { name: 'Offer Your Price' });
        this.closeBargainButton = page.getByRole('button', { name: 'Close bargain modal' });
        this.buyNowButton = page.getByRole('button', { name: 'Buy Now', exact: true });
        this.addressLine1Input = page.getByRole('textbox', { name: 'Address line 1 *' });
        this.addressLine2Input = page.getByRole('textbox', { name: 'Address Line 2 *' });
        this.saveAddressAsHomeCheckbox = page.locator('#add-address-save-as-uncheck-home');
        this.useSameBillingCheckbox = page.locator('#add-address-use-same-billing-uncheck');
        this.saveAddressButton = page.getByRole('button', { name: 'Save Address' });
        this.payOnlineOption = page.getByText(/Pay Online/);
        this.payButton = page.getByRole('button', { name: /Pay ₹/ });
        this.paymentFrame = page.locator('iframe').contentFrame();
        this.netbankingOption = this.paymentFrame.getByTestId('netbanking');
        this.canaraBankButton = this.paymentFrame.getByRole('button', { name: 'Canara Bank Canara Bank' }).first();
        this.paymentStatusHeading = this.paymentFrame.getByTestId('payment-status-heading');
        this.orderPlacedHeading = page.getByRole('heading', { name: 'Order placed!' });
        this.bargainsLink = page.getByRole('link', { name: 'My Bargains bargains' });
        this.bargainHistory = page.getByText(/ASKING PRICE.*BARGAIN PRICE/);
    }

    async goToHome(): Promise<void> {
        await this.navigate(this.homeUrl);
    }

    async goToLogInSignUp(): Promise<void> {
        await this.loginSignUpLink.waitFor({ state: 'visible', timeout: 80000 });
        await this.loginSignUpLink.scrollIntoViewIfNeeded();
        await this.loginSignUpLink.click();
    }

    async acceptLocation(pincode: string, latitude = 19.076, longitude = 72.8777): Promise<void> {
        await this.page.context().grantPermissions(['geolocation'], {
            origin: new URL(this.homeUrl).origin,
        });
        await this.page.context().setGeolocation({ latitude, longitude });
        await this.dismissBargainGuideOverlay();
        await this.setLocationByPincode(pincode);
    }

    async declineLocation(pincode: string): Promise<void> {
        // deny geolocation instead of granting it, forcing the manual pincode entry flow
        await this.page.context().clearPermissions();
        await this.dismissBargainGuideOverlay();
        await this.setLocationByPincode(pincode);
    }



    private async dismissBargainGuideOverlay(): Promise<void> {
        const overlay = this.bargainGuideOverlay;
        // overlay animates in after a short delay, so wait for it before deciding it's absent
        const appeared = await overlay.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
        if (!appeared) {
            return;
        }

        await overlay.click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
        if (await overlay.isVisible().catch(() => false)) {
            await this.page.keyboard.press('Escape').catch(() => {});
        }
        if (await overlay.isVisible().catch(() => false)) {
            // bypass hit-testing entirely by dispatching a native click on the element
            await overlay.evaluate((el: any) => el.click()).catch(() => {});
        }

        await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }

    async setLocationByPincode(pincode: string): Promise<boolean> {
        const deadline = Date.now() + 10000;
        const remainingTimeout = (): number => Math.max(1, deadline - Date.now());

        try {
            await this.locationMenuButton.click({ timeout: remainingTimeout() });
            await expect(this.pincodeInput).toBeVisible({ timeout: remainingTimeout() });
            await this.pincodeInput.fill(pincode);

            const locationOption = this.page.getByText(new RegExp(pincode)).last();
            await expect(locationOption).toBeVisible({ timeout: remainingTimeout() });
            await locationOption.click();
            await expect(this.locationMenuText).toBeVisible({ timeout: remainingTimeout() });
            await expect(this.locationMenuText).toContainText(pincode, { timeout: remainingTimeout() });
            return true;
        } catch {
            return false;
        }
    }

    async signIn(phoneNumber: string, otp: string): Promise<void> {
        await this.mobileNumberInput.fill(phoneNumber);
        await this.termsCheckbox.check();
        await this.requestOtpButton.click();

        for (const [index, digit] of [...otp].entries()) {
            await this.otpInputs.nth(index).fill(digit);
        }

        await this.enterOtpAndContinue();
    }

    async enterOtpAndContinue(): Promise<void> {
        await this.page.pause();
        await this.dismissBargainGuideOverlay();
        await expect(this.fullNameInput).toBeVisible();
    }

    async completeProfile(fullName: string): Promise<void> {
        await this.fullNameInput.fill(fullName);
        await this.nextButton.click();
    }

    async openProduct(productUrl: string): Promise<void> {
        await this.page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 80000 });
        await expect(this.productContainer).toBeVisible();
    }

    async placeBargainOffer(offerAmount: string): Promise<void> {
        await this.bargainButton.click();
        await this.offerAmountSlider.fill(offerAmount);
        await this.offerPriceButton.click();
        await this.closeBargainButton.click();
    }

    async buyNow(): Promise<void> {
        await this.buyNowButton.click();
    }

    async addAddress(addressLine1: string, addressLine2: string): Promise<void> {
        await this.addressLine1Input.fill(addressLine1);
        await this.addressLine2Input.fill(addressLine2);
        await this.saveAddressAsHomeCheckbox.check();
        await this.useSameBillingCheckbox.check();
        await this.saveAddressButton.click();
    }

    async payOnline(): Promise<void> {
        await this.payOnlineOption.click();
        await this.payButton.click();
    }

    async completeNetbankingPayment(): Promise<void> {
        await this.paymentFrame.getByRole('radio', { name: /Netbanking/ }).check();
        const bankPagePromise = this.page.waitForEvent('popup');
        await this.netbankingOption.click();
        const bankPage = await bankPagePromise;
        await this.canaraBankButton.click();
        await bankPage.getByRole('button', { name: 'Success' }).click();
        await expect(this.paymentStatusHeading).toBeVisible();
    }

    async verifyOrderPlaced(): Promise<void> {
        await expect(this.orderPlacedHeading).toBeVisible();
    }

    async verifyBargainHistory(): Promise<void> {
        await this.bargainsLink.click();
        await expect(this.bargainHistory).toBeVisible();
    }
}