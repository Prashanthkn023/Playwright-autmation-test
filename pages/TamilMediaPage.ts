import {
  APIRequestContext,
  expect,
  Locator,
  Page,
} from '@playwright/test';

export class TamilMediaPage {
  readonly mediaCards: Locator;
  readonly photosTab: Locator;
  readonly videosTab: Locator;
  readonly tamilLanguage: Locator;
  readonly englishLanguage: Locator;
  readonly tamilOption: Locator;

  constructor(private readonly page: Page) {
    this.mediaCards = page.locator('.home-hero-traffic-cardGTGC:visible');
    this.photosTab = page.getByRole('button', { name: 'புகைப்படங்கள்' });
    this.videosTab = page.getByRole('button', { name: 'காணொளிகள்' });
    this.tamilLanguage = page.getByRole('combobox', { name: 'தமிழ்' });
    this.englishLanguage = page.getByRole('combobox', { name: 'English' });
    this.tamilOption = page.getByRole('option', { name: 'தமிழ்' });
  }

  async open() {
    await this.page.goto('https://gctp.in/chennai-media');
    await this.switchToTamil();
    await expect(this.page).toHaveURL(/chennai-media$/);
  }

  async switchToTamil() {
    if (!(await this.tamilLanguage.isVisible().catch(() => false))) {
      await this.englishLanguage.click();
      await this.tamilOption.click();
    }
    await expect(this.tamilLanguage).toBeVisible();
  }

  async openPhotos() {
    await this.photosTab.click();
    await expect(this.mediaCards.first()).toBeVisible();
  }

  async openVideos() {
    await this.videosTab.click();
    await expect(this.mediaCards.first()).toBeVisible();
  }

  async expectTamilMediaContent() {
    await this.openPhotos();
    const photoContent = (await this.mediaCards
      .locator('.media-title span, .home-hero-traffic-card-des')
      .allTextContents()).join(' ');
    expect(photoContent).toMatch(/[஀-௿]/);

    await this.openVideos();
    const videoContent = (await this.mediaCards
      .locator('.media-title span, .home-hero-traffic-card-des')
      .allTextContents()).join(' ');
    expect(videoContent).toMatch(/[஀-௿]/);
  }

  async expectCardsHaveLoaded() {
    await expect.poll(() => this.mediaCards.count()).toBeGreaterThan(0);
    for (let index = 0; index < await this.mediaCards.count(); index++) {
      await this.mediaCards.nth(index).scrollIntoViewIfNeeded();
      await expect(this.mediaCards.nth(index)).toBeVisible();
    }
  }

  async expectCardsDoNotOverlap() {
    const boxes = await this.mediaCards.evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }));

    for (let first = 0; first < boxes.length; first++) {
      for (let second = first + 1; second < boxes.length; second++) {
        const overlaps = boxes[first].left < boxes[second].right &&
          boxes[first].right > boxes[second].left &&
          boxes[first].top < boxes[second].bottom &&
          boxes[first].bottom > boxes[second].top;
        expect(overlaps, `Media cards ${first + 1} and ${second + 1} overlap`).toBeFalsy();
      }
    }
  }

  async expectPhotoImagesLoaded() {
    const images = this.mediaCards.locator('img');
    await expect.poll(() => images.count()).toBeGreaterThan(0);
    for (let index = 0; index < await images.count(); index++) {
      await images.nth(index).scrollIntoViewIfNeeded();
      await expect.poll(() => images.nth(index).evaluate((image: HTMLImageElement) =>
        image.complete && image.naturalWidth > 0)).toBeTruthy();
    }
  }

  async expectVideoMediaLoaded() {
    await expect(this.mediaCards.locator('iframe, video, .mediastyles').first()).toBeVisible();
  }

  async expectMediaJourney() {
    await this.openPhotos();
    await expect.poll(() => this.mediaCards.count()).toBeGreaterThan(0);
    for (let index = 0; index < await this.mediaCards.count(); index++) {
      await this.mediaCards.nth(index).scrollIntoViewIfNeeded();
      await expect(this.mediaCards.nth(index)).toBeVisible();
      await expect(this.mediaCards.nth(index).locator('.media-title span')).toHaveText(/[஀-௿]/);
    }

    await this.openVideos();
    await expect.poll(() => this.mediaCards.count()).toBeGreaterThan(0);
    for (let index = 0; index < await this.mediaCards.count(); index++) {
      await this.mediaCards.nth(index).scrollIntoViewIfNeeded();
      await expect(this.mediaCards.nth(index)).toBeVisible();
      await expect(this.mediaCards.nth(index).locator('.media-title span')).toHaveText(/[஀-௿]/);
      await expect(this.mediaCards.nth(index).locator('iframe, video, .mediastyles').first()).toBeVisible();
    }
  }

  async compareApprovedMedia(request: APIRequestContext): Promise<number> {
    const publicMediaApi = 'https://gctp.in/api/fusion-public-facing-web-backend/media';
    const cmsMediaApi = 'https://gctp.in/api/fusion-cms-web-backend/media?approvalStatus=all';

    const [cmsResponse, publicResponse] = await Promise.all([
      request.get(cmsMediaApi, { headers: { Accept: 'application/json' } }),
      request.get(publicMediaApi, { headers: { Accept: 'application/json' } }),
    ]);

    expect(cmsResponse.ok(), `CMS Media API failed with ${cmsResponse.status()}`).toBeTruthy();
    expect(publicResponse.ok(), `Public Media API failed with ${publicResponse.status()}`).toBeTruthy();

    const normalize = (value: unknown): string =>
      String(value ?? '').replace(/\s+/g, ' ').trim();
    const payload = (responseBody: any): Record<string, unknown>[] =>
      Array.isArray(responseBody?.payload) ? responseBody.payload : [];
    const isApproved = (record: Record<string, unknown>): boolean =>
      normalize(record.f_approval_status).toUpperCase() === 'APPROVED';

    const cmsRecords = payload(await cmsResponse.json()).filter(isApproved);
    const publicRecords = payload(await publicResponse.json()).filter(record =>
      ['PHOTOS', 'VIDEOS'].includes(normalize(record.f_section).toUpperCase()));

    if (cmsRecords.length === 0) return 0;

    expect(publicRecords.length).toBeGreaterThanOrEqual(cmsRecords.length);
    for (const cmsRecord of cmsRecords) {
      const title = normalize(cmsRecord.f_title);
      const publicRecord = publicRecords.find(record => normalize(record.f_title) === title);
      expect(publicRecord, `Missing public Media record: ${title}`).toBeTruthy();
      if (!publicRecord) continue;

      expect(normalize(publicRecord.f_section).toUpperCase())
        .toBe(normalize(cmsRecord.f_section).toUpperCase());
      const cmsLinks = Array.isArray(cmsRecord.f_url) ? cmsRecord.f_url.map(normalize) : [];
      const publicLinks = Array.isArray(publicRecord.f_url) ? publicRecord.f_url.map(normalize) : [];
      if (cmsLinks.length > 0) expect(publicLinks).toEqual(cmsLinks);
    }

    return cmsRecords.length;
  }
}
