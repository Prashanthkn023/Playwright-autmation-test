// spec: test-plans/tamil-media-news-test-plan.md
// seed: tests/seed.spec.ts

import { test } from '@playwright/test';
import { TamilMediaPage } from '../../pages/TamilMediaPage';

test.describe('Tamil Media module', () => {
  test('TC-MED-04: Approved CMS/public API comparison', async ({ page, request }) => {
    const mediaPage = new TamilMediaPage(page);
    const approvedCount = await mediaPage.compareApprovedMedia(request);
    if (approvedCount === 0) {
      test.info().annotations.push({
        type: 'data',
        description: 'No approved CMS Media records are available; comparison is not applicable.',
      });
    }
  });
});
