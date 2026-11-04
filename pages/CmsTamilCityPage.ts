import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';
import { loginToCms as loginToConfiguredCms } from '../utils/cmsLogin';

export class CmsTamilCityPage extends BasePage {
  readonly cityProfileLink: Locator;
  readonly cityProfileHeading: Locator;
  readonly cityDescription: Locator;
  readonly cityProfileImage: Locator;
  readonly topAttractionsHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.cityProfileLink = page.getByRole('link', { name: 'நகர சுயவிவரம்' });
    this.cityProfileHeading = page.getByText('நகர சுயவிவரம்').nth(2);
    this.cityDescription = page.getByText('சென்னை என்பது ஒரு பெருநகரம் மட்டுமல்ல; நவீன வாழ்க்கைக்கு அழகூட்டும் கலாச்சாரம்,');
    this.cityProfileImage = page.locator('.GCTPImg');
    this.topAttractionsHeading = page.getByRole('heading', { name: 'சிறந்த கவர்ச்சிகள்' });
  }

  async selectTamil() {
    await closeAwarenessPopup(this.page);
    const languageSelector = this.page.getByRole('combobox', { name: 'English' });
    const isTamilSelected = await this.page.getByRole('combobox', { name: 'தமிழ்' }).isVisible({ timeout: 2000 }).catch(() => false);
    if (!isTamilSelected && await languageSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await languageSelector.click();
      await this.page.getByRole('option', { name: 'தமிழ்' }).click();
    }
    await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
  }

  async openPublishedCityProfile() {
    await closeAwarenessPopup(this.page);
    await this.selectTamil();
    await expect(this.cityProfileLink).toBeVisible();
    await this.cityProfileLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async loginToCms(cmsUrl: string, username: string, password: string) {
    await loginToConfiguredCms(this.page, cmsUrl, username, password);
  }

  async openCmsCityProfile() {
    await this.page.waitForLoadState('domcontentloaded');
    if (await this.cityProfileLink.isVisible().catch(() => false)) {
      await this.cityProfileLink.click();
    }
  }

  async clickReadMore() {
    const readMoreBtn = this.page.getByText('மேலும் வாசிக்கவும்').first();
    if (await readMoreBtn.isVisible().catch(() => false)) {
      await readMoreBtn.click();
    }
  }
}
