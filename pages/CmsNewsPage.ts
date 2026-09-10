import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsNewsPage extends BasePage {
  readonly newsLink: Locator;
  readonly megaBikeRallyHeading: Locator;
  readonly megaBikeRallyDescription: Locator;
  readonly megaBikeRallyImage: Locator;
  readonly readMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    this.newsLink = page.getByRole('link', { name: 'News' });
    this.megaBikeRallyHeading = page.getByRole('heading', {
      name: /Mega Bike Rally for Road Safety/i,
    });
    this.megaBikeRallyDescription = page
      .locator('div, p')
      .filter({ hasText: 'Mega Bike Rally for Road Safety' })
      .filter({ hasText: 'scheduled for early 2026' })
      .first();
    this.megaBikeRallyImage = page.getByRole('img', {
      name: /Greater Chennai Traffic Police/i,
    }).first();
    this.readMoreButton = page.getByRole('button', { name: 'Read More' }).first();
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

  async openMegaBikeRallyDetails() {
    await this.readMoreButton.click();
  }
}
