import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';
import Tesseract from 'tesseract.js';

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

      const toastText =
        await this.toastMessage.textContent();

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
        'Complaint submission failed: Unknown OTP result.'
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

      /*
       * Listen for OTP API response
       * before clicking Submit.
       */
      const otpPromise =
        new Promise<string>(
          (resolve) => {

            this.page.on(
              'response',
              async (
                response
              ) => {

                if (
                  response
                    .url()
                    .includes(
                      '/citizen/login'
                    ) &&
                  response
                    .request()
                    .method() ===
                    'POST'
                ) {

                  try {

                    const json =
                      await response.json();

                    const otpPayload =
                      json?.payload;

                    if (
                      otpPayload
                    ) {

                      console.log(
                        'Captured OTP after captcha submit:',
                        otpPayload
                      );

                      resolve(
                        otpPayload
                      );
                    }

                  } catch {
                    // Ignore invalid/non-JSON response
                  }
                }
              }
            );
          }
        );

      /*
       * Submit Complaint.
       */
      await this.clickSubmit();

      /*
       * Verify Toast Message.
       */
      await this.verifyToastMessage();

      /*
       * Get OTP from API response.
       */
      const otpPayload =
        await otpPromise;

      /*
       * Enter OTP.
       */
      await this.otpField.fill(
        otpPayload
      );

      /*
       * Verify and Submit.
       */
      await this.clickVerifySubmit();

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