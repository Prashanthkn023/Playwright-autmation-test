import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';
import Tesseract from 'tesseract.js';

function extractOtp(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const response = payload as Record<string, unknown>;

  // Inspect fields that explicitly represent an OTP.
  for (const key of [
    'otp',
    'OTP',
    'code',
    'verificationCode',
    'otpCode',
  ]) {
    const value = response[key];

    if (typeof value === 'string' || typeof value === 'number') {
      const candidate = String(value).trim();

      if (/^\d{4,8}$/.test(candidate)) {
        return candidate;
      }
    }
  }

  // Search common nested response objects.
  for (const key of ['data', 'payload', 'result']) {
    const nested = response[key];

    if (nested && typeof nested === 'object') {
      const candidate = extractOtp(nested);

      if (candidate) {
        return candidate;
      }
    }
  }

  return '';
}

export class ComplaintPage extends BasePage {

  private complaintApiResponse?: {
    url: string;
    status: number;
    body: unknown;
  };

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
  readonly captchaBox: Locator;
  readonly captchaInput: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'COMPLAINTS'
    });

    this.nameInput =
      page.getByPlaceholder(
        'Enter Your Name'
      );

    this.mobileInput =
      page.getByPlaceholder(
        'Enter 10-digit mobile number'
      );

    this.incidentType =
      page.locator('select').nth(0);

    this.incidentSubType =
      page.locator('select').nth(1);

    this.uploadInput =
      page.locator(
        'input[type="file"]'
      );

    this.locationInput =
      page.getByPlaceholder(
        'Search Location...'
      );

    this.locationSuggestion =
      page.locator(
        'li.gis-item'
      ).first();

    this.complaintMessage =
      page.getByPlaceholder(
        'Type your message...'
      );

    this.submitButton =
      page.getByRole(
        'button',
        {
          name: 'Submit'
        }
      );

    this.toastMessage =
      page.locator(
        '.MuiAlert-message'
      ).first();

    this.otpField =
      page.getByPlaceholder(
        'Enter OTP'
      );

    this.verifyButton =
      page.getByRole(
        'button',
        {
          name: 'Verify & Submit'
        }
      );

    this.successMessage =
      page
        .getByText(
          /Complaint submitted successfully|submitted successfully|success/i
        )
        .first();

    /*
     * If multiple CAPTCHA canvas elements are present,
     * use the LAST visible CAPTCHA.
     */
    this.captchaBox =
      page.locator('#canv').last();

    this.captchaInput =
      page.getByPlaceholder(
        'Enter Captcha'
      );
  }

  async verifyComplaintPage(): Promise<void> {
    await expect(
      this.heading
    ).toBeVisible({
      timeout: 15000
    });
  }

  async enterName(
    name: string
  ): Promise<void> {
    await this.nameInput.fill(
      name
    );
  }

  async enterMobile(
    mobile: string
  ): Promise<void> {
    await this.mobileInput.fill(
      mobile
    );
  }

  async selectIncident(
    type: string,
    subType: string
  ): Promise<void> {
    await this.incidentType.selectOption({
      label: type
    });

    await this.incidentSubType.selectOption({
      label: subType
    });
  }

  async enterComplaint(
    message: string
  ): Promise<void> {
    await this.complaintMessage.fill(
      message
    );
  }

  async waitForCaptcha(
    seconds: number = 20
  ): Promise<void> {
    try {

      /*
       * Wait until the latest CAPTCHA
       * becomes visible.
       */
      await this.captchaBox.waitFor({
        state: 'visible',
        timeout: 15000
      });

      /*
       * Small wait to make sure the CAPTCHA
       * image/canvas has finished rendering.
       */
      await this.page.waitForTimeout(
        1000
      );

      const captchaPath =
        path.join(
          process.cwd(),
          'complaint-captcha.png'
        );

      /*
       * Capture the LAST CAPTCHA canvas.
       */
      await this.captchaBox.screenshot({
        path: captchaPath
      });

      console.log(
        'CAPTCHA screenshot saved:',
        captchaPath
      );

      const result =
        await Tesseract.recognize(
          captchaPath,
          'eng'
        );

      let captchaText =
        result.data.text
          .replace(
            /ReloadCaptcha/gi,
            ''
          )
          .replace(
            /\s/g,
            ''
          )
          .replace(
            /[^a-zA-Z0-9]/g,
            ''
          )
          .trim();

      /*
       * CAPTCHA is expected to be
       * maximum 6 characters.
       */
      if (
        captchaText.length > 6
      ) {
        captchaText =
          captchaText.substring(
            0,
            6
          );
      }

      console.log(
        'Detected CAPTCHA:',
        captchaText
      );

      if (
        captchaText
      ) {

        await this.captchaInput.fill(
          captchaText
        );

        console.log(
          'CAPTCHA entered successfully.'
        );

      } else {

        console.log(
          `CAPTCHA could not be detected. Please enter CAPTCHA manually within ${seconds} seconds`
        );

        await this.page.waitForTimeout(
          seconds * 1000
        );
      }

    } catch (error) {

      console.log(
        'CAPTCHA detection failed:',
        error
      );

      console.log(
        `Please enter CAPTCHA manually within ${seconds} seconds`
      );

      await this.page.waitForTimeout(
        seconds * 1000
      );
    }
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async verifyToastMessage(): Promise<void> {
    await expect(
      this.toastMessage
    ).toBeVisible({
      timeout: 30000
    });

    console.log(
      'Toast Message:',
      await this.toastMessage.textContent()
    );
  }

  async uploadComplaintFile(
    filePath: string
  ): Promise<void> {
    await this.uploadInput.setInputFiles(
      filePath
    );
  }

  async selectLocation(
    location: string
  ): Promise<void> {

    await this.locationInput.fill(
      location
    );

    await this.page.waitForTimeout(
      3000
    );

    const count =
      await this.locationSuggestion.count();

    if (
      count > 0
    ) {
      await this.locationSuggestion.click();
    }
  }

  async clickVerifySubmit(): Promise<void> {
    await this.verifyButton.click();
  }

  async validateComplaintApiResponse(): Promise<void> {
    expect(
      this.complaintApiResponse,
      'Complaint API response was not captured'
    ).toBeDefined();

    expect(
      this.complaintApiResponse!.status,
      `Complaint API request failed: ${this.complaintApiResponse!.url}`
    ).toBeGreaterThanOrEqual(200);

    expect(
      this.complaintApiResponse!.status
    ).toBeLessThan(300);

    expect(
      this.complaintApiResponse!.body,
      'Complaint API returned an empty response body'
    ).toBeTruthy();

    console.log(
      'Complaint API validation passed:',
      this.complaintApiResponse
    );
  }

  async verifyOTPResult(): Promise<void> {
    try {

      await this.successMessage.waitFor({
        state: 'visible',
        timeout: 30000
      });

      console.log(
        await this.successMessage.textContent()
      );

    } catch {

      const toastText = await this.toastMessage
        .textContent({ timeout: 5000 })
        .catch(() => '');

      if (
        toastText &&
        /invalid otp/i.test(
          toastText
        )
      ) {

        throw new Error(
          `Complaint submission failed due to invalid OTP: ${toastText}`
        );
      }

      throw new Error(
        `Complaint submission failed: no success response was rendered${toastText ? ` (${toastText.trim()})` : '.'}`
      );
    }
  }

  async submitComplaint(data: {
    name: string;
    mobile: string;
    incidentType: string;
    incidentSubType: string;
    location: string;
    message: string;
  }): Promise<void> {

    try {

      /*
       * Verify Complaint page.
       */
      await this.verifyComplaintPage();

      /*
       * Enter Name.
       */
      await this.enterName(
        data.name
      );

      /*
       * Enter Mobile.
       */
      await this.enterMobile(
        data.mobile
      );

      /*
       * Select Incident Type
       * and Sub Type.
       */
      await this.selectIncident(
        data.incidentType,
        data.incidentSubType
      );

      /*
       * Upload Complaint File.
       */
      await this.uploadComplaintFile(
        path.join(
          __dirname,
          '..',
          'assets',
          'test.jpg'
        )
      );

      /*
       * Select Location.
       */
      await this.selectLocation(
        data.location
      );

      /*
       * Enter Complaint Message.
       */
      await this.enterComplaint(
        data.message
      );

      /*
       * Wait for the SECOND/LATEST CAPTCHA
       * after all details are entered.
       */
      await this.waitForCaptcha(
        20
      );

      const otpResponsePromise = this.page.waitForResponse(
        response =>
          response.url().includes('/citizen/login') &&
          response.request().method() === 'POST',
        { timeout: 30000 }
      );

      /*
       * Submit the complaint form and capture the citizen login response.
       */
      await this.clickSubmit();
      await this.verifyToastMessage();

      const otpResponse = await otpResponsePromise;

      if (!otpResponse.ok()) {
        throw new Error(
          `Citizen login API failed: HTTP ${otpResponse.status()}`
        );
      }

      let otpResponseBody: unknown;

      try {
        otpResponseBody = await otpResponse.json();
      } catch {
        const responseText = await otpResponse.text().catch(() => '');
        throw new Error(
          `Citizen login API did not return JSON. Response: ${responseText.slice(0, 300)}`
        );
      }

      const otp = extractOtp(otpResponseBody);

      if (!otp) {
        console.log(
          'Citizen login API response:',
          JSON.stringify(otpResponseBody, null, 2)
        );

        throw new Error(
          'The citizen login API response does not contain a numeric OTP. ' +
          'The response appears to contain a status message only. ' +
          'Use an approved test-only OTP retrieval mechanism or configure ' +
          'the test API to return an OTP field.'
        );
      }

      /*
       * Automatically enter the OTP returned by the API.
       */
      await this.otpField.waitFor({
        state: 'visible',
        timeout: 30000,
      });

      await this.otpField.fill(otp);
      await expect(this.otpField).toHaveValue(otp);

      console.log('OTP retrieved from API and entered successfully.');

      /*
       * Verify and Submit.
       */
      const complaintResponsePromise =
        this.page.waitForResponse(
          response =>
            response.request().method() === 'POST' &&
            !response.url().includes('/citizen/login'),
          {
            timeout: 30000
          }
        );

      await this.clickVerifySubmit();

      const complaintResponse =
        await complaintResponsePromise;

      let complaintResponseBody: unknown;

      try {
        complaintResponseBody = await complaintResponse.json();
      } catch {
        complaintResponseBody = await complaintResponse.text();
      }

      this.complaintApiResponse = {
        url: complaintResponse.url(),
        status: complaintResponse.status(),
        body: complaintResponseBody
      };

      /*
       * Verify final result.
       */
      await this.verifyOTPResult();

    } catch (error) {

      throw new Error(
        `Complaint submission failed: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }
}