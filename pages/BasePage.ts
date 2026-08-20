import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigate to URL
  async navigate(url: string) {
    await this.page.goto('https://gctp.in/chennai-home');
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

  // Wait for a few seconds (avoid using unless necessary)
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