import { expect, type Page } from '@playwright/test';
import { tamilContactUsLabels, tamilContactUsRoute } from './tamilContactUsLabels';
import { closeAwarenessPopup } from '../../utils/closeAwarenessPopup';

export class TamilContactUsPage {
  constructor(private readonly page: Page) {}

  private async dismissPopup() {
    await closeAwarenessPopup(this.page);
  }

  async openInTamil() {
    await this.page.goto('/');
    await this.dismissPopup();

    await this.page.locator('#language-select').click();
    await this.page.getByRole('option', { name: tamilContactUsLabels.language }).click();

    // Wait for navigation stability
    const contactLink = this.page.getByRole('link', { name: tamilContactUsLabels.navigation });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(this.page).toHaveURL(new RegExp(`${tamilContactUsRoute}$`));
  }

  async openFromTamilHome() {
    const homeLink = this.page.getByRole('link', { name: tamilContactUsLabels.home });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await this.page.waitForURL(/\/chennai-home$/);

    await this.dismissPopup();

    const contactLink = this.page.getByRole('link', { name: tamilContactUsLabels.navigation });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(this.page).toHaveURL(new RegExp(`${tamilContactUsRoute}$`));
  }

  get table() {
    return this.page.locator('table').first();
  }
}
