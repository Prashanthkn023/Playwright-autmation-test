import { expect, Page, test } from '@playwright/test';
import { CmsMediaPage } from '../pages/CmsMediaPage';
import { CMS_PASSWORD, CMS_USERNAME } from '../utils/cmsLogin';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

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

type MediaRecord = {
  title: string;
  imageName: string;
  content: string;
};

type VideoRecord = {
  providerId: string;
  title: string;
};

async function getVisibleMediaRecords(page: Page): Promise<MediaRecord[]> {
  const excludedImageAlts = new Set([
    'Nature',
    'Play Store',
    'Facebook',
    'Instagram',
    'Twitter',
    'Youtube',
    'Group Icon',
    'Tamilnadu Police Citizen Portal',
    'Parivahan',
    'TN Govt Web',
    'TNRTO',
    'Get it on Google Play',
    'Get it on Apple store',
  ]);

  return page.locator('img[alt]:visible').evaluateAll(
    (images, excludedAlts) => images
      .map((image) => {
        const imageElement = image as HTMLImageElement;
        const title = imageElement.alt.trim();
        const card = imageElement.parentElement;
        const source = imageElement.currentSrc || imageElement.src;
        const imageName = source.split('/').pop()?.split('?')[0] || source;

        return {
          title,
          imageName,
          content: card?.innerText?.replace(/\s+/g, ' ').trim() || title,
        };
      })
      .filter((record) => record.title && !excludedAlts.includes(record.title)),
    [...excludedImageAlts]
  );
}

async function getVisibleVideoRecords(page: Page): Promise<VideoRecord[]> {
  return page.locator('iframe:visible').evaluateAll((iframes) =>
    iframes.map((iframe) => {
      const iframeElement = iframe as HTMLIFrameElement;
      const source = iframe.getAttribute('src') || '';
      const providerId = source.match(/(?:embed\/|youtu\.be\/)([^?&#/]+)/i)?.[1] || source;
      let ancestor = iframe.parentElement;
      let title = '';

      for (let level = 0; level < 6 && ancestor; level++, ancestor = ancestor.parentElement) {
        const text = ancestor.innerText?.replace(/\s+/g, ' ').trim() || '';
        if (text && text !== iframeElement.title) {
          title = text;
          break;
        }
      }

      return {
        providerId,
        title: title || iframeElement.title || providerId,
      };
    })
  );
}

async function checkReadMoreAndBackNavigation(
  page: Page,
  mediaPage: CmsMediaPage,
  title: string,
  index: number,
  expandedText: string
) {
  const readMore = page.locator('text=Read More').nth(index);
  await expect(readMore).toBeVisible({ timeout: 15000 });
  await readMore.click();

  await expect(page.locator('text=Read Less').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(expandedText, { exact: false }).first()).toBeVisible({ timeout: 15000 });

  await mediaPage.openMediaPage();

  await expect(page).toHaveURL(/gctp\.in\/chennai-media/i, { timeout: 15000 });
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

  await mediaPage.loginToCms(CMS_USERNAME, CMS_PASSWORD);
  await closeAwarenessPopup(page);
  await mediaPage.clickMediaText();
  await expect(page).toHaveURL(/cms\.gctp\.in\/chennai-media(?:-Cms)?(?:$|\/)/i, { timeout: 30000 });
  await mediaPage.openPhotos();

  const cmsMediaRecords = await getVisibleMediaRecords(page);
  expect(cmsMediaRecords.length).toBeGreaterThan(0);

  await mediaPage.openVideos();
  await expect(page.locator('iframe').first()).toBeVisible({ timeout: 30000 });
  const cmsVideoRecords = await getVisibleVideoRecords(page);
  expect(cmsVideoRecords.length).toBeGreaterThan(0);

  await mediaPage.openMediaPage();
  await mediaPage.openPhotos();
  const publicMediaRecords = await getVisibleMediaRecords(page);
  expect(publicMediaRecords.length).toBeGreaterThan(0);

  for (let index = 0; index < expectedPhotoTitles.length; index++) {
    await checkReadMoreAndBackNavigation(
      page,
      mediaPage,
      expectedPhotoTitles[index],
      index,
      expandedTextContent[index]
    );
  }

  await mediaPage.openVideos();
  await page.waitForTimeout(1500);
  await expectVideoEmbedsVisible(page);
  const publicVideoRecords = await getVisibleVideoRecords(page);

  expect(publicMediaRecords).toEqual(cmsMediaRecords);
  expect(publicVideoRecords).toEqual(cmsVideoRecords);
});
