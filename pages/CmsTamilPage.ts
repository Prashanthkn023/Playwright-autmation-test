import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { tamilContent } from '../testdata/tamilContent';
import { TestAuditLogger, AuditTestType } from '../utils/testAuditLogger';

export class CmsTamilPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToTamil() {
    await this.page.goto('https://gctp.in/chennai-home', {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await this.closeAnyPopup();

    // Select Tamil
    await this.closeAnyPopup();
    await this.page.getByRole('combobox', { name: 'English' }).click();
    await this.page.getByRole('option', { name: 'தமிழ்' }).click();
    await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
    await this.page.waitForLoadState('domcontentloaded');
    await this.closeAnyPopup();
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
      moduleName: 'CmsTamilHome',
      testType: testType === 'CONTENT' ? 'HOME_CONTENT' : testType,
      target: this.page.url(),
      item,
      expected: expectedText,
      actual: actualText.trim(),
      status: matches ? 'PASS' : 'FAIL',
    });

    return matches;
  }

  async verifyHelplineTamil(testType: AuditTestType = 'HOME_CONTENT') {
    const testName = 'Tamil – Helpline';
    await this.verifyAndLog(testName, 'Helpline Title', tamilContent.helpline.title, true, testType);
    await this.verifyAndLog(testName, 'Helpline Cop SMS', tamilContent.helpline.copSms, true, testType);
    await this.verifyAndLog(testName, 'Helpline Bandham', tamilContent.helpline.bandham, true, testType);
    await this.verifyAndLog(testName, 'Helpline Kaaval Karangal', tamilContent.helpline.kaavalKarangal, true, testType);
    await this.verifyAndLog(testName, 'Helpline Women', tamilContent.helpline.womenHelpline, true, testType);
    await this.verifyAndLog(testName, 'Helpline Senior Citizen', tamilContent.helpline.seniorCitizen, true, testType);
  }

  async verifyTrafficUpdatesTamil(testType: AuditTestType = 'HOME_CONTENT') {
    const testName = 'Tamil – Traffic Updates';
    await this.verifyAndLog(testName, 'Traffic Updates Title', tamilContent.trafficUpdates.title, true, testType);
    await this.verifyAndLog(testName, 'Traffic Updates Helmet', tamilContent.trafficUpdates.helmet, true, testType);
    await this.verifyAndLog(testName, 'Traffic Updates Pedestrian', tamilContent.trafficUpdates.pedestrian, true, testType);
  }

  async verifyImportantLinksTamil(testType: AuditTestType = 'HOME_CONTENT') {
      const testName = 'Tamil – Important Links';
      await this.verifyAndLog(testName, 'Important Links TN Police', tamilContent.importantLinks.tnPolice, true, testType);
      await this.verifyAndLog(testName, 'Important Links Parivahan', tamilContent.importantLinks.parivahan, true, testType);
      await this.verifyAndLog(testName, 'Important Links TN Gov', tamilContent.importantLinks.tnGov, true, testType);
      await this.verifyAndLog(testName, 'Important Links TN RTO', tamilContent.importantLinks.tnrto, true, testType);
  }

  async verifyFooterLinksTamil(testType: AuditTestType = 'HOME_CONTENT') {
      const testName = 'Tamil – Footer Links';
      await this.verifyAndLog(testName, 'Footer Feedback', tamilContent.footer.feedback, true, testType);
      await this.verifyAndLog(testName, 'Footer Site Map', tamilContent.footer.siteMap, true, testType);
      await this.verifyAndLog(testName, 'Footer Privacy', tamilContent.footer.privacy, true, testType);
      await this.verifyAndLog(testName, 'Footer Complaints', tamilContent.footer.complaints, true, testType);
      await this.verifyAndLog(testName, 'Footer FAQ', tamilContent.footer.faq, true, testType);
  }

  async verifyEmpanelmentTamil() {}
  async verifyFAQTamil() {}
  async verifyTamilLanguageSelected(testType: AuditTestType = 'HOME_UI') {
    const testName = 'Tamil – Language Selection';
    try {
      const combobox = this.page.getByRole('combobox', { name: 'தமிழ்' });
      await expect(combobox).toBeVisible();
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Tamil Language ComboBox',
        expected: 'தமிழ் combobox visible',
        actual: 'தமிழ் combobox visible',
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Tamil Language ComboBox',
        expected: 'தமிழ் combobox visible',
        actual: 'combobox not found',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyHomePageSlidersTamil(testType: AuditTestType = 'HOME_UI') {
    const testName = 'Tamil – Home Page Sliders';
    try {
      // The home page renders a news/hero carousel whose navigation controls are
      // <button>Previous</button> and <button>Next</button>.  These are the only
      // stable, semantic anchors for this section – no "slider" CSS class exists.
      const prevBtn = this.page.getByRole('button', { name: 'Previous' });
      const nextBtn = this.page.getByRole('button', { name: 'Next' });
      await prevBtn.waitFor({ state: 'visible', timeout: 20000 });
      await nextBtn.waitFor({ state: 'visible', timeout: 5000 });

      // Also confirm at least one hero card image is rendered inside the carousel.
      const heroImg = this.page.locator('img[alt="AI enabled Traffic Junction"]');
      const heroImgCount = await heroImg.count();
      expect(heroImgCount, 'Hero slider image should be present').toBeGreaterThan(0);

      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Home Page Slider Navigation Visibility',
        expected: 'Previous/Next carousel buttons visible with hero image',
        actual: 'Carousel buttons and hero image are visible',
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Home Page Slider Navigation Visibility',
        expected: 'Previous/Next carousel buttons visible with hero image',
        actual: 'Carousel buttons or hero image not found',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyEducationSectionTamil(testType: AuditTestType = 'HOME_UI') {
    const testName = 'Tamil – Education Section';
    try {
      const eduSection = this.page.locator('section, div').filter({ hasText: /கல்வி|Education|INFORMATION/i }).first();
      await eduSection.waitFor({ state: 'visible', timeout: 20000 });
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Education & Information Section Visibility',
        expected: 'Visible education section',
        actual: 'Education section is visible',
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Education & Information Section Visibility',
        expected: 'Visible education section',
        actual: 'Education section not visible',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyImagesLoadedTamil(testType: AuditTestType = 'HOME_UI') {
    const testName = 'Tamil – Image Loading';
    try {
      const images = this.page.locator('img[src^="https://gctp.in/"]');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          await expect(image).toHaveAttribute('src', /\S+/);
          const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
          expect(naturalWidth).toBeGreaterThan(0);
        }
      }

      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Image Loading & Source Validation',
        expected: 'Images visible with valid src and naturalWidth > 0',
        actual: `${imageCount} images verified`,
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: this.page.url(),
        item: 'Image Loading & Source Validation',
        expected: 'Images visible with valid src and naturalWidth > 0',
        actual: 'Image validation failed',
        status: 'FAIL',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyAboutUsUI(title: string, imageSelector: string) {
    await expect(this.page.getByText(title)).toBeVisible();
    await expect(this.page.locator(imageSelector)).toBeVisible();
  }
}
