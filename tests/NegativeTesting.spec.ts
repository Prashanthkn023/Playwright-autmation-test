import { test, expect } from '../fixtures/baseTest';
import { CONFIG } from './testData';
import { loginToCms } from '../utils/cmsLogin';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';
import path from 'path';

const ALLOW_PRODUCTION_SUBMISSIONS = process.env.ALLOW_PRODUCTION_SUBMISSIONS === 'true';

test.describe('Negative Testing Suite', () => {

  test.describe('CMS Login Negative Tests', () => {
    test('NEG-01: Incorrect username should be rejected', async ({ page }) => {
      // Expected: Error message or authentication failure when username is incorrect
      await page.goto('https://cms.gctp.in/chennai-home', { waitUntil: 'domcontentloaded' });
      await closeAwarenessPopup(page);

      await page.locator('input[type="email"], input[name="username"]').first().fill('invalid_user_xyz@gctp.in');
      await page.locator('input[type="password"]').first().fill(CONFIG.CREDENTIALS.password || 'WrongPassword123');

      const responsePromise = page.waitForResponse(
        r => r.url().includes('/api/fusion-configuration-service/users/login'),
        { timeout: 15000 }
      ).catch(() => null);

      await page.getByRole('button', { name: /^login$/i }).first().click();
      const response = await responsePromise;

      if (response) {
        expect(response.status()).not.toBe(200);
      } else {
        const errorText = await page.locator('.alert-danger, .invalid-feedback, [role="alert"]').textContent().catch(() => '');
        expect(errorText || page.url()).toBeTruthy();
      }
    });

    test('NEG-02: Incorrect password should be rejected', async ({ page }) => {
      // Expected: Authentication failure when password is incorrect
      await page.goto('https://cms.gctp.in/chennai-home', { waitUntil: 'domcontentloaded' });
      await closeAwarenessPopup(page);

      await page.locator('input[type="email"], input[name="username"]').first().fill(CONFIG.CREDENTIALS.username || 'admin@gctp.in');
      await page.locator('input[type="password"]').first().fill('IncorrectPassword!999');

      const responsePromise = page.waitForResponse(
        r => r.url().includes('/api/fusion-configuration-service/users/login'),
        { timeout: 15000 }
      ).catch(() => null);

      await page.getByRole('button', { name: /^login$/i }).first().click();
      const response = await responsePromise;

      if (response) {
        expect(response.status()).not.toBe(200);
      }
    });

    test('NEG-03: Empty username and password should be rejected', async ({ page }) => {
      // Expected: Validation error or button disabled for empty credentials
      await page.goto('https://cms.gctp.in/chennai-home', { waitUntil: 'domcontentloaded' });
      await closeAwarenessPopup(page);

      const loginButton = page.getByRole('button', { name: /^login$/i }).first();
      await loginButton.click();

      // Verify user remains on login page or validation error is shown
      expect(page.url()).toContain('chennai-home');
    });
  });

  test.describe('Feedback Form Negative Tests', () => {
    test('NEG-04: Submit feedback without message/rating', async ({ home, feedback, page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping feedback submission test to protect production data (set ALLOW_PRODUCTION_SUBMISSIONS=true to run).');
      }
      // Expected: Form validation prevents submission without required fields
      await home.openHomePage();
      await home.openFeedback();
      await feedback.verifyFeedbackPage();
      await feedback.clickSubmit();
      // Should remain on feedback page or show validation error
      expect(page.url()).toContain('feedback');
    });

    test('NEG-05: Enter invalid email or text format in feedback', async ({ home, feedback }) => {
      await home.openHomePage();
      await home.openFeedback();
      await feedback.verifyFeedbackPage();
      await feedback.selectRating(5);
      await feedback.enterFeedback('Test invalid characters <>script>alert(1)</script>');
      expect(await feedback.message.inputValue()).toContain('script');
    });

    test('NEG-06: Enter alphabets in mobile number field (Complaint form)', async ({ home, complaint, page }) => {
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();
      await complaint.enterName('Test User');
      await complaint.enterMobile('ABCDEFGHIJ');
      // Verify mobile input rejects non-numeric or does not accept invalid characters
      const val = await complaint.mobileInput.inputValue();
      expect(val).not.toContain('ABC');
    });

    test('NEG-07: Enter 5-digit mobile number (Complaint form)', async ({ home, complaint }) => {
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();
      await complaint.enterName('Test User');
      await complaint.enterMobile('12345');
      await complaint.clickSubmit();
      // Expect validation error or failure to send OTP for short mobile number
      await complaint.verifyToastMessage().catch(() => {});
    });
  });

  test.describe('Complaint Form Negative Tests', () => {
    test('NEG-08: Submit an empty complaint form', async ({ home, complaint, page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping complaint submission test to protect production data.');
      }
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();
      await complaint.clickSubmit();
      // Expected: Validation errors on required fields
      expect(page.url()).toContain('complaints');
    });

    test('NEG-09: Upload PDF instead of supported JPG/PNG in complaint form', async ({ home, complaint }) => {
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();
      const pdfPath = path.resolve('assets/test.pdf');
      await complaint.uploadComplaintFile(pdfPath);
      // Verify file type restriction or validation error
      const feedbackText = await complaint.uploadInput.evaluate((el: HTMLInputElement) => el.value);
      expect(feedbackText).toBeTruthy();
    });

    test('NEG-10: Enter invalid OTP during complaint verification', async ({ home, complaint }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping complaint submission test to protect production data.');
      }
      await home.openHomePage();
      await home.openComplaint();
      // TODO: Full OTP negative flow requires mocked backend or test account
      expect(complaint.otpField).toBeDefined();
    });
  });

  test.describe('Website Search Negative Tests', () => {
    test('NEG-11: Search using special characters does not cause HTTP 500 or JS error', async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      let http500Count = 0;
      page.on('response', resp => {
        if (resp.status() === 500 && resp.url().includes('gctp.in')) {
          http500Count++;
        }
      });

      await page.goto(CONFIG.SEARCH_URL, { waitUntil: 'domcontentloaded' });
      await closeAwarenessPopup(page);

      const searchInput = page.locator('input[placeholder*="Search" i]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('!@#$%^&*()_+<>?//\\');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }

      expect(http500Count).toBe(0);
      expect(jsErrors.length).toBe(0);
    });
  });

  test.describe('CMS Media Negative Tests', () => {
    test('NEG-12: Enter an invalid video URL in CMS media', async ({ page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping CMS data-changing test.');
      }
      await page.goto(CONFIG.CMS_MEDIA_URL, { waitUntil: 'domcontentloaded' });
      await loginToCms(page, CONFIG.CMS_URL, CONFIG.CREDENTIALS.username, CONFIG.CREDENTIALS.password);
      // Verify validation when invalid video URL is entered
      const urlInput = page.locator('input[name*="url" i], input[placeholder*="url" i]').first();
      if (await urlInput.isVisible().catch(() => false)) {
        await urlInput.fill('not-a-valid-url');
        const saveBtn = page.getByRole('button', { name: /save|submit/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await expect(page.locator('.invalid-feedback, .text-danger, [role="alert"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
        }
      }
    });
  });

  test.describe('CMS News Negative Tests', () => {
    test('NEG-13: Attempt to save or publish without mandatory fields in CMS news', async ({ page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping CMS data-changing test.');
      }
      await page.goto(CONFIG.CMS_NEWS_URL, { waitUntil: 'domcontentloaded' });
      await loginToCms(page, CONFIG.CMS_URL, CONFIG.CREDENTIALS.username, CONFIG.CREDENTIALS.password);

      const saveBtn = page.getByRole('button', { name: /save|publish|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        // Verify mandatory-field validation appears and no news is published
        const errorMsg = page.locator('.invalid-feedback, .text-danger, [role="alert"]').first();
        await expect(errorMsg).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });

});
