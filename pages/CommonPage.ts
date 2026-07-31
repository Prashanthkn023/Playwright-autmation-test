import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CommonPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    // Wait for page to load
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    // Wait for an element
    async waitForElement(locator: Locator) {
        await locator.waitFor({ state: 'visible' });
    }

    // Verify text
    async verifyText(locator: Locator, expectedText: string) {
        await expect(locator).toHaveText(expectedText);
    }

    // Verify element contains text
    async verifyContainsText(locator: Locator, expectedText: string) {
        await expect(locator).toContainText(expectedText);
    }

    // Verify success message
    async verifySuccessMessage(message: string) {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    // Accept alert
    async acceptAlert() {
        this.page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.accept();
        });
    }

    // Dismiss alert
    async dismissAlert() {
        this.page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.dismiss();
        });
    }

    // Refresh page
    async refreshPage() {
        await this.page.reload();
    }

    // Scroll to bottom
    async scrollToBottom() {
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }

    // Scroll to top
    async scrollToTop() {
        await this.page.evaluate(() => window.scrollTo(0, 0));
    }

    // Close browser page
    async closePage() {
        await this.page.close();
    }
}