import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';

export class ComplaintPage extends BasePage {

    readonly heading: Locator;
    readonly nameInput: Locator;
    readonly mobileInput: Locator;
    readonly incidentType: Locator;
    readonly incidentSubType: Locator;
    readonly uploadInput: Locator;
    readonly locationInput: Locator;
    readonly locationSuggestion: Locator;
    readonly complaintMessage: Locator;
    readonly submitButton: Locator;
    readonly toastMessage: Locator;
    readonly otpField: Locator;
    readonly verifyButton: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'COMPLAINTS' });

        this.nameInput = page.getByPlaceholder('Enter Your Name');

        this.mobileInput = page.getByPlaceholder('Enter 10-digit mobile number');

        this.incidentType = page.locator('select').nth(0);

        this.incidentSubType = page.locator('select').nth(1);

        this.uploadInput = page.locator('input[type="file"]');

        this.locationInput = page.getByPlaceholder('Search Location...');

        this.locationSuggestion = page.locator('li.gis-item').first();

        this.complaintMessage = page.getByPlaceholder('Type your message...');

        this.submitButton = page.getByRole('button', { name: 'Submit' });

        this.toastMessage = page.locator('.MuiAlert-message').first();

        this.otpField = page.getByPlaceholder('Enter OTP');

        this.verifyButton = page.getByRole('button', { name: 'Verify & Submit' });

        this.successMessage = page
            .getByText(/Complaint submitted successfully|submitted successfully|success/i)
            .first();
    }

    // Verify Complaint Page
    async verifyComplaintPage() {
        await expect(this.heading).toBeVisible();
    }

    // Enter Name
    async enterName(name: string) {
        await this.nameInput.fill(name);
    }

    // Enter Mobile
    async enterMobile(mobile: string) {
        await this.mobileInput.fill(mobile);
    }

    // Select Incident
    async selectIncident(type: string, subType: string) {
        await this.incidentType.selectOption({ label: type });
        await this.incidentSubType.selectOption({ label: subType });
    }

    // Upload File (PNG, JPG, or PDF)
    async uploadFile(locator: Locator, filePath: string) {
        const resolvedFilePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(__dirname, '../assets', filePath);
        await locator.setInputFiles(resolvedFilePath);
    }

    // Select Location
    async selectLocation(location: string) {
        await this.locationInput.fill(location);
        await this.locationSuggestion.waitFor({ state: 'visible' });
        await this.locationSuggestion.click();
    }

    // Enter Complaint
    async enterComplaint(message: string) {
        await this.complaintMessage.fill(message);
    }

    // Wait for CAPTCHA (manual entry required)
    async waitForCaptcha(seconds: number = 20) {

        console.log(`Please enter CAPTCHA within ${seconds} seconds`);

        await this.page.waitForTimeout(seconds * 1000);
    }

    // Click Submit
    async clickSubmit() {
        await this.submitButton.click();
    }

    // Verify Toast
    async verifyToastMessage() {
        await expect(this.toastMessage).toBeVisible({ timeout: 10000 });

        const text = await this.toastMessage.textContent();
        console.log("Toast:", text);
    }

    // Verify OTP Field
    async verifyOTPField() {
        await expect(this.otpField).toBeVisible({ timeout: 10000 });

        console.log("OTP field displayed.");
    }

    // Wait for OTP (manual entry required)
    async waitForOTP(seconds: number = 20) {

        console.log(`Please enter OTP within ${seconds} seconds`);

        await this.page.waitForTimeout(seconds * 1000);
    }

    // Verify & Submit
    async clickVerifySubmit() {
        await this.verifyButton.click();
    }

    // Verify Success
    async verifyComplaintSuccess() {
        await expect(this.successMessage).toBeVisible({ timeout: 10000 });

        const text = await this.successMessage.textContent();
        console.log("Complaint submitted successfully.");
        console.log(text);
    }

    // Complete Complaint Flow
    async submitComplaint(data: {
        name: string;
        mobile: string;
        incidentType: string;
        incidentSubType: string;
        location: string;
        message: string;
    }) {
        try {
            await this.verifyComplaintPage();

            await this.enterName(data.name);

            await this.enterMobile(data.mobile);

            await this.selectIncident(data.incidentType, data.incidentSubType);

            await this.uploadFile(this.uploadInput, 'test.png');

            await this.selectLocation(data.location);

            await this.enterComplaint(data.message);

            await this.waitForCaptcha(20);

            await this.clickSubmit();

            await this.verifyToastMessage();

            await this.verifyOTPField();

            await this.waitForOTP(20);

            await this.clickVerifySubmit();

            await this.verifyComplaintSuccess();
        } catch (error) {
            throw new Error(`Complaint submission failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}