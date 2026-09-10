import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsMediaPage extends BasePage {
  readonly mediaLink: Locator;
  readonly mediaNavigationText: Locator;
  readonly photosHeading: Locator;
  readonly videosTab: Locator;
  readonly iframes: Locator;

  constructor(page: Page) {
    super(page);

    this.mediaLink = page.getByRole('link', { name: /media/i }).first();
    this.mediaNavigationText = page.getByRole('navigation').getByText('Media');
    this.photosHeading = page.getByRole('button', { name: 'PHOTOS' });
    this.videosTab = page.getByRole('button', { name: 'VIDEOS' });
    this.iframes = page.locator('iframe');
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openMedia() {
    await this.mediaLink.click();
  }

  async openVideos() {
    await this.videosTab.click();
  }

  async getIframeSource(index: number) {
    return this.iframes.nth(index).getAttribute('src');
  }
}