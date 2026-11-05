// spec: test-plans/tamil-media-news-test-plan.md
// seed: tests/cms-abt-tamil/01-content-validation.spec.ts

import { test } from '@playwright/test';
import { TamilMediaPage } from '../../pages/TamilMediaPage';

test.describe('Tamil Media module', () => {
  test('TC-MED-01: Validate Media content in Tamil', async ({ page }) => {
    const mediaPage = new TamilMediaPage(page);
    await mediaPage.open();
    await mediaPage.expectTamilMediaContent();
  });
});
