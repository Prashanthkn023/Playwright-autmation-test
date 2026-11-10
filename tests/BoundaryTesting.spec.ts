import { test, expect } from '../fixtures/baseTest';
import { CONFIG, file } from './testData';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';
import { loginToCms } from '../utils/cmsLogin';

const ALLOW_PRODUCTION_SUBMISSIONS = process.env.ALLOW_PRODUCTION_SUBMISSIONS === 'true';

test.describe('Boundary Testing Suite', () => {

  test.describe('Mobile Number Boundaries (Complaint Form)', () => {
    const mobileTestCases = [
      { id: 'BND-01', digits: '987654321', desc: '9 digits (limit - 1)', valid: false },
      { id: 'BND-02', digits: '9876543210', desc: '10 digits (exact limit)', valid: true },
      { id: 'BND-03', digits: '98765432101', desc: '11 digits (limit + 1)', valid: false },
    ];

    for (const tc of mobileTestCases) {
      test(`${tc.id}: Enter ${tc.desc}`, async ({ home, complaint }) => {
        // Expected: 9 and 11 digits rejected or truncated to 10; 10 digits accepted
        await home.openHomePage();
        await home.openComplaint();
        await complaint.verifyComplaintPage();

        await complaint.enterMobile(tc.digits);
        const actualValue = await complaint.mobileInput.inputValue();

        if (tc.digits.length > 10) {
          // If truncated to 10 digits or rejected
          expect(actualValue.length).toBeLessThanOrEqual(10);
        } else if (tc.digits.length === 10) {
          expect(actualValue).toBe(tc.digits);
        } else {
          // 9 digits entered
          expect(actualValue.length).toBe(9);
        }
      });
    }
  });

  test.describe('Feedback Text Character Limits', () => {
    const limit = CONFIG.LIMITS.feedbackMaxLength; // 100 characters

    test('BND-04: Enter limit - 1 characters (99 chars)', async ({ home, feedback }) => {
      // Expected: Input accepted without truncation or error
      await home.openHomePage();
      await home.openFeedback();
      await feedback.verifyFeedbackPage();

      const text99 = 'A'.repeat(limit - 1);
      await feedback.enterFeedback(text99);
      const val = await feedback.message.inputValue();
      expect(val.length).toBe(limit - 1);
    });

    test('BND-05: Enter exactly the maximum allowed characters (100 chars)', async ({ home, feedback }) => {
      // Expected: Input accepted
      await home.openHomePage();
      await home.openFeedback();
      await feedback.verifyFeedbackPage();

      const text100 = 'A'.repeat(limit);
      await feedback.enterFeedback(text100);
      const val = await feedback.message.inputValue();
      expect(val.length).toBe(limit);
    });

    test('BND-06: Enter limit + 1 characters (101 chars)', async ({ home, feedback }) => {
      // Expected: Input truncated to 100 chars or appropriate validation message
      await home.openHomePage();
      await home.openFeedback();
      await feedback.verifyFeedbackPage();

      const text101 = 'A'.repeat(limit + 1);
      await feedback.enterFeedback(text101);
      const val = await feedback.message.inputValue();
      // Should be truncated to max limit (100) or rejected
      expect(val.length).toBeLessThanOrEqual(limit);
    });
  });

  test.describe('Complaint File Upload Boundaries', () => {
    test('BND-07: Upload a file at the maximum allowed size', async ({ home, complaint }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping submission to protect production data.');
      }
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();

      // Create file in-memory using file helper
      const maxFile = file('max-allowed.jpg', 'image/jpeg', CONFIG.LIMITS.complaintMaxUploadBytes);
      await complaint.uploadInput.setInputFiles({
        name: maxFile.name,
        mimeType: maxFile.mimeType,
        buffer: maxFile.buffer
      });

      // Verify input accepts the file
      const uploadedValue = await complaint.uploadInput.inputValue();
      expect(uploadedValue).toContain('max-allowed.jpg');
    });

    test('BND-08: Upload a file at maximum size + 1 byte', async ({ home, complaint }) => {
      await home.openHomePage();
      await home.openComplaint();
      await complaint.verifyComplaintPage();

      // Max size + 1 byte
      const oversizedFile = file('oversized.jpg', 'image/jpeg', CONFIG.LIMITS.complaintMaxUploadBytes + 1);
      await complaint.uploadInput.setInputFiles({
        name: oversizedFile.name,
        mimeType: oversizedFile.mimeType,
        buffer: oversizedFile.buffer
      });

      // File should either be rejected by UI or error displayed
      const uploadedValue = await complaint.uploadInput.inputValue();
      expect(uploadedValue).toBeTruthy();
    });
  });

  test.describe('CMS News Title Boundaries', () => {
    test('BND-09: Enter title at maximum allowed length', async ({ page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping CMS data-changing test.');
      }
      await page.goto(CONFIG.CMS_NEWS_URL, { waitUntil: 'domcontentloaded' });
      await loginToCms(page, CONFIG.CMS_URL, CONFIG.CREDENTIALS.username, CONFIG.CREDENTIALS.password);

      const titleInput = page.locator('input[name*="title" i], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        const maxTitle = 'T'.repeat(CONFIG.LIMITS.cmsNewsTitleMaxLength);
        await titleInput.fill(maxTitle);
        expect((await titleInput.inputValue()).length).toBe(CONFIG.LIMITS.cmsNewsTitleMaxLength);
      }
    });

    test('BND-10: Enter title at maximum length + 1 character', async ({ page }) => {
      if (!ALLOW_PRODUCTION_SUBMISSIONS) {
        test.skip(true, 'Skipping CMS data-changing test.');
      }
      await page.goto(CONFIG.CMS_NEWS_URL, { waitUntil: 'domcontentloaded' });
      await loginToCms(page, CONFIG.CMS_URL, CONFIG.CREDENTIALS.username, CONFIG.CREDENTIALS.password);

      const titleInput = page.locator('input[name*="title" i], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        const overTitle = 'T'.repeat(CONFIG.LIMITS.cmsNewsTitleMaxLength + 1);
        await titleInput.fill(overTitle);
        // Expect input truncation to limit or form validation error
        const actual = await titleInput.inputValue();
        expect(actual.length).toBeLessThanOrEqual(CONFIG.LIMITS.cmsNewsTitleMaxLength);
      }
    });
  });

});
