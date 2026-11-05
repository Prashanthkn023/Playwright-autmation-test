import { test } from '@playwright/test';
import { TamilNewsPage } from '../../pages/TamilNewsPage';

test('TC-NEWS-02: Verify News UI layout and images', async ({ page }) => {
  const newsPage = new TamilNewsPage(page);
  await newsPage.open();
  await newsPage.expectCardsAndImagesLoaded();
  await newsPage.expectCardsDoNotOverlap();
});
