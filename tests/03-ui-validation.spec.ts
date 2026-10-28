import { test, expect } from '../fixtures/baseTest';
import { CmsTamilABTPage } from '../pages/CmsTamilABTPage';

test.describe('CmsTamilABT – 03 UI Validation', () => {
  test('Verify Tamil About Us (Chennai GCTP) UI Layout and Images', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
      '/chennai-gctp'
    );

    await expect(page.getByText('கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.')).toBeVisible();
    await expect(page.getByText('1659 ஆம் ஆண்டு', { exact: false })).toBeVisible();
    await expect(page.locator('.GCTPImg')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'புதுப்பிப்புகள்' })).toBeVisible();
    await cmsTamilAbt.expectTamilPageContent(1000);
    await cmsTamilAbt.expectImagesLoaded('.GCTPImg, .home-hero-card-imgGTGC > img');

    const updateCards = page.locator('.home-hero-card-imgGTGC > img');
    await expect(updateCards).toHaveCount(3);
    for (let index = 0; index < 3; index++) {
      await expect(updateCards.nth(index)).toBeVisible();
    }
  });

  test('Verify Commissioner Message UI Layout and Images', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-policecommissioner'
    );

    await expect(page.getByText('காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து')).toBeVisible();
    await expect(page.getByText('அன்புடைய சென்னை மக்களே', { exact: false })).toBeVisible();
    await expect(page.getByText('திரு டாக்டர் ஏ. அமல்ராஜ், ஐபிஎஸ்', { exact: false })).toBeVisible();
    await expect(page.locator('.CopPolice')).toBeVisible();
    await cmsTamilAbt.expectTamilPageContent(500);
    await cmsTamilAbt.expectImagesLoaded('img.CopPolice, .CopPolice img');
  });

  test('Verify Additional Commissioner Message UI Layout and Images', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-additionalcop'
    );

    await expect(page.getByText('கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து')).toBeVisible();
    await expect(page.getByText('அன்புள்ள சென்னை குடிமக்களே', { exact: false })).toBeVisible();
    await expect(page.getByText('டாக்டர் பி. ஷமூந்திரேச்வரி, ஐபிஎஸ்')).toBeVisible();
    await expect(page.locator('.addcopPolice')).toBeVisible();
    await cmsTamilAbt.expectTamilPageContent(500);
    await cmsTamilAbt.expectImagesLoaded('img.addcopPolice, .addcopPolice img');
  });

  test('Verify Organogram Structural Integrity', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage('கட்டமைப்பு', '/chennai-organogram');

    await expect(page.getByText('அமைப்பியல்')).toBeVisible();
    await expect(page.getByText('துணை காவல் ஆணையர்', { exact: false })).toBeVisible();
    await cmsTamilAbt.expectTamilPageContent(300);

    const organogramItems = page.locator('li:visible');
    await expect(organogramItems).not.toHaveCount(0);

    const emptyOrganogramItems = await organogramItems.evaluateAll((items) =>
      items.filter((item) => !(item.textContent || '').trim()).length
    );
    expect(emptyOrganogramItems).toBe(0);
  });
});
