import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FeedbackPage extends BasePage {

    readonly feedbackHeading: Locator;
    readonly stars: Locator;
    readonly message: Locator;
    readonly submitButton: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);

        this.feedbackHeading = page.getByRole('heading', { name: 'FEEDBACK' });

        this.stars = page.locator('.star-rating .star');

        this.message = page.getByPlaceholder('Your Message*');

        this.submitButton = page.getByRole('button', { name: 'Submit' });

        this.successMessage = page.getByText('Feedback submitted successfully!');
    }

    // Verify Feedback Page
    async verifyFeedbackPage() {
        await expect(this.feedbackHeading).toBeVisible();
    }

    // Select Rating
    async selectRating(rating: number) {

        const totalStars = await this.stars.count();

        if (rating < 1 || rating > totalStars) {
            throw new Error(`Invalid Rating : ${rating}`);
        }

        await this.stars.nth(rating - 1).click();

        console.log(`${rating} Star Selected`);
    }

    // Enter Feedback Message
    async enterFeedback(message: string) {
        await this.message.fill(message);
    }

    // Wait for Manual Captcha
    async waitForCaptcha(seconds: number = 20) {

        console.log(
            `Please enter captcha manually within ${seconds} seconds`
        );

        await this.page.waitForTimeout(seconds * 1000);
    }

    // Click Submit
    async clickSubmit() {
        await this.submitButton.click();
    }

    // Verify Success Message
    async verifySuccess() {

        await expect(this.successMessage)
            .toBeVisible({ timeout: 10000 });

        console.log(await this.successMessage.textContent());
    }
}