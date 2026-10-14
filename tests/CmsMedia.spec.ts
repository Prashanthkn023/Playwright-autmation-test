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

async function getMediaRecordsFromApi(
  page: Page,
  endpoint: string,
  section: string
): Promise<MediaRecord[]> {
  const response = await page.request.get(endpoint);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return (body.payload || [])
    .filter((record: { f_section?: string; f_image?: string[] }) =>
      record.f_section === section &&
      Array.isArray(record.f_image) &&
      record.f_image.length > 0
    )
    .map((record: {
      f_title?: string;
      f_description?: string;
      f_image?: string[];
    }) => ({
      title: record.f_title?.trim() || '',
      imageName: record.f_image?.[0]?.split('/').pop() || '',
      content: `${record.f_title || ''} ${record.f_description || ''}`
        .replace(/\s+/g, ' ')
        .trim(),
    }));
}

async function getVideoRecordsFromApi(
  page: Page,
  endpoint: string
): Promise<VideoRecord[]> {
  const response = await page.request.get(endpoint);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return (body.payload || [])
    .filter((record: { f_section?: string; f_url?: string[] }) =>
      record.f_section === 'VIDEOS' &&
      Array.isArray(record.f_url) &&
      record.f_url.length > 0
    )
    .map((record: { f_title?: string; f_url?: string[] }) => ({
      providerId: record.f_url?.[0]?.match(
        /(?:embed\/|youtu\.be\/|watch\?v=)([^?&#/]+)/i
      )?.[1] || record.f_url?.[0] || '',
      title: record.f_title || '',
    }));
}

// CMS login polls for up to 45s per attempt, so the shared 60s timeout is
// too short once the suite load slows the server down.
test.setTimeout(300000);

test('verify CMS media content matches the public website', async ({ page }) => {
  const mediaPage = new CmsMediaPage(page);

  // 1. LOGIN TO CMS AND GET APPROVED RECORDS
  await mediaPage.loginToCms(CMS_USERNAME, CMS_PASSWORD);
  await closeAwarenessPopup(page);

  const cmsMediaRecords = await getMediaRecordsFromApi(
    page,
    'https://cms.gctp.in/api/fusion-cms-web-backend/media',
    'PHOTOS'
  );
  expect(cmsMediaRecords.length, 'CMS should have approved photos').toBeGreaterThan(0);

  const cmsVideoRecords = await getVideoRecordsFromApi(
    page,
    'https://cms.gctp.in/api/fusion-cms-web-backend/media'
  );
  expect(cmsVideoRecords.length, 'CMS should have approved videos').toBeGreaterThan(0);

  // 2. NAVIGATE TO PUBLIC SITE AND SCRAPE PUBLISHED RECORDS
  await mediaPage.openMediaPage();
  await expect(page).toHaveURL(/gctp\.in\/chennai-media/i, { timeout: 30000 });

  // UI CHECKS
  const publicPhotosVisible = await mediaPage.openPhotos();
  expect(publicPhotosVisible, 'Public Photos section should be visible').toBeTruthy();

  if (publicPhotosVisible) {
    for (let index = 0; index < expectedPhotoTitles.length; index++) {
      await checkReadMoreAndBackNavigation(
        page,
        mediaPage,
        expectedPhotoTitles[index],
        index,
        expandedTextContent[index]
      );
    }
  }

  const publicMediaRecords = await getVisibleMediaRecords(page);
  expect(publicMediaRecords.length, 'Public should have visible photos').toBeGreaterThan(0);

  const publicVideosVisible = await mediaPage.openVideos();
  expect(publicVideosVisible, 'Public Videos section should be visible').toBeTruthy();
  const publicVideoRecords = await getVisibleVideoRecords(page);
  expect(publicVideoRecords.length, 'Public should have visible videos').toBeGreaterThan(0);

  // 3. COMPARE CMS APPROVED RECORDS (API) WITH PUBLISHED RECORDS (DOM)
  // Use stable keys to match records if possible. Currently, matching by title.
  const cmsMediaByTitle = new Map(cmsMediaRecords.map(r => [r.title.toLowerCase(), r]));
  const publicMediaByTitle = new Map(publicMediaRecords.map(r => [r.title.toLowerCase(), r]));

  // Assert counts
  expect(publicMediaByTitle.size, 'Public site should have same number of photo records as CMS API').toBe(cmsMediaByTitle.size);

  // Assert content
  for (const [title, cmsRecord] of cmsMediaByTitle) {
      const publicRecord = publicMediaByTitle.get(title);
      expect(publicRecord, `Missing published photo record for: ${title}`).toBeDefined();
      if (publicRecord) {
        expect(publicRecord.content, `Content mismatch for photo: ${title}`).toBe(cmsRecord.content);
      }
  }

  // Similar comparison for videos
  const cmsVideoByTitle = new Map(cmsVideoRecords.map(r => [r.title.toLowerCase(), r]));
  const publicVideoByTitle = new Map(publicVideoRecords.map(r => [r.title.toLowerCase(), r]));

  expect(publicVideoByTitle.size, 'Public site should have same number of video records as CMS API').toBe(cmsVideoByTitle.size);

  for (const [title, cmsRecord] of cmsVideoByTitle) {
      const publicRecord = publicVideoByTitle.get(title);
      expect(publicRecord, `Missing published video record for: ${title}`).toBeDefined();
      if (publicRecord) {
        expect(publicRecord.providerId, `Video provider ID mismatch for: ${title}`).toBe(cmsRecord.providerId);
      }
  }
});
