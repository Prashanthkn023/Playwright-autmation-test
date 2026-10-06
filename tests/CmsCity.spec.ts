import { test, expect } from '@playwright/test';
import { CmsCityPage } from '../pages/CmsCityPage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';
import { CMS_PASSWORD, CMS_USERNAME } from '../utils/cmsLogin';

const cmsUrl = process.env.CMS_BASE_URL || 'https://cms.gctp.in/';
const publishedUrl = 'https://gctp.in/chennai-home';

test('verify CMS City Profile content with published website', async ({ page }) => {
  const cityPage = new CmsCityPage(page);

  // Read expected content from the CMS.
  await cityPage.loginToCms(cmsUrl, CMS_USERNAME, CMS_PASSWORD);
  await cityPage.openCmsCityProfile();

  const expectedCityProfileHeading = await cityPage.getCityProfileHeading();
  const expectedCityDescription = await cityPage.getCityDescription();
  const expectedTopAttractionsHeading = await cityPage.getTopAttractionsHeading();

  await cityPage.clickReadMore();

  const expectedAttraction1Title = await cityPage.getAttraction1Title();
  const expectedAttraction1Description = await cityPage.getAttraction1Description();
  const expectedAttraction2Title = await cityPage.getAttraction2Title();
  const expectedAttraction2Description = await cityPage.getAttraction2Description();
  const expectedAttraction3Title = await cityPage.getAttraction3Title();
  const expectedAttraction3Description = await cityPage.getAttraction3Description();

  // Read the corresponding content from the published website.
  await page.goto(publishedUrl, { waitUntil: 'domcontentloaded' });
  await closeAwarenessPopup(page);
  await cityPage.openPublishedCityProfile();

  const actualCityProfileHeading = await cityPage.getCityProfileHeading();
  const actualCityDescription = await cityPage.getCityDescription();
  const actualTopAttractionsHeading = await cityPage.getTopAttractionsHeading();

  await cityPage.clickReadMore();

  const actualAttraction1Title = await cityPage.getAttraction1Title();
  const actualAttraction1Description = await cityPage.getAttraction1Description();
  const actualAttraction2Title = await cityPage.getAttraction2Title();
  const actualAttraction2Description = await cityPage.getAttraction2Description();
  const actualAttraction3Title = await cityPage.getAttraction3Title();
  const actualAttraction3Description = await cityPage.getAttraction3Description();

  // Compare CMS content with published content.
  expect(actualCityProfileHeading?.trim()).toBe(expectedCityProfileHeading?.trim());
  expect(actualCityDescription?.trim()).toBe(expectedCityDescription?.trim());
  expect(actualTopAttractionsHeading?.trim()).toBe(expectedTopAttractionsHeading?.trim());

  expect(actualAttraction1Title?.trim()).toBe(expectedAttraction1Title?.trim());
  expect(actualAttraction1Description?.trim()).toBe(expectedAttraction1Description?.trim());

  expect(actualAttraction2Title?.trim()).toBe(expectedAttraction2Title?.trim());
  expect(actualAttraction2Description?.trim()).toBe(expectedAttraction2Description?.trim());

  expect(actualAttraction3Title?.trim()).toBe(expectedAttraction3Title?.trim());
  expect(actualAttraction3Description?.trim()).toBe(expectedAttraction3Description?.trim());
});