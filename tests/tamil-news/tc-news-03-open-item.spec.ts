import { test } from '@playwright/test';
import { TamilNewsPage } from '../../pages/TamilNewsPage';

test('TC-NEWS-03: Open a News item', async ({ page }) => {
  const newsPage = new TamilNewsPage(page);
  await newsPage.open();
  await newsPage.openNewsItem();
  await newsPage.expectNewsDetailContent();
});
