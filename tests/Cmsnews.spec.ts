import { expect, test } from '@playwright/test';
import { CmsNewsPage } from '../pages/CmsNewsPage';

test('verify the live GCTP news updates content', async ({ page }) => {
  const newsPage = new CmsNewsPage(page);

  await newsPage.openNewsPage();
  await expect(page).toHaveURL(/chennai-news-updates/i);
  await expect(newsPage.megaBikeRallyHeading).toBeVisible();
  await expect(newsPage.megaBikeRallyDescription).toBeVisible();
  await expect(newsPage.megaBikeRallyDescription).toContainText('Mega Bike Rally for Road Safety');
  await expect(newsPage.megaBikeRallyDescription).toContainText('scheduled for early 2026');
  await expect(newsPage.megaBikeRallyImage).toBeVisible();
  await expect(newsPage.readMoreButton).toBeVisible();
});