import { expect, test } from '@playwright/test';
import { CmsCityPage } from '../pages/CmsCityPage';

test('verify the cms City profile page content', async ({ page }) => {
    const cityPage = new CmsCityPage(page);

    await cityPage.openHomePage();
    await cityPage.openCityProfile();

    await expect(cityPage.cityProfileHeading).toBeVisible();
    await expect(cityPage.cityDescription).toBeVisible();
    await expect(cityPage.topAttractionsHeading).toBeVisible();
    await expect(cityPage.firstAttractionImage).toBeVisible();
    await expect(cityPage.childrenRoadSafetyPark).toBeVisible();
    await expect(cityPage.childrenRoadSafetyParkDescription).toBeVisible();
    await expect(cityPage.policeMemorialImage).toBeVisible();
    await expect(cityPage.policeMemorial).toBeVisible();
    await expect(cityPage.policeMemorialDescription).toBeVisible();
    await expect(cityPage.policeMuseumImage).toBeVisible();
    await expect(cityPage.policeMuseum).toBeVisible();
    await expect(cityPage.policeMuseumDescription).toBeVisible();
    await expect(cityPage.gctpImage).toBeVisible();
});