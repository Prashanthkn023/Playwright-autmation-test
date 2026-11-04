import { test, expect } from '../fixtures/baseTest';

test.describe('Tamil City Profile End-to-End', () => {
  test('complete Tamil City Profile journey', async ({ cmsTamilCity, page }) => {
    await page.goto('https://gctp.in/chennai-home');
    await cmsTamilCity.selectTamil();

    // Navigate to City Profile
    await cmsTamilCity.cityProfileLink.click();

    // Verify content
    await expect(cmsTamilCity.cityProfileHeading).toBeVisible();
    await expect(cmsTamilCity.cityDescription).toBeVisible();

    // Interact with "Read More"
    await cmsTamilCity.clickReadMore();
    await expect(page.locator('#root')).toContainText('குழந்தைகள் சாலை பாதுகாப்பு மற்றும் போக்குவரத்து பூங்கா');
  });
});
