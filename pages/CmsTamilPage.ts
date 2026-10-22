import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { tamilContent } from '../testdata/tamilContent';

export class CmsTamilPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToTamil() {
    await this.page.goto('https://gctp.in/chennai-home', {
      waitUntil: 'networkidle',
      timeout: 120000,
    });
    await this.closeAnyPopup();

    // Select Tamil
    await this.page.getByRole('combobox', { name: 'English' }).click();
    await this.page.getByRole('option', { name: 'தமிழ்' }).click();
    await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
    await this.page.waitForLoadState('networkidle');
    await this.closeAnyPopup();
  }

  async verifyHelplineTamil() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText(tamilContent.helpline.title, { exact: true })).toBeVisible();
    await expect(this.page.getByText(tamilContent.helpline.copSms, { exact: true })).toBeVisible();
    await expect(this.page.getByText(tamilContent.helpline.bandham, { exact: true })).toBeVisible();
    await expect(this.page.getByText(tamilContent.helpline.kaavalKarangal, { exact: true })).toBeVisible();
    await expect(this.page.getByText(tamilContent.helpline.womenHelpline, { exact: true })).toBeVisible();
    await expect(this.page.getByText(tamilContent.helpline.seniorCitizen, { exact: true })).toBeVisible();
  }

  async verifyTrafficUpdatesTamil() {
    await expect(this.page.getByText(tamilContent.trafficUpdates.title)).toBeVisible();
    await expect(this.page.getByText(tamilContent.trafficUpdates.helmet)).toBeVisible();
    await expect(this.page.getByText(tamilContent.trafficUpdates.pedestrian)).toBeVisible();
  }

  async verifyImportantLinksTamil() {
      await expect(this.page.getByText(tamilContent.importantLinks.tnPolice)).toBeVisible();
      await expect(this.page.getByText(tamilContent.importantLinks.parivahan)).toBeVisible();
      await expect(this.page.getByText(tamilContent.importantLinks.tnGov)).toBeVisible();
      await expect(this.page.getByText(tamilContent.importantLinks.tnrto)).toBeVisible();
  }

  async verifyFooterLinksTamil() {
      await expect(this.page.getByText(tamilContent.footer.feedback)).toBeVisible();
      await expect(this.page.getByText(tamilContent.footer.siteMap)).toBeVisible();
      await expect(this.page.getByText(tamilContent.footer.privacy)).toBeVisible();
      await expect(this.page.getByText(tamilContent.footer.complaints)).toBeVisible();
      await expect(this.page.getByText(tamilContent.footer.faq)).toBeVisible();
  }

  async verifyEmpanelmentTamil() {}
  async verifyHomePageSlidersTamil() {}
  async verifyFAQTamil() {}
  async verifyTamilLanguageSelected() {
    await expect(this.page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
  }
}
