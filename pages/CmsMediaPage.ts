import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsMediaPage extends BasePage {
  readonly mediaLink: Locator;
  readonly mediaNavigationText: Locator;
  readonly photosHeading: Locator;
  readonly photoImages: Locator;
  readonly helmetAwarenessDrive: Locator;
  readonly helmetAwarenessDescription: Locator;
  readonly roadSafetyQuiz: Locator;
  readonly roadSafetyQuizDescription: Locator;
  readonly rideForRoadSafety: Locator;
  readonly rideForRoadSafetyDescription: Locator;
  readonly videosTab: Locator;
  readonly video: Locator;
  readonly helmetVideoTitle: Locator;
  readonly helmetVideoDescription: Locator;
  readonly iframes: Locator;
  readonly airConditionedHelmet: Locator;
  readonly airConditionedHelmetDescription: Locator;
  readonly trafficAlert: Locator;
  readonly trafficUpdate: Locator;

  constructor(page: Page) {
    super(page);

    this.mediaLink = page.getByRole('link', { name: 'media' });
    this.mediaNavigationText = page.getByRole('navigation').getByText('media');
    this.photosHeading = page.getByText('photos');
    this.photoImages = page.locator('.home-hero-card-imgGTGC img.imageStyle1');
    this.helmetAwarenessDrive = page.getByText('Helmet Awareness Drive');
    this.helmetAwarenessDescription = page.getByText(
      'Greater Chennai Traffic Police conducted a “No Helmet – No Fuel” awareness campaign at Retteri.'
    );
    this.roadSafetyQuiz = page.getByText('Road Safety Awareness Quiz 2025');
    this.roadSafetyQuizDescription = page.getByText(
      /Students actively participated in the road safety awareness session by identifying traffic signs/
    );
    this.rideForRoadSafety = page.getByText('Ride for Road Safety');
    this.rideForRoadSafetyDescription = page.getByText(
      /Hundreds joined the Road Safety Cyclothon 2026 to spread awareness about safe driving./
    );
    this.videosTab = page.getByText('VIDEOS');
    this.video = page.locator('video');
    this.helmetVideoTitle = page.getByText('Strap Your Helmet. Save Your Life.');
    this.helmetVideoDescription = page.getByText(
      'A loose strap is no protection-secure it every single ride.'
    );
    this.iframes = page.locator('iframe');
    this.airConditionedHelmet = page.getByText('Air Conditioned Helmet', { exact: true });
    this.airConditionedHelmetDescription = page.getByText(
      'Chennai Traffic Cops Get Air Conditioned helmet to beat the heat'
    );
    this.trafficAlert = page.getByText('Traffic Alert');
    this.trafficUpdate = page.locator('.home-hero-traffic-card-des').filter({
      hasText: 'Update on Jul 22',
    });
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async openMedia() {
    await this.mediaLink.click();
  }

  async openPhotoDetails() {
    await this.page.getByText('Read More').first().click();
  }

  async openVideos() {
    await this.videosTab.click();
  }

  async getIframeSource(index: number) {
    return this.iframes.nth(index).getAttribute('src');
  }

  async openTrafficUpdate() {
    await this.trafficUpdate.getByText('Read More').click();
  }
}