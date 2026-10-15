import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { loginToCms as loginToConfiguredCms } from '../utils/cmsLogin';

export type NewsRecord = {
  title: string;
  description: string;
  image: string;
  detailTitle: string;
  detailBody: string;
  detailImage: string;
};

export class CmsNewsPage extends BasePage {
  readonly cmsNewsUrl = 'https://cms.gctp.in/chennai-news-updates-Cms';
  readonly cmsListingUrl = 'https://cms.gctp.in/chennai-news-updates';
  readonly publicNewsUrl = 'https://gctp.in/chennai-news-updates';
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
      name: /Traffic Diversion and U-Turn Restrictions/i,
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
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openNewsPage() {
    await this.navigate('https://gctp.in/chennai-news-updates');
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
    await loginToConfiguredCms(this.page, this.cmsNewsUrl, username, password);
    await this.closeAwarenessPopup();
  }

  async openCmsNewsPage() {
    // The CMS is a React SPA. Direct page.goto('/chennai-news-updates') causes
    // the SPA to reload and its router may redirect to /chennai-home before the
    // session state is rehydrated. SPA navigation via pushState + popstate event
    // triggers React Router to render the news listing in-place, preserving the
    // authenticated session.
    if (this.page.url().match(/chennai-news-updates/i) && !this.page.url().includes('-Cms')) {
      await this.closeAwarenessPopup();
      return;
    }

    // Dismiss any flash popup that may be blocking the page before navigating.
    await this.closeAwarenessPopup();
    const popup = this.page.locator('.flash-popup:visible, .flash-popup-overlay:visible').first();
    if (await popup.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(500);
    }

    // Trigger React Router in-app navigation using the History API.
    await this.page.evaluate(() => {
      window.history.pushState({}, '', '/chennai-news-updates');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for the news listing to render.
    await this.page.waitForTimeout(2000);
    await this.closeAwarenessPopup();
    await expect(this.page).toHaveURL(/chennai-news-updates/i, { timeout: 15000 });
    await this.closeAwarenessPopup();
  }

  async openPublicNewsPage() {
    await this.page.goto(this.publicNewsUrl);
    await this.closeAwarenessPopup();
    await expect(this.page).toHaveURL(/chennai-news-updates/i);
  }

  async collectNewsRecords(listingUrl: string): Promise<NewsRecord[]> {
    const records: NewsRecord[] = [];
    const maxAttempts = 3;
    let cardCount = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const cards = this.page.locator(
        'div.newsbackground:has(button:has-text("Read More"))'
      );

      cardCount = await cards.count();
      if (cardCount > 0) {
        break;
      }

      console.warn(
        `No CMS/news cards found on attempt ${attempt}/${maxAttempts} at ${this.page.url()}. Reloading the listing page...`
      );

      await this.page.goto(listingUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });
      await this.closeAwarenessPopup();
      await this.page.waitForTimeout(3000);
    }

    const cards = this.page.locator(
      'div.newsbackground:has(button:has-text("Read More"))'
    );

    await expect(
      cards.first(),
      `News cards did not load at ${this.page.url()}`
    ).toBeVisible({ timeout: 30000 });
    cardCount = await cards.count();

    console.log('CMS News collection:', JSON.stringify({
      listingUrl,
      currentUrl: this.page.url(),
      cardCount,
    }));

    for (let index = 0; index < cardCount; index++) {
      const card = cards.nth(index);
      const title = this.normalizeText(await card.locator('h1, h2, h3').first().textContent());
      const description = this.normalizeText(await card.locator('p').first().textContent());
      const image = this.normalizeImage(await card.locator('img').first().getAttribute('src'));
      const readMore = card.getByRole('button', { name: 'Read More' });

      await expect(readMore).toBeVisible();
      await readMore.click();

      const detailHeading = this.page.getByRole('heading', {
        name: title,
        exact: true,
      }).first();
      await expect(
        detailHeading,
        `News detail heading should match clicked card: ${title}`
      ).toBeVisible({ timeout: 15000 });

      const detailContainer = detailHeading.locator('xpath=../..');
      const detailTitle = this.normalizeText(await detailHeading.textContent());
      const detailBody = this.normalizeText(await detailContainer.locator('p').first().textContent());
      const detailImage = this.normalizeImage(await detailContainer.locator('img').first().getAttribute('src').catch(() => null));

      records.push({ title, description, image, detailTitle, detailBody, detailImage });

      // Navigate back to the listing. For the CMS (a React SPA), use the History
      // API to trigger React Router in-place navigation without a full page reload.
      // A full reload causes the router to redirect to /chennai-home, losing the
      // news listing content.
      if (listingUrl.includes('cms.gctp.in')) {
        await this.openCmsNewsPage();
      } else {
        // Public website: direct goto works fine.
        await this.page.goto(listingUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 120000,
        });
        await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
        await this.closeAwarenessPopup();
      }

      await expect(this.page).toHaveURL(/chennai-news-updates/i, { timeout: 30000 });
      await this.closeAwarenessPopup();
      await expect(cards.nth(index)).toBeVisible({ timeout: 15000 });
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
