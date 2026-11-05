import { test } from '@playwright/test';
import { TamilNewsPage } from '../../pages/TamilNewsPage';

test('TC-NEWS-01: Validate News content in Tamil', async ({ page }) => {
  const newsPage = new TamilNewsPage(page);
  await newsPage.open();
  await newsPage.expectTamilContent();
});
