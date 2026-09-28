import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsNewsPage extends BasePage {
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
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openNewsPage() {
    await this.navigate('https://gctp.in/chennai-news-updates');
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
