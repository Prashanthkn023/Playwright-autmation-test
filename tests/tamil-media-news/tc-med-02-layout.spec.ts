// spec: test-plans/tamil-media-news-test-plan.md
// seed: tests/seed.spec.ts

import { test } from '@playwright/test';
import { TamilMediaPage } from '../../pages/TamilMediaPage';

test.describe('Tamil Media module', () => {
  test('TC-MED-02: Layout and image validation', async ({ page }) => {
    const mediaPage = new TamilMediaPage(page);
    await mediaPage.open();
    await mediaPage.openPhotos();
    await mediaPage.expectCardsHaveLoaded();
    await mediaPage.expectCardsDoNotOverlap();
    await mediaPage.expectPhotoImagesLoaded();

    await mediaPage.openVideos();
    await mediaPage.expectCardsHaveLoaded();
    await mediaPage.expectCardsDoNotOverlap();
    await mediaPage.expectVideoMediaLoaded();
  });
});
