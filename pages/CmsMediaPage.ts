import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { loginToCms as loginToConfiguredCms } from '../utils/cmsLogin';

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

  constructor(page: Page) {
    super(page);

    this.mediaLink = page.getByRole('link', { name: /media/i }).first();
    this.mediaNavigationText = page.getByRole('navigation').getByText('Media', { exact: true });
    this.photosHeading = page.locator(
      'button:has-text("PHOTOS"), [role="tab"]:has-text("PHOTOS")'
    ).first();
    this.videosTab = page.locator(
      'button:has-text("VIDEOS"), [role="tab"]:has-text("VIDEOS")'
    ).first();
    this.iframes = page.locator('iframe');
    this.images = page.locator('img');
    this.cmsLoginEmailInput = page.locator('input[type="email"]').first();
    this.cmsLoginPasswordInput = page.locator('input[type="password"]').first();
    this.cmsLoginSubmitButton = page.getByRole('button', { name: 'Login' }).first();
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
    await this.navigate('https://cms.gctp.in/chennai-media-Cms');

    if (!/chennai-media-Cms/i.test(this.page.url())) {
      const menuButton = this.page.getByRole('button', {
        name: /Toggle navigation/i,
      });

      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click({ force: true });
      }

      const cmsMediaLink = this.page.getByRole('link', {
        name: 'Media',
        exact: true,
      }).first();

      if (await cmsMediaLink.isVisible({ timeout: 10000 }).catch(() => false)) {
        await cmsMediaLink.click({ force: true });
        await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      }
    }

    await expect(this.page).toHaveURL(
      /cms\.gctp\.in\/chennai-media(?:-Cms)?(?:$|\/)/i,
      { timeout: 30000 }
    );
  }

  async openPhotos(): Promise<boolean> {
    if (!await this.photosHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
      return false;
    }
    await this.photosHeading.click({ force: true });
    return true;
  }

  async openVideos(): Promise<boolean> {
    if (!await this.videosTab.isVisible({ timeout: 10000 }).catch(() => false)) {
      return false;
    }
    await this.videosTab.click({ force: true });
    return true;
  }

  async loginToCms(username: string, password: string) {
    await loginToConfiguredCms(
      this.page,
      'https://cms.gctp.in/',
      username,
      password
    );
  }

  async clickMediaText() {
    const mediaLink = this.page.getByRole('navigation').getByRole('link', { name: 'Media', exact: true }).first();
    await expect(mediaLink).toBeVisible({ timeout: 30000 });
    await mediaLink.click({ force: true });
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