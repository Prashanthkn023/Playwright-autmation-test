import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import Tesseract from 'tesseract.js';

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

    // Solve Captcha Automatically
    async waitForCaptcha() {

        await this.page.locator('#canv').screenshot({
            path: 'captcha.png'
        });

        const result = await Tesseract.recognize(
            'captcha.png',
            'eng'
        );

        const captchaText =
            result.data.text
                .replace(/\s/g, '')
                .trim();

        console.log(
            `Captcha : ${captchaText}`
        );

        await this.page
            .locator(
                'input[name="user_captcha_input"]'
            )
            .fill(captchaText);
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