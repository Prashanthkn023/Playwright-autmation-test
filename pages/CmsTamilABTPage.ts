import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestAuditLogger, AuditTestType } from '../utils/testAuditLogger';

export class CmsTamilABTPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectTamil(testName: string = 'Language Selection', testType: AuditTestType = 'UI') {
    try {
      await this.closeAnyPopup();

      // Check if Tamil is already selected to avoid failure if the language is already switched.
      const isTamilSelected = await this.page.getByRole('combobox', { name: 'தமிழ்' }).isVisible({ timeout: 5000 }).catch(() => false);
      if (isTamilSelected) {
        console.log('Tamil is already selected as the language.');
        TestAuditLogger.log({
          testName,
          testType,
          target: this.page.url(),
          item: 'Tamil Language Selection',
          expected: 'தமிழ்',
          actual: 'தமிழ் already selected',
          status: 'PASS',
        });
        return;
      }

      const languageSelector = this.page.getByRole('combobox', { name: 'English' });

      // Wait for language selector to be visible and stable
      await expect(languageSelector).toBeVisible({ timeout: 15000 });

      // Ensure no overlay is blocking the click
      await expect(this.page.locator('.flash-popup-overlay')).toBeHidden({ timeout: 10000 }).catch(() => undefined);

      await languageSelector.click();

      const tamilOption = this.page.getByRole('option', { name: 'தமிழ்' });
      await expect(tamilOption).toBeVisible({ timeout: 10000 });

      // If an overlay appears after the menu opens, wait for it to disappear
      await expect(this.page.locator('.flash-popup-overlay')).toBeHidden({ timeout: 5000 }).catch(() => undefined);

      await tamilOption.click();

      await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible({ timeout: 10000 });

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

  async expectTamilPageContent(testName: string = 'Tamil Page Content Completeness', testType: AuditTestType = 'CONTENT') {
    try {
      const currentUrl = this.page.url();

      // Ensure content is loaded and visible
      await this.page.waitForLoadState('domcontentloaded');

      // Verify Tamil Unicode validation using /[஀-௿]/
      const bodyText = await this.page.locator('body').innerText();
      const normalizedText = bodyText.replace(/\s+/g, ' ').trim();
      expect(normalizedText.length, 'Page body must contain content').toBeGreaterThan(0);
      expect(normalizedText, 'Page must contain Tamil script unicode [஀-௿]').toMatch(/[஀-௿]/);

      if (currentUrl.includes('chennai-gctp')) {
        // Validate GCTP About Us mandatory content & sections with meaningful error messages
        await expect(this.page.getByText('கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.', { exact: false }), 'Missing mandatory GCTP Heading').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('1659 ஆம் ஆண்டு', { exact: false }), 'Missing mandatory GCTP Historical Introduction (1659 ஆம் ஆண்டு)').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByRole('heading', { name: 'புதுப்பிப்புகள்' }), 'Missing mandatory Updates Heading (புதுப்பிப்புகள்)').toBeVisible({ timeout: 15000 });

        // Validate all 3 approved update titles individually
        await expect(this.page.getByText('போக்குவரத்து போலீசார்: சேவை மற்றும் சுகாதாரத்தில் ஒரு நூற்றாண்டு', { exact: false }), 'Missing Update 1 Title').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('சென்னையில் முதல் போக்குவரத்து காவல் நிலையம்', { exact: false }), 'Missing Update 2 Title').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('பிரிட்டிஷ் இராணுவ மற்றும் நிர்வாகப் பாரம்பர்யங்கள்.', { exact: false }), 'Missing Update 3 Title').toBeVisible({ timeout: 15000 });

        // Validate all 3 update descriptions against approved CMS API descriptions
        const updateDescriptions = this.page.locator('.home-hero-traffic-card-des');
        await expect(updateDescriptions, 'Missing update descriptions container').toHaveCount(3, { timeout: 15000 });

        const expectedCmsSnippets = [
          'சென்னை இந்தியாவின் முதன்மை நகர்களில் ஒன்று',
          '1929 ஆம் ஆண்டு',
          'இந்த புகைப்படம் 1929 ஆம் ஆண்டை சார்ந்தது'
        ];

        for (let i = 0; i < 3; i++) {
          const desc = updateDescriptions.nth(i);
          await expect(desc, `Update description ${i + 1} must be visible`).toBeVisible({ timeout: 15000 });
          const descText = (await desc.textContent()) || '';
          const normalizedDescText = descText.replace(/\s+/g, ' ').trim();
          expect(normalizedDescText.length, `Update description ${i + 1} content length`).toBeGreaterThan(10);
          expect(
            normalizedDescText.includes(expectedCmsSnippets[i]),
            `Update description ${i + 1} must match approved CMS API description snippet ("${expectedCmsSnippets[i]}"). Actual: "${normalizedDescText}"`
          ).toBe(true);
        }
      } else if (currentUrl.includes('chennai-policecommissioner')) {
        // Validate Commissioner Page mandatory content
        await expect(this.page.getByText('காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து', { exact: false }), 'Missing Commissioner Heading').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('அன்புடைய சென்னை மக்களே', { exact: false }), 'Missing Commissioner Message').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('திரு டாக்டர் ஏ. அமல்ராஜ், ஐபிஎஸ்', { exact: false }), 'Missing Commissioner Name').toBeVisible({ timeout: 15000 });
      } else if (currentUrl.includes('chennai-additionalcop')) {
        // Validate Additional COP Page mandatory content
        await expect(this.page.getByText('கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து', { exact: false }), 'Missing Additional COP Heading').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('அன்புள்ள சென்னை குடிமக்களே', { exact: false }), 'Missing Additional COP Message').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('டாக்டர் பி. ஷமூந்திரேச்வரி, ஐபிஎஸ்', { exact: false }), 'Missing Additional COP Name').toBeVisible({ timeout: 15000 });
      } else if (currentUrl.includes('chennai-organogram')) {
        // Validate Organogram Page mandatory content
        await expect(this.page.getByText('அமைப்பியல்', { exact: false }), 'Missing Organogram Heading').toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('துணை காவல் ஆணையர்', { exact: false }), 'Missing Organogram Subtext').toBeVisible({ timeout: 15000 });
      }

      TestAuditLogger.log({
        testName,
        testType,
        target: currentUrl,
        item: 'Tamil Content Completeness & Script Validation',
        expected: 'All required Tamil sections, headings, updates, and script visible',
        actual: 'All mandatory sections verified visible and loaded',
        status: 'PASS',
      });
    } catch (error) {
      TestAuditLogger.log({
        testName,
        testType,
        target: this.page.url(),
        item: 'Tamil Content Completeness & Script Validation',
        expected: 'All required Tamil sections, headings, updates, and script visible',
        actual: '<content completeness check failed>',
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
