import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import fs from 'fs';
import path from 'path';

export class CmsTamilABTPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectTamil() {
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
  }

  async openTamilHome() {
    await this.page.goto('https://gctp.in/chennai-home', { waitUntil: 'domcontentloaded' });
    await this.closeAnyPopup();
    await this.selectTamil();
  }

  async openTamilAboutUsPage(menuText: string, pageUrl: string) {
    const aboutUsButton = this.page.getByRole('button', { name: 'துறை பற்றி' });
    await aboutUsButton.click();

    await this.page
      .getByRole('navigation')
      .getByText(menuText, { exact: true })
      .click();

    await expect(this.page).toHaveURL(new RegExp(`${pageUrl}$`));
    await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
  }

  logAudit(testName: string, url: string, item: string, status: 'PASS' | 'FAIL', expected: string, actual: string) {
    const logDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'cms-tamil-abt-audit.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] Test: ${testName} | URL: ${url} | Item: ${item} | Status: ${status} | Expected: ${JSON.stringify(expected)} | Actual: ${JSON.stringify(actual)}\n`, 'utf8');
  }

  async verifyAndLog(testName: string, item: string, expectedText: string, exact: boolean = true): Promise<boolean> {
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

    this.logAudit(testName, this.page.url(), item, matches ? 'PASS' : 'FAIL', expectedText, actualText.trim());
    return matches;
  }

  async expectTamilPageContent(minimumCharacters: number) {
    const bodyText = await this.page.locator('body').innerText();
    const normalizedText = bodyText.replace(/\s+/g, ' ').trim();

    expect(normalizedText.length).toBeGreaterThan(minimumCharacters);
    expect(normalizedText).toMatch(/[஀-௿]/);
  }

  async expectImagesLoaded(selector: string) {
    const images = this.page.locator(selector);
    const imageCount = await images.count();

    expect(imageCount).toBeGreaterThan(0);

    for (let index = 0; index < imageCount; index++) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute('src', /\S+/);
    }
  }
}
