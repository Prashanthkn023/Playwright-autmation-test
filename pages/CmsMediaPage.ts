import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsMediaPage extends BasePage {
  readonly mediaLink: Locator;
  readonly mediaNavigationText: Locator;
  readonly photosHeading: Locator;
  readonly videosTab: Locator;
  readonly iframes: Locator;
  readonly images: Locator;
  readonly cmsLoginEmailInput: Locator;
  readonly cmsLoginPasswordInput: Locator;
  readonly cmsLoginSubmitButton: Locator;
  readonly cmsBaseUrl: string;

  constructor(page: Page) {
    super(page);

    this.mediaLink = page.getByRole('link', { name: /media/i }).first();
    this.mediaNavigationText = page.getByRole('navigation').getByText('Media');
    this.photosHeading = page.getByRole('button', { name: 'PHOTOS' });
    this.videosTab = page.getByRole('button', { name: 'VIDEOS' });
    this.iframes = page.locator('iframe');
    this.images = page.locator('img');
    this.cmsLoginEmailInput = page
      .locator('input[type="email"], input[type="text"], input[name*="user" i], input[name*="email" i]')
      .first();
    this.cmsLoginPasswordInput = page.locator('input[type="password"], input[name*="pass" i]').first();
    this.cmsLoginSubmitButton = page.getByRole('button', { name: /login|sign in|submit/i }).first();
    this.cmsBaseUrl = process.env.CMS_BASE_URL || 'https://cms.gctp.in';
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openMedia() {
    await this.closeAnyPopup();
    await this.mediaLink.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  }

  async openMediaPage() {
    await this.navigate('https://gctp.in/chennai-media');
  }

  async openCmsMediaPage() {
    await this.navigate(new URL('/chennai-media-Cms', this.cmsBaseUrl).toString());
  }

  async openPhotos() {
    await this.photosHeading.click();
  }

  async openVideos() {
    await this.videosTab.click();
  }

  async loginToCms(username: string, password: string) {
    await this.openCmsMediaPage();
    await this.cmsLoginEmailInput.fill(username);
    await this.cmsLoginPasswordInput.fill(password);
    await this.cmsLoginSubmitButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  }

  async clickMediaText() {
    const mediaText = this.page
      .getByRole('navigation')
      .getByText('Media', { exact: true })
      .first();
    await expect(mediaText).toBeVisible({ timeout: 30000 });
    await mediaText.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
    await this.closeAnyPopup();
  }

  async expectPhotoTitlesVisible(titles: string[]) {
    for (const title of titles) {
      await expect(this.page.getByText(title, { exact: true })).toBeVisible();
    }
  }

  async expectVideoIframesVisible() {
    await expect(this.iframes).toHaveCount(2);
    await expect(this.iframes.nth(0)).toBeVisible();
    await expect(this.iframes.nth(1)).toBeVisible();
  }

  async getIframeSource(index: number) {
    return this.iframes.nth(index).getAttribute('src');
  }

  async expectLoadedImagesVisible() {
    const count = await this.images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const size = await this.images.nth(i).evaluate((node: HTMLImageElement) => ({
        width: node.naturalWidth,
        height: node.naturalHeight,
      }));
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
  }
}