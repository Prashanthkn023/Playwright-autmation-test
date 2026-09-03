import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsCityPage extends BasePage {
  readonly cityProfileLink: Locator;
  readonly cityProfileHeading: Locator;
  readonly cityDescription: Locator;
  readonly topAttractionsHeading: Locator;
  readonly firstAttractionImage: Locator;
  readonly childrenRoadSafetyPark: Locator;
  readonly childrenRoadSafetyParkDescription: Locator;
  readonly policeMemorialImage: Locator;
  readonly policeMemorial: Locator;
  readonly policeMemorialDescription: Locator;
  readonly policeMuseumImage: Locator;
  readonly policeMuseum: Locator;
  readonly policeMuseumDescription: Locator;
  readonly gctpImage: Locator;

  constructor(page: Page) {
    super(page);

    this.cityProfileLink = page.getByRole('link', { name: 'City Profile' });
    this.cityProfileHeading = page.getByText('CITY PROFILE', { exact: true });
    this.cityDescription = page.getByText(
      'Chennai is not just a metropolis; it is a living museum of culture, temples, and traditions that breathe beauty into modern life.'
    );
    this.topAttractionsHeading = page.getByText('TOP ATTRACTIONS');
    this.firstAttractionImage = page.locator('.home-hero-card-imgGTGC > img').first();
    this.childrenRoadSafetyPark = page.getByText("Children's Road Safety  and Traffic Park");
    this.childrenRoadSafetyParkDescription = page.getByText(
      'The Children’s Traffic Park is a historically significant road‑safety learning space in Chennai,'
    );
    this.policeMemorialImage = page.locator('div:nth-child(2) > .home-hero-card-imgGTGC > img');
    this.policeMemorial = page.getByText('Police Memorial');
    this.policeMemorialDescription = page.getByText(
      'The memorial is the focal point of Police Commemoration Day, observed annually on 21 October.'
    );
    this.policeMuseumImage = page.locator('div:nth-child(3) > .home-hero-card-imgGTGC > img');
    this.policeMuseum = page.getByText('Tamil Nadu State Police Museum');
    this.policeMuseumDescription = page.getByText('The museum operates from the');
    this.gctpImage = page.locator('.GCTPImg');
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openCityProfile() {
    await this.cityProfileLink.click();
  }
}