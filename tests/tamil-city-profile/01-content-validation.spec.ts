import { test, expect } from '../../fixtures/baseTest';

test.describe('Tamil City Profile Content Validation', () => {
  test('verify Tamil City Profile page heading, description and content sections', async ({ cmsTamilCity, page }) => {
    await page.goto('https://gctp.in/chennai-home');
    await cmsTamilCity.selectTamil();
    await cmsTamilCity.cityProfileLink.click();

    await expect(cmsTamilCity.cityProfileHeading).toBeVisible();
    await expect(cmsTamilCity.cityDescription).toBeVisible();
    await expect(cmsTamilCity.topAttractionsHeading).toBeVisible();

    // Check for some expected content
    await expect(page.getByText('சென்னை என்பது ஒரு பெருநகரம் மட்டுமல்ல; நவீன வாழ்க்கைக்கு அழகூட்டும் கலாச்சாரம்,')).toBeVisible();
  });
});
