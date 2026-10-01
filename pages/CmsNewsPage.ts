import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

const publicBaseUrl = (process.env.BASE_URL || 'https://gctp.in').replace(/\/+$/, '');
const cmsBaseUrl = (process.env.CMS_BASE_URL || 'https://cms.gctp.in').replace(/\/+$/, '');

export type NewsRecord = {
  title: string;
  description: string;
  image: string;
  detailTitle: string;
  detailBody: string;
  detailImage: string;
};

export class CmsNewsPage extends BasePage {
  readonly cmsNewsUrl = `${cmsBaseUrl}/chennai-news-updates-Cms`;
  readonly cmsListingUrl = `${cmsBaseUrl}/chennai-news-updates`;
  readonly publicNewsUrl = `${publicBaseUrl}/chennai-news-updates`;
  readonly newsLink: Locator;
  readonly trafficDiversionHeading: Locator;
  readonly trafficDiversionDescription: Locator;
  readonly trafficDiversionImage: Locator;
  readonly trafficDiversionReadMoreButton: Locator;
  readonly pendingEChallanHeading: Locator;
  readonly pendingEChallanDescription: Locator;
  readonly pendingEChallanImage: Locator;
  readonly pendingEChallanReadMoreButton: Locator;
  readonly megaBikeRallyHeading: Locator;
  readonly megaBikeRallyDescription: Locator;
  readonly megaBikeRallyImage: Locator;
  readonly megaBikeRallyReadMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    this.newsLink = page.getByRole('link', { name: 'News' });

    this.trafficDiversionHeading = page.getByRole('heading', {
      name: /Traffic Diversion and U-Turn Restrictions in OMR and Thuraipakkam Area/i,
    });
    this.trafficDiversionDescription = page
      .locator('div, p')
      .filter({ hasText: 'To reduce traffic congestion and improve vehicular movement' })
      .first();
    const trafficDiversionSection = page
      .locator('section')
      .filter({ has: this.trafficDiversionHeading });
    const trafficDiversionCard = trafficDiversionSection.locator(
      'div.backgroundtail'
    );
    this.trafficDiversionImage = trafficDiversionSection.locator(
      'img.news-card-image'
    );
    this.trafficDiversionReadMoreButton = trafficDiversionCard.getByRole('button', {
      name: 'Read More',
    });

    this.pendingEChallanHeading = page.getByRole('heading', {
      name: /Pending E-Challan Fine Verification/i,
    });
    this.pendingEChallanDescription = page
      .locator('div, p')
      .filter({ hasText: 'Verify and clear your pending e-Challans' })
      .first();
    const pendingEChallanSection = page
      .locator('section')
      .filter({ has: this.pendingEChallanHeading });
    const pendingEChallanCard = pendingEChallanSection.locator(
      'div.backgroundtail'
    );
    this.pendingEChallanImage = pendingEChallanSection.locator(
      'img.news-card-image'
    );
    this.pendingEChallanReadMoreButton = pendingEChallanCard.getByRole('button', {
      name: 'Read More',
    });

