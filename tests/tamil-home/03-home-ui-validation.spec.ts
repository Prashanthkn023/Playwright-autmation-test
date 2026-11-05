import { test, expect } from '../fixtures/baseTest';

test.describe('Tamil Home Module – 03 UI Validation', () => {
  test.beforeEach(async ({ cmsTamil }) => {
    await cmsTamil.navigateToTamil();
  });

  test('Verify Tamil language is selected and dropdown shows Tamil', async ({ cmsTamil }) => {
    await cmsTamil.verifyTamilLanguageSelected();
  });

  test('Verify home page content character count and Tamil script', async ({ cmsTamil, page }) => {
    const bodyText = await page.locator('body').innerText();
    const normalizedText = bodyText.replace(/\s+/g, ' ').trim();
    expect(normalizedText.length).toBeGreaterThan(100);
    expect(normalizedText).toMatch(/[஀-௿]/);
  });

  test('Verify Home Page Sliders', async ({ cmsTamil }) => {
    await cmsTamil.verifyHomePageSlidersTamil();
  });

  test('Verify Education Section', async ({ cmsTamil }) => {
    await cmsTamil.verifyEducationSectionTamil();
  });

  test('Verify Image Loading', async ({ cmsTamil }) => {
    await cmsTamil.verifyImagesLoadedTamil();
  });
});
