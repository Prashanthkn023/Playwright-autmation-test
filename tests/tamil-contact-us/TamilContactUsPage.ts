import { expect, type Page } from '@playwright/test';
import { tamilContactUsLabels, tamilContactUsRoute } from './tamilContactUsLabels';

export class TamilContactUsPage {
  constructor(private readonly page: Page) {}

  async openInTamil() {
    await this.page.goto('/chennai-home');
    const awarenessClose = this.page.getByRole('button', { name: '✕' });
    if (await awarenessClose.isVisible()) await awarenessClose.click();
    await this.page.locator('#language-select').click();
    await this.page.getByRole('option', { name: tamilContactUsLabels.language }).click();
    const contactLink = this.page.getByRole('link', { name: tamilContactUsLabels.navigation });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(this.page).toHaveURL(new RegExp(`${tamilContactUsRoute}$`));
  }

  async openFromTamilHome() {
    const homeLink = this.page.getByRole('link', { name: tamilContactUsLabels.home });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(this.page).toHaveURL(/\/chennai-home$/);
    const awarenessClose = this.page.getByRole('button', { name: '✕' });
    if (await awarenessClose.isVisible()) await awarenessClose.click();
    const contactLink = this.page.getByRole('link', { name: tamilContactUsLabels.navigation });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(this.page).toHaveURL(new RegExp(`${tamilContactUsRoute}$`));
  }

  get table() {
    return this.page.locator('table').first();
  }
}
