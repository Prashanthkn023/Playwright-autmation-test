// spec: test-plans/tamil-media-news-test-plan.md
// seed: tests/seed.spec.ts

import { test } from '@playwright/test';
import { TamilMediaPage } from '../../pages/TamilMediaPage';

test.describe('Tamil Media module', () => {
  test('TC-MED-05: Complete Media journey', async ({ page }) => {
    const mediaPage = new TamilMediaPage(page);
    await mediaPage.open();
    await mediaPage.expectMediaJourney();
  });
});
