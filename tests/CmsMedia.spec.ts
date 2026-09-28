import { expect, Page, test } from '@playwright/test';
import { CmsMediaPage } from '../pages/CmsMediaPage';

const expectedPhotoTitles = [
  'Helmet Awareness Drive',
  'Road Safety Awareness Quiz 2025',
  'Ride for Road Safety',
];

const expandedTextContent = [
  'The initiative educated riders and petrol bunk staff about the importance of wearing helmets.',
  'Students actively participated in the road safety awareness session by identifying traffic signs and',
  'Hundreds joined the Road Safety Cyclothon 2026',
];

async function getVisibleTitles(page: Page, titles: string[]) {
  const found: string[] = [];

  for (const title of titles) {
    const locator = page.getByText(title, { exact: true }).first();
    await expect(locator).toBeVisible({ timeout: 15000 });
    found.push(title);
  }

  return found;
}

async function checkReadMoreAndBackNavigation(page: Page, title: string, index: number, expandedText: string) {
  const readMore = page.locator('text=Read More').nth(index);
  await expect(readMore).toBeVisible({ timeout: 15000 });
  await readMore.click();

  await expect(page.locator('text=Read Less').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(expandedText, { exact: false }).first()).toBeVisible({ timeout: 15000 });

  await page.goBack();

  await expect(page).toHaveURL(/chennai-media/i, { timeout: 15000 });
  await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 15000 });
}

async function expectVideoEmbedsVisible(page: Page) {
  const iframes = page.locator('iframe');

  await expect(iframes.first()).toBeVisible({ timeout: 15000 });
  await expect(iframes).toHaveCount(2, { timeout: 15000 });

  for (let i = 0; i < 2; i++) {
    const src = await iframes.nth(i).getAttribute('src');
    expect(src).toBeTruthy();
    if (src) {
      expect(src).toMatch(/youtube\.com\/embed|youtu\.be/i);
    }
  }
}

test('verify CMS media content matches the public website', async ({ page }) => {
  const mediaPage = new CmsMediaPage(page);
  const username = process.env.CMS_USERNAME;
  const password = process.env.CMS_PASSWORD;

  test.skip(!username || !password, 'CMS_USERNAME and CMS_PASSWORD must be configured for CMS parity checks.');

  await mediaPage.openCmsMediaPage();
  await expect(page).toHaveURL(/cms\.gctp\.in\/chennai-media|login/i);
  await expect(mediaPage.cmsLoginEmailInput).toBeVisible();

  await mediaPage.cmsLoginEmailInput.fill(username!);
  await mediaPage.cmsLoginPasswordInput.fill(password!);
  await mediaPage.cmsLoginSubmitButton.click();
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);

  await page.waitForURL(/cms\.gctp\.in\/chennai-media/i, { timeout: 30000 }).catch(() => undefined);
  await mediaPage.openPhotos();

  const cmsPhotoTitles = await getVisibleTitles(page, expectedPhotoTitles);
  expect(cmsPhotoTitles).toEqual(expectedPhotoTitles);

  await mediaPage.openMediaPage();
  await mediaPage.openPhotos();
  const publicPhotoTitles = await getVisibleTitles(page, expectedPhotoTitles);
  expect(publicPhotoTitles).toEqual(expectedPhotoTitles);

  for (let index = 0; index < expectedPhotoTitles.length; index++) {
    await checkReadMoreAndBackNavigation(page, expectedPhotoTitles[index], index, expandedTextContent[index]);
  }

  await mediaPage.openVideos();
  await page.waitForTimeout(1500);
  await expectVideoEmbedsVisible(page);

  expect(publicPhotoTitles).toEqual(cmsPhotoTitles);
});
