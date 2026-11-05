import { test, expect } from '../../fixtures/baseTest';

test.describe('Tamil City Profile UI Validation', () => {
  test('verify Tamil City Profile UI visibility, image loading and responsive elements', async ({ cmsTamilCity, page }) => {
    await page.goto('https://gctp.in/chennai-home');
    await cmsTamilCity.selectTamil();
    await cmsTamilCity.cityProfileLink.click();

    await expect(cmsTamilCity.cityProfileImage).toBeVisible();

    const attractionImages = page.locator('.home-hero-card-imgGTGC > img');
    await expect(attractionImages.first()).toBeVisible();
  });
});
