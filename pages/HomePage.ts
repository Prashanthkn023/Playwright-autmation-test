import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {

    readonly feedbackLink: Locator;
    readonly complaintLink: Locator;
    readonly homeLogo: Locator;
    readonly images: Locator;

    constructor(page: Page) {
        super(page);

        this.feedbackLink = page.getByRole('link', { name: 'Feedback' });
        this.complaintLink = page.getByRole('link', { name: 'Complaints' });

        // Home page logo
        this.homeLogo = page.locator('img[alt="logo"]');

        // All website images
        this.images = page.locator('img[src^="https://gctp.in/"]');
    }

    // Open Home Page
    async openHomePage() {
        await this.navigate('https://gctp.in/chennai-home');
    }

    // Verify Home Page
    async verifyHomePage() {
        await expect(this.page).toHaveURL('https://gctp.in/chennai-home');
    }

    // Open Feedback Page
    async openFeedback() {
        await this.click(this.feedbackLink);
    }

    // Open Complaint Page
    async openComplaint() {
        await this.click(this.complaintLink);
    }

    // Get all images
    async getImages() {
        return this.images;
    }
}
