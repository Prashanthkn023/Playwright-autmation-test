import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestAuditLogger, AuditTestType } from '../utils/testAuditLogger';

export class CmsTamilABTPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectTamil(testName: string = 'Language Selection', testType: AuditTestType = 'UI') {
    try {
      const overlay = this.page.locator('.flash-popup-overlay');
      if (await overlay.isVisible({ timeout: 3000 }).catch(() => false)) {
        const closeButton = overlay.locator('button, .flash-close-btn, [aria-label="Close"]').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
        }
        await overlay.waitFor({ state: 'hidden', timeout: 10000 });
      } else if (await overlay.count() > 0) {
        await overlay.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => undefined);
      }

      await this.closeAnyPopup();
      const languageSelector = this.page.getByRole('combobox', { name: 'English' });
      await expect(languageSelector).toBeVisible({ timeout: 10000 });
      await this.closeAnyPopup();
      await languageSelector.click();

      const tamilOption = this.page.getByRole('option', { name: 'தமிழ்' });
      await expect(tamilOption).toBeVisible({ timeout: 10000 });
      await tamilOption.click();

      await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();

      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: 'Tamil Language Selection',
        expected: 'தமிழ்',
        actual: 'தமிழ் selected',
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: 'Tamil Language Selection',
        expected: 'தமிழ்',
        actual: '<failed to select Tamil>',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async openTamilHome(testName: string = 'Open Tamil Home', testType: AuditTestType = 'UI') {
    await this.page.goto('https://gctp.in/chennai-home', { waitUntil: 'domcontentloaded' });
    await this.closeAnyPopup();
    await this.selectTamil(testName, testType);
  }

  async openTamilAboutUsPage(menuText: string, pageUrl: string, testName: string = 'Navigate About Us Page', testType: AuditTestType = 'UI') {
    try {
      const aboutUsButton = this.page.getByRole('button', { name: 'துறை பற்றி' });
      await aboutUsButton.click();

      await this.page
        .getByRole('navigation')
        .getByText(menuText, { exact: true })
        .click();

      await expect(this.page).toHaveURL(new RegExp(`${pageUrl}$`));
      await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();

      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: `Navigation to ${menuText}`,
        expected: pageUrl,
        actual: this.page.url(),
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: `Navigation to ${menuText}`,
        expected: pageUrl,
        actual: this.page.url(),
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyAndLog(testName: string, item: string, expectedText: string, exact: boolean = true, testType: AuditTestType = 'CONTENT'): Promise<boolean> {
    const locator = this.page.getByText(expectedText, { exact });
    let actualText = '';
    let matches = false;

    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      actualText = (await locator.textContent()) || '';
      const normalizedActual = actualText.replace(/\s+/g, ' ').trim();
      const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();
      matches = exact ? normalizedActual === normalizedExpected : normalizedActual.includes(normalizedExpected);
    } catch {
      actualText = '<not visible or not found>';
      matches = false;
    }

    TestAuditLogger.log({
      testName,
      testType,
      target: this.page.url(),
      item,
      expected: expectedText,
      actual: actualText.trim(),
      status: matches ? 'PASS' : 'FAIL',
    });

    return matches;
  }

  async expectTamilPageContent(minimumCharacters: number, testName: string = 'Tamil Page Content Check', testType: AuditTestType = 'UI') {
    try {
      const bodyText = await this.page.locator('body').innerText();
      const normalizedText = bodyText.replace(/\s+/g, ' ').trim();

      expect(normalizedText.length).toBeGreaterThan(minimumCharacters);
      expect(normalizedText).toMatch(/[஀-௿]/);

      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: 'Page Character Count & Tamil Script Validation',
        expected: `> ${minimumCharacters} chars & contains Tamil script`,
        actual: `${normalizedText.length} chars verified`,
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: 'Page Character Count & Tamil Script Validation',
        expected: `> ${minimumCharacters} chars & contains Tamil script`,
        actual: '<content criteria failed>',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async expectImagesLoaded(selector: string, testName: string = 'Images Loaded Check', testType: AuditTestType = 'UI') {
    try {
      const images = this.page.locator(selector);
      const imageCount = await images.count();

      expect(imageCount).toBeGreaterThan(0);

      for (let index = 0; index < imageCount; index++) {
        const image = images.nth(index);
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('src', /\S+/);
      }

      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: `Image Loading (${selector})`,
        expected: `> 0 images visible with valid src attribute`,
        actual: `${imageCount} images verified visible`,
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: `Image Loading (${selector})`,
        expected: `> 0 images visible with valid src attribute`,
        actual: '<image validation failed>',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
