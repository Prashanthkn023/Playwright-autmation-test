import { test } from '@playwright/test';
import { TamilNewsPage } from '../../pages/TamilNewsPage';

test('TC-NEWS-05: Complete Tamil News user journey', async ({ page }) => {
  const newsPage = new TamilNewsPage(page);
  await newsPage.open();
  await newsPage.expectCompleteJourney();
});
