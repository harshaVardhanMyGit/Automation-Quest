import { remote, Browser } from 'webdriverio';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AppiumConfig {
  appiumServer: string;
  platformName: string;
  deviceName: string;
  app?: string;
  automationName: string;
}

function getDefaultConfig(): AppiumConfig {
  return {
    appiumServer: process.env.APPIUM_SERVER || 'http://127.0.0.1:4723',
    platformName: process.env.MOBILE_PLATFORM || 'Android',
    deviceName: process.env.DEVICE_NAME || 'emulator-5554',
    app: process.env.APK_PATH || '',
    automationName: 'UiAutomator2',
  };
}

export class AppiumDriver {
  private driver: Browser | null = null;
  private config: AppiumConfig;

  constructor(config?: Partial<AppiumConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }

  async launch(): Promise<Browser> {
    const capabilities: Record<string, any> = {
      platformName: this.config.platformName,
      'appium:deviceName': this.config.deviceName,
      'appium:automationName': this.config.automationName,
      'appium:noReset': false,
      'appium:newCommandTimeout': 300,
    };

    if (this.config.app) {
      capabilities['appium:app'] = this.config.app;
    }

    this.driver = await remote({
      hostname: new URL(this.config.appiumServer).hostname,
      port: parseInt(new URL(this.config.appiumServer).port) || 4723,
      path: '/',
      capabilities,
    });

    return this.driver;
  }

  getDriver(): Browser {
    if (!this.driver) throw new Error('Driver not launched. Call launch() first.');
    return this.driver;
  }

  async tap(selector: string): Promise<void> {
    const element = await this.getDriver().$(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    await element.click();
  }

  async type(selector: string, text: string): Promise<void> {
    const element = await this.getDriver().$(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    await element.setValue(text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.getDriver().$(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    return element.getText();
  }

  async isDisplayed(selector: string): Promise<boolean> {
    try {
      const element = await this.getDriver().$(selector);
      return element.isDisplayed();
    } catch {
      return false;
    }
  }

  async scrollTo(text: string): Promise<void> {
    await this.getDriver().execute('mobile: scroll', {
      strategy: 'accessibility id',
      selector: text,
    });
  }

  async takeScreenshot(name: string): Promise<string> {
    const screenshot = await this.getDriver().takeScreenshot();
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), 'reports', 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${name}.png`);
    fs.writeFileSync(filePath, screenshot, 'base64');
    return filePath;
  }

  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    const element = await this.getDriver().$(selector);
    await element.waitForDisplayed({ timeout });
  }

  async getElements(selector: string): Promise<string[]> {
    const elements = await this.getDriver().$$(selector);
    const texts: string[] = [];
    for (const el of elements) {
      texts.push(await el.getText());
    }
    return texts;
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.deleteSession();
      this.driver = null;
    }
  }
}
