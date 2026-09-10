import { expect, test } from '@playwright/test';
import { CmsMediaPage } from '../pages/CmsMediaPage';

test('verify the cms media page content', async ({ page }) => {
  const mediaPage = new CmsMediaPage(page);

  await mediaPage.openHomePage();
  await mediaPage.openMedia();
  await expect(page).toHaveURL(/chennai-media/i);
  await expect(mediaPage.mediaNavigationText).toBeVisible();
  await expect(mediaPage.photosHeading).toBeVisible();
  await expect(page.getByText('Helmet Awareness Drive')).toBeVisible();
  await expect(page.getByText('Road Safety Awareness Quiz 2025')).toBeVisible();
  await expect(page.getByText('Ride for Road Safety')).toBeVisible();

  await mediaPage.openVideos();
  await expect(mediaPage.iframes).toHaveCount(2);
  await expect(mediaPage.iframes.nth(0)).toBeVisible();
  await expect(mediaPage.iframes.nth(1)).toBeVisible();
  expect(await mediaPage.getIframeSource(0)).toContain('youtube.com/embed');
  expect(await mediaPage.getIframeSource(1)).toContain('youtube.com/embed');
});
