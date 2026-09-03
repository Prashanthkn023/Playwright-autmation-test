import { expect, test } from '@playwright/test';
import { CmsMediaPage } from "../pages/CmsMediaPage";

test('verfiy the cms media page content', async ({ page }) => {
        const mediaPage = new CmsMediaPage(page);

        await mediaPage.openHomePage();
        await mediaPage.openMedia();
        await expect(mediaPage.mediaNavigationText).toBeVisible();
        await expect(mediaPage.photosHeading).toBeVisible();
        await expect(mediaPage.photoImages.first()).toBeVisible();
        await expect(mediaPage.helmetAwarenessDrive).toBeVisible();
        await mediaPage.openPhotoDetails();
        await expect(mediaPage.helmetAwarenessDescription).toBeVisible();
        await expect(mediaPage.photoImages.nth(1)).toBeVisible();
        await expect(mediaPage.roadSafetyQuiz).toBeVisible();
        await mediaPage.openPhotoDetails();
        await expect(mediaPage.roadSafetyQuizDescription).toBeVisible();
        await expect(mediaPage.photoImages.nth(2)).toBeVisible();
        await expect(mediaPage.rideForRoadSafety).toBeVisible();
        await mediaPage.openPhotoDetails();
        await expect(mediaPage.rideForRoadSafetyDescription).toBeVisible();
        await mediaPage.openVideos();
        await expect(mediaPage.video).toBeVisible();
        await expect(mediaPage.helmetVideoTitle).toBeVisible();
        await expect(mediaPage.helmetVideoDescription).toBeVisible();
        await expect(mediaPage.iframes).toHaveCount(3);
        await expect(mediaPage.iframes.nth(1)).toBeVisible();
        expect(await mediaPage.getIframeSource(1)).toContain('youtube.com/embed');
        await expect(mediaPage.airConditionedHelmet).toBeVisible();
        await expect(mediaPage.airConditionedHelmetDescription).toBeVisible();
        await expect(mediaPage.iframes.nth(2)).toBeVisible();
        expect(await mediaPage.getIframeSource(2)).toContain('youtube.com/embed');
        await expect(mediaPage.trafficAlert).toBeVisible();
        await mediaPage.openTrafficUpdate();
        await expect(mediaPage.trafficUpdate).toContainText(
            'Nungambakkam High Road CMRL Crane Breakdown near Therasha Church'
        );
        await expect(mediaPage.trafficUpdate).toContainText('Engineers on-site');
});
