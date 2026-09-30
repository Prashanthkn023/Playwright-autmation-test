import { createHash } from 'crypto';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsCityPage extends BasePage {

  // =====================================================
  // CITY PROFILE
  // =====================================================

  readonly cityProfileLink: Locator;
  readonly cityProfileHeading: Locator;
  readonly cityDescription: Locator;
  readonly cityProfileImage: Locator;

  // =====================================================
  // TOP ATTRACTIONS
  // =====================================================

  readonly topAttractionsHeading: Locator;

  // Attraction 1
  readonly attraction1Title: Locator;
  readonly attraction1Description: Locator;
  readonly attraction1Image: Locator;

  // Attraction 2
  readonly attraction2Title: Locator;
  readonly attraction2Description: Locator;
  readonly attraction2Image: Locator;

  // Attraction 3
  readonly attraction3Title: Locator;
  readonly attraction3Description: Locator;
  readonly attraction3Image: Locator;

  constructor(page: Page) {
    super(page);

    // =====================================================
    // CITY PROFILE
    // =====================================================

    this.cityProfileLink =
      page.getByRole('link', {
        name: 'City Profile'
      }).first();

    this.cityProfileHeading =
      page.getByText(
        'CITY PROFILE',
        { exact: true }
      );

    this.cityDescription =
      page.locator('p').filter({
        hasText: 'Chennai is not just a metropolis'
      }).first();

    this.cityProfileImage =
      page.locator('.GCTPImg');

    // =====================================================
    // TOP ATTRACTIONS
    // =====================================================

    this.topAttractionsHeading =
      page.getByRole('heading', {
        name: 'TOP ATTRACTIONS'
      });

    // =====================================================
    // ATTRACTION 1
    // =====================================================

    this.attraction1Title =
      page.getByText(
        "Children's Road Safety",
        { exact: false }
      ).first();

    this.attraction1Description =
      page.getByText(
        'The Children’s Traffic Park is a historically significant',
        { exact: false }
      );

    this.attraction1Image =
      page
        .locator('.home-hero-card-imgGTGC > img')
        .nth(0);

    // =====================================================
    // ATTRACTION 2
    // =====================================================

    this.attraction2Title =
      page.getByText(
        'Police Memorial',
        { exact: true }
      );

    this.attraction2Description =
      page.getByText(
        'The memorial is the focal point of Police Commemoration Day, observed annually on 21 October.'
      );

    this.attraction2Image =
      page
        .locator('.home-hero-card-imgGTGC > img')
        .nth(1);

    // =====================================================
    // ATTRACTION 3
    // =====================================================

    this.attraction3Title =
      page.getByText(
        'Tamil Nadu State Police Museum',
        { exact: true }
      );

    this.attraction3Description =
      page.getByText(
        'The museum operates from the'
      );

    this.attraction3Image =
      page
        .locator('.home-hero-card-imgGTGC > img')
        .nth(2);
  }

  // =====================================================
  // LOGIN TO CMS
  // =====================================================

  async loginToCms(
    cmsUrl: string,
    username: string,
    password: string
  ) {

    const usernameInput =
      this.page.locator(
        'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]'
      );

    const passwordInput =
      this.page.locator(
        'input[type="password"]'
      );

    let loginFormLoaded = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      await this.page.goto(cmsUrl, {
        waitUntil: 'domcontentloaded'
      });

      loginFormLoaded = await expect(usernameInput)
        .toBeVisible({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);

      if (!loginFormLoaded) {
        const loginTrigger = this.page.getByText('LOGIN', { exact: true });
        const triggerVisible = await loginTrigger
          .isVisible()
          .catch(() => false);

        if (triggerVisible) {
          await loginTrigger.click().catch(() => undefined);
          loginFormLoaded = await expect(usernameInput)
            .toBeVisible({ timeout: 10000 })
            .then(() => true)
            .catch(() => false);
        }
      }

      if (loginFormLoaded) {
        break;
      }
    }

    expect(
      loginFormLoaded,
      'CMS login form should load after retrying the CMS portal'
    ).toBe(true);

    await usernameInput.fill(
      username
    );

    await expect(
      passwordInput
    ).toBeVisible();

    await passwordInput.fill(
      password
    );

    await this.page
      .getByRole('button', {
        name: 'Login'
      })
      .click();

    await this.page.waitForLoadState(
      'domcontentloaded'
    );
  }

  // =====================================================
  // OPEN CMS CITY PROFILE
  // =====================================================

  async openCmsCityProfile() {
    await this.closeAnyPopup();

    const cityProfileCandidates = this.page.getByText(/City Profile/i);
    const totalCandidates = await cityProfileCandidates.count();

    let clicked = false;

    for (let index = 0; index < totalCandidates; index++) {
      const candidate = cityProfileCandidates.nth(index);

      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      await candidate.click({ force: true });
      clicked = true;
      break;
    }

    expect(clicked, 'CMS City Profile text should be clickable after login').toBe(true);

    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  // =====================================================
  // OPEN PUBLISHED CITY PROFILE
  // =====================================================

  async openPublishedCityProfile() {
    await this.closeAnyPopup();

    await expect(
      this.cityProfileLink
    ).toBeVisible();

    await this.cityProfileLink.click();

    await this.page.waitForURL(
      '**/city-profile'
    );

    await this.page.waitForLoadState(
      'domcontentloaded'
    );
  }

  // =====================================================
  // CITY PROFILE DATA
  // =====================================================

  async getCityProfileHeading() {

    if (this.isCmsContentList()) {
      return this.getCmsCellText('CITY PROFILE', 3);
    }

    return await this.cityProfileHeading
      .textContent();
  }

  async getCityDescription() {

    if (this.isCmsContentList()) {
      return this.getCmsDescription('CITY PROFILE');
    }

    return this.cleanDescription(
      await this.cityDescription.textContent()
    );
  }

  async getCityProfileImage() {

    if (this.isCmsContentList()) {
      return this.getImageFingerprint(
        this.cmsRow('CITY PROFILE').locator('td').nth(10).locator('img')
      );
    }

    return this.getImageFingerprint(this.cityProfileImage);
  }

  // =====================================================
  // TOP ATTRACTIONS
  // =====================================================

  async getTopAttractionsHeading() {

    if (this.isCmsContentList()) {
      return this.getCmsCellText("Children's Road Safety and Traffic Park", 2);
    }

    return await this.topAttractionsHeading
      .textContent();
  }

  // =====================================================
  // ATTRACTION 1
  // =====================================================

  async getAttraction1Title() {

    if (this.isCmsContentList()) {
      return this.getCmsCellText("Children's Road Safety and Traffic Park", 3);
    }

    return await this.attraction1Title
      .textContent();
  }

  async getAttraction1Description() {

    if (this.isCmsContentList()) {
      return this.getCmsDescription("Children's Road Safety and Traffic Park");
    }

    return this.cleanDescription(
      await this.attraction1Description.textContent()
    );
  }

  async getAttraction1Image() {

    if (this.isCmsContentList()) {
      return this.getImageFingerprint(
        this.cmsRow("Children's Road Safety and Traffic Park")
          .locator('td').nth(10).locator('img')
      );
    }

    return this.getImageFingerprint(this.attraction1Image);
  }

  // =====================================================
  // ATTRACTION 2
  // =====================================================

  async getAttraction2Title() {

    if (this.isCmsContentList()) {
      return this.getCmsCellText('Police Memorial', 3);
    }

    return await this.attraction2Title
      .textContent();
  }

  async getAttraction2Description() {

    if (this.isCmsContentList()) {
      return this.getCmsDescription('Police Memorial');
    }

    return this.cleanDescription(
      await this.attraction2Description.textContent()
    );
  }

  async getAttraction2Image() {

    if (this.isCmsContentList()) {
      return this.getImageFingerprint(
        this.cmsRow('Police Memorial').locator('td').nth(10).locator('img')
      );
    }

    return this.getImageFingerprint(this.attraction2Image);
  }

  // =====================================================
  // ATTRACTION 3
  // =====================================================

  async getAttraction3Title() {

    if (this.isCmsContentList()) {
      return this.getCmsCellText('Tamil Nadu State Police Museum', 3);
    }

    return await this.attraction3Title
      .textContent();
  }

  async getAttraction3Description() {

    if (this.isCmsContentList()) {
      return this.getCmsDescription('Tamil Nadu State Police Museum');
    }

    return this.cleanDescription(
      await this.attraction3Description.textContent()
    );
  }

  async getAttraction3Image() {

    if (this.isCmsContentList()) {
      return this.getImageFingerprint(
        this.cmsRow('Tamil Nadu State Police Museum')
          .locator('td').nth(10).locator('img')
      );
    }

    return this.getImageFingerprint(this.attraction3Image);
  }

  // =====================================================
  // READ MORE
  // =====================================================

  async clickReadMore() {

    if (this.isCmsContentList()) {
      return;
    }

    const readMore =
      this.page.getByText(
        'Read More',
        { exact: true }
      );

    for (let index = 0; index < 3; index++) {
      if (await readMore.count() === 0) {
        break;
      }

      await readMore.first().click();
    }
  }

  private isCmsContentList() {
    return this.page.url().includes('chennai-cityprofile-Cms');
  }

  private cmsRow(title: string) {
    return this.page
      .locator('tbody tr')
      .filter({ hasText: title })
      .filter({ hasText: 'APPROVED' })
      .first();
  }

  private async getCmsCellText(title: string, cellIndex: number) {
    return this.cmsRow(title).locator('td').nth(cellIndex).textContent();
  }

  private async getCmsDescription(title: string) {
    const row = this.cmsRow(title);
    const readMore = row.getByText('Read More', { exact: true });

    if (await readMore.count()) {
      await readMore.first().click();
    }

    return this.cleanDescription(
      await row.locator('td').nth(4).textContent()
    );
  }

  private async getCmsCellImage(title: string) {
    return this.cmsRow(title).locator('td').nth(10).locator('img').getAttribute('src');
  }

  private async getImageFingerprint(image: Locator) {
    await expect(image, 'City profile image should be visible').toBeVisible();

    const imageData = await image.evaluate((element) => {
      const imageElement = element as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      canvas.getContext('2d')?.drawImage(imageElement, 0, 0);
      return canvas.toDataURL('image/png');
    });

    return createHash('sha256')
      .update(imageData)
      .digest('hex');
  }

  private cleanDescription(value: string | null) {
    return value
      ?.replace(/Read More|Read Less/g, '')
      .replace(/\.{3,}\s*$/, '')
      .replace(/[.!?]+\s*$/, '')
      .trim();
  }
}