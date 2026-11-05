import { test } from '@playwright/test';
import { TamilNewsPage } from '../../pages/TamilNewsPage';

test('TC-NEWS-04: Compare approved CMS News with the News page', async ({ page, request }) => {
  const newsPage = new TamilNewsPage(page);
  const approvedCount = await newsPage.compareApprovedNews(request);
  if (approvedCount === 0) {
    test.info().annotations.push({
      type: 'data',
      description: 'No approved CMS News records are available; comparison is not applicable.',
    });
  }
});
