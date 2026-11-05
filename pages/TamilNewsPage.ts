import { APIRequestContext, expect, Locator, Page } from '@playwright/test';

export class TamilNewsPage {
  readonly newsCards: Locator;
  readonly tamilLanguage: Locator;
  readonly englishLanguage: Locator;

  constructor(private readonly page: Page) {
    this.newsCards = page.locator('div.newsbackground:has(button)');
    this.tamilLanguage = page.getByRole('combobox', { name: 'தமிழ்' });
    this.englishLanguage = page.getByRole('combobox', { name: 'English' });
  }

  async open() {
    await this.page.goto('https://gctp.in/chennai-news-updates');
    await this.switchToTamil();
    await expect(this.page).toHaveURL(/chennai-news-updates$/);
  }

  async switchToTamil() {
    if (!(await this.tamilLanguage.isVisible().catch(() => false))) {
      await this.englishLanguage.click();
      await this.page.getByRole('option', { name: 'தமிழ்' }).click();
    }
    await expect(this.tamilLanguage).toBeVisible();
  }

  async expectTamilContent() {
    await expect.poll(() => this.newsCards.count()).toBeGreaterThan(0);
    const cardCount = await this.newsCards.count();

    for (let index = 0; index < cardCount; index++) {
      const card = this.newsCards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await expect(card.locator('h1, h2, h3').first()).toContainText(/[஀-௿]/);
      await expect(card.locator('p').first()).toContainText(/[஀-௿]/);
    }
  }

  async expectCardsAndImagesLoaded() {
    await expect.poll(() => this.newsCards.count()).toBeGreaterThan(0);
    const count = await this.newsCards.count();

    for (let index = 0; index < count; index++) {
      const card = this.newsCards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      const image = card.locator('img').first();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
        element.complete && element.naturalWidth > 0)).toBeTruthy();
    }
  }

  async expectCardsDoNotOverlap() {
    const boxes = await this.newsCards.evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }));

    for (let first = 0; first < boxes.length; first++) {
      for (let second = first + 1; second < boxes.length; second++) {
        const overlaps = boxes[first].left < boxes[second].right &&
          boxes[first].right > boxes[second].left &&
          boxes[first].top < boxes[second].bottom &&
          boxes[first].bottom > boxes[second].top;
        expect(overlaps, `News cards ${first + 1} and ${second + 1} overlap`).toBeFalsy();
      }
    }
  }

  async openNewsItem(index = 0) {
    const card = this.newsCards.nth(index);
    const title = card.locator('h1, h2, h3').first();
    const titleText = await title.innerText();
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'மேலும் வாசிக்க' }).click();
    await expect(this.page.getByText(titleText, { exact: true }).first()).toBeVisible();
  }

  async expectNewsDetailContent() {
    const detail = this.page.locator('h1, h2, h3').filter({ hasText: /[஀-௿]/ }).first();
    await expect(detail).toBeVisible();
    await expect(detail).toContainText(/[஀-௿]/);
  }

  async expectCompleteJourney() {
    await expect.poll(() => this.newsCards.count()).toBeGreaterThan(0);
    const count = await this.newsCards.count();
    for (let index = 0; index < count; index++) {
      await this.openNewsItem(index);
      await this.expectNewsDetailContent();
      await this.open();
      await expect(this.newsCards.first()).toBeVisible();
    }
  }

  async compareApprovedNews(request: APIRequestContext): Promise<number> {
    const publicApi = 'https://gctp.in/api/fusion-public-facing-web-backend/news-and-updates';
    const cmsApi = 'https://gctp.in/api/fusion-cms-web-backend/new-and-updates?approvalStatus=all';
    const [cmsResponse, publicResponse] = await Promise.all([
      request.get(cmsApi, { headers: { Accept: 'application/json' } }),
      request.get(publicApi, { headers: { Accept: 'application/json' } }),
    ]);

    expect(cmsResponse.ok(), `CMS News API failed with ${cmsResponse.status()}`).toBeTruthy();
    expect(publicResponse.ok(), `Public News API failed with ${publicResponse.status()}`).toBeTruthy();

    const normalize = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
    const payload = (body: any): Record<string, unknown>[] =>
      Array.isArray(body?.payload) ? body.payload : [];
    const cmsRecords = payload(await cmsResponse.json()).filter(record =>
      normalize(record.f_approval_status).toUpperCase() === 'APPROVED');
    const publicRecords = payload(await publicResponse.json());

    if (cmsRecords.length === 0) return 0;
    expect(publicRecords.length).toBeGreaterThanOrEqual(cmsRecords.length);

    for (const cmsRecord of cmsRecords) {
      const title = normalize(cmsRecord.f_title ?? cmsRecord.title ?? cmsRecord.heading);
      expect(publicRecords.find(record =>
        normalize(record.f_title ?? record.title ?? record.heading) === title),
      `Missing public News record: ${title}`).toBeTruthy();
    }
    return cmsRecords.length;
  }
}