    this.megaBikeRallyHeading = page.getByRole('heading', {
      name: /Mega Bike Rally for Road Safety/i,
    });
    this.megaBikeRallyDescription = page
      .locator('div, p')
      .filter({ hasText: 'Mega Bike Rally for Road Safety' })
      .filter({ hasText: 'scheduled for early 2026' })
      .first();
    const megaBikeRallySection = page
      .locator('section')
      .filter({ has: this.megaBikeRallyHeading });
    const megaBikeRallyCard = megaBikeRallySection.locator('div.backgroundtail');
    this.megaBikeRallyImage = megaBikeRallySection.locator(
      'img.news-card-image'
    );
    this.megaBikeRallyReadMoreButton = megaBikeRallyCard.getByRole('button', {
      name: 'Read More',
    });
  }

  async openHomePage() {
    await this.navigate(`${publicBaseUrl}/chennai-home`);
  }

  async openNewsPage() {
    await this.navigate(this.publicNewsUrl);
  }

  private normalizeText(value: string | null | undefined) {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }

  private normalizeImage(value: string | null | undefined) {
    const source = (value ?? '').trim();
    return source ? source.split('?')[0].split('/').pop() ?? source : '';
  }

  async closeAwarenessPopup() {
    const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible';

    for (let attempt = 0; attempt < 5; attempt++) {
      const popup = this.page.locator(popupSelector).first();
      if (!(await popup.isVisible({ timeout: attempt === 0 ? 5000 : 1000 }).catch(() => false))) {
        return;
      }

      await popup.locator('.flash-close-btn').first().click({ force: true });
      await expect(this.page.locator(popupSelector)).toHaveCount(0, { timeout: 5000 }).catch(() => undefined);
    }

    await expect(this.page.locator(popupSelector)).toHaveCount(0, { timeout: 10000 });
  }

  async loginToCms(username: string, password: string) {
    await this.page.goto(this.cmsNewsUrl);
    await this.page.getByRole('textbox', { name: 'example@gmail.com' }).fill(username);
    await this.page.getByRole('textbox', { name: '*******' }).fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
    await expect(this.page.getByRole('navigation')).toBeVisible();
    await this.closeAwarenessPopup();
  }

  async openCmsNewsPage() {
    await this.page.goto(this.cmsListingUrl);
    await this.closeAwarenessPopup();

    if (!this.page.url().match(/chennai-news-updates/i)) {
      await this.newsLink.first().click({ force: true });
    }

    await expect(this.page).toHaveURL(/chennai-news-updates/i);
    await this.closeAwarenessPopup();
  }

  async openPublicNewsPage() {
    await this.page.goto(this.publicNewsUrl);
    await this.closeAwarenessPopup();
    await expect(this.page).toHaveURL(/chennai-news-updates/i);
  }

  async collectNewsRecords(listingUrl: string): Promise<NewsRecord[]> {
    const records: NewsRecord[] = [];
    const cards = this.page.locator('section:has(button:has-text("Read More"))');
    const cardCount = await cards.count();

    for (let index = 0; index < cardCount; index++) {
      const card = cards.nth(index);
      const title = this.normalizeText(await card.locator('h1, h2, h3').first().textContent());
      const description = this.normalizeText(await card.locator('p').first().textContent());
      const image = this.normalizeImage(await card.locator('img').first().getAttribute('src'));
      const readMore = card.getByRole('button', { name: 'Read More' });

      await expect(readMore).toBeVisible();
      await readMore.click();

      const detailHeading = this.page.locator('h1, h2, h3').first();
      const detailContainer = detailHeading.locator('xpath=../..');
      const detailTitle = this.normalizeText(await detailHeading.textContent());
      const detailBody = this.normalizeText(await detailContainer.locator('p').first().textContent());
      const detailImage = this.normalizeImage(await detailContainer.locator('img').first().getAttribute('src').catch(() => null));

      records.push({ title, description, image, detailTitle, detailBody, detailImage });

      await this.page.goto(listingUrl);
      await this.closeAwarenessPopup();
      if (listingUrl.includes('cms.gctp.in') && !this.page.url().match(/chennai-news-updates/i)) {
        await this.newsLink.first().click({ force: true });
      }
      await expect(this.page).toHaveURL(/chennai-news-updates/i);
      await this.closeAwarenessPopup();
      await expect(cards.nth(index)).toBeVisible();
    }

    return records;
  }

  async openNews() {
    await this.newsLink.click();
  }

  async openTrafficDiversionDetails() {
    await this.trafficDiversionReadMoreButton.click();
  }

  async openPendingEChallanDetails() {
    await this.pendingEChallanReadMoreButton.click();
  }

  async openMegaBikeRallyDetails() {
    await this.megaBikeRallyReadMoreButton.click();
  }

  async goBackFromNewsDetail() {
    await this.page.locator('button.left-btn').dblclick();
  }
}
