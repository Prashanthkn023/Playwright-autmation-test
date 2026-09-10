import { Page, Locator, expect } from '@playwright/test';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigate to URL
  async closeAnyPopup() {
    await closeAwarenessPopup(this.page);

    const closeSelectors = [
      '[aria-label="Close"]',
      '[aria-label="close"]',
      '[title="Close"]',
      '[title="close"]',
      '.btn-close',
      '.close',
      'button.close',
      'button[aria-label*="close" i]',
      'button[title*="close" i]',
      'button:has-text("Close")',
      'button:has-text("Dismiss")',
      'button:has-text("OK")',
    ];

    for (const selector of closeSelectors) {
      const locator = this.page.locator(selector);
      const count = await locator.count().catch(() => 0);

      for (let i = 0; i < count; i++) {
        const element = locator.nth(i);
        const visible = await element.isVisible().catch(() => false);

        if (!visible) continue;

        try {
          await element.click({ force: true, timeout: 3000 });
          await this.page.waitForTimeout(300);
          return;
        } catch {
          // continue trying other selectors
        }
      }
    }

    try {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
    } catch {
      // ignore keyboard failures
    }
  }

  async navigate(url: string) {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await this.closeAnyPopup();
  }

  // Click on an element
  async click(locator: Locator) {
    await locator.click();
  }

  // Fill input field
  async fill(locator: Locator, value: string) {
    await locator.fill(value);
  }

  // Get text from element
  async getText(locator: Locator): Promise<string | null> {
    return await locator.textContent();
  }

  // Verify element is visible
  async verifyVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  // Verify page title
  async verifyTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  // Verify URL
  async verifyURL(url: RegExp | string) {
    await expect(this.page).toHaveURL(url);
  }

  // Wait for a few seconds
  async wait(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  // Upload file
  async uploadFile(locator: Locator, filePath: string) {
    await locator.setInputFiles(filePath);
  }

  // Scroll to element
  async scrollIntoView(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  // Take screenshot
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true
    });
  }
}
