import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsNewsPage extends BasePage {
  readonly newsLink: Locator;
  readonly megaBikeRallySection: Locator;
  readonly megaBikeRallyButton: Locator;
  readonly megaBikeRallyHeading: Locator;
  readonly megaBikeRallyDescription: Locator;
  readonly zeroAccidentDaySection: Locator;
  readonly zeroAccidentDayButton: Locator;
  readonly zeroAccidentDayHeading: Locator;
  readonly zeroAccidentDayDescription: Locator;
  readonly zeroAccidentDayImage: Locator;
  readonly goBackButton: Locator;

  constructor(page: Page) {
    super(page);

    this.newsLink = page.getByRole('link', { name: 'News' });
    this.megaBikeRallySection = page.locator('section').filter({
      hasText: 'Mega Bike Rally for Road',
    });
    this.megaBikeRallyButton = this.megaBikeRallySection.getByRole('button');
    this.megaBikeRallyHeading = page.getByRole('heading', {
      name: 'Mega Bike Rally for Road',
    });
    this.megaBikeRallyDescription = page.getByText(
      'Mega Bike Rally for Road Safety, is scheduled for early 2026, organized by the'
    );
    this.zeroAccidentDaySection = page.locator('section').filter({
      hasText: 'Zero Accident Day’ Drive',
    });
    this.zeroAccidentDayButton = this.zeroAccidentDaySection.getByRole('button');
    this.zeroAccidentDayHeading = page.getByRole('heading', {
      name: 'Zero Accident Day’ Drive',
    });
    this.zeroAccidentDayDescription = page.getByText('This comes in the backdrop of');
    this.zeroAccidentDayImage = page.getByRole('img', {
      name: 'Zero Accident Day’ Drive',
    });
    this.goBackButton = page.getByRole('button', { name: 'Go back' });
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/');
  }

  async openNews() {
    await this.newsLink.click();
  }

  async openMegaBikeRally() {
    await this.megaBikeRallyButton.click();
  }

  async openMegaBikeRallyDescription() {
    await this.megaBikeRallyDescription.click();
  }

  async openZeroAccidentDay() {
    await this.zeroAccidentDayButton.click();
  }

  async openZeroAccidentDayDescription() {
    await this.zeroAccidentDayDescription.click();
  }

  async goBack() {
    await this.goBackButton.click();
  }
}
