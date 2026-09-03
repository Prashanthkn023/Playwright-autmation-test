import { expect, test } from '@playwright/test';
import { CmsNewsPage } from '../pages/CmsNewsPage';

test('verfiy the cms news page content', async ({ page }) => {
  const newsPage = new CmsNewsPage(page);

  await newsPage.openHomePage();
  await newsPage.openNews();
  await newsPage.openMegaBikeRally();
  await expect(newsPage.megaBikeRallyHeading).toBeVisible();
  await newsPage.openMegaBikeRallyDescription();
  await expect(newsPage.megaBikeRallyHeading).toBeVisible();
  await expect(newsPage.megaBikeRallyDescription).toBeVisible();
  await newsPage.goBack();
  await newsPage.goBack();
  await newsPage.openZeroAccidentDay();
  await expect(newsPage.zeroAccidentDayHeading).toBeVisible();
  await newsPage.openZeroAccidentDayDescription();
  await expect(newsPage.zeroAccidentDayImage).toBeVisible();
  await newsPage.goBack();
  await newsPage.goBack();
});