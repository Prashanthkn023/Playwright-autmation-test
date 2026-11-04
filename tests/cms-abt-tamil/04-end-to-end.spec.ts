import { test, expect } from '@playwright/test';
import { CmsTamilABTPage } from '../../pages/CmsTamilABTPage';

test.describe('Tamil CMS ABT - End-to-End Validation', () => {
  test.setTimeout(180000);

  test('complete end-to-end workflow across Tamil CMS ABT pages', async ({ page }) => {
    const abtPage = new CmsTamilABTPage(page);

    // Step 1: Open Home & Select Tamil
    await abtPage.openTamilHome('E2E Tamil Home Flow', 'E2E');
    await expect(page).toHaveURL(/chennai-home/);

    // Step 2: Navigate to GCTP About Us & verify core elements
    await abtPage.openTamilAboutUsPage(
      'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
      '/chennai-gctp',
      'E2E Navigate to GCTP About Us',
      'E2E'
    );
    await abtPage.expectTamilPageContent(800, 'E2E GCTP Content Check', 'E2E');
    await expect(page.locator('.GCTPImg')).toBeVisible();

    // Step 3: Navigate to Commissioner page & verify
    await abtPage.openTamilAboutUsPage(
      'காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-policecommissioner',
      'E2E Navigate to Commissioner Page',
      'E2E'
    );
    await abtPage.expectTamilPageContent(400, 'E2E Commissioner Content Check', 'E2E');
    await expect(page.locator('.CopPolice')).toBeVisible();

    // Step 4: Navigate to Additional COP page & verify
    await abtPage.openTamilAboutUsPage(
      'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-additionalcop',
      'E2E Navigate to Additional COP Page',
      'E2E'
    );
    await abtPage.expectTamilPageContent(400, 'E2E Additional COP Content Check', 'E2E');
    await expect(page.locator('.addcopPolice')).toBeVisible();

    // Step 5: Navigate to Organogram & verify
    await abtPage.openTamilAboutUsPage(
      'கட்டமைப்பு',
      '/chennai-organogram',
      'E2E Navigate to Organogram Page',
      'E2E'
    );
    await abtPage.expectTamilPageContent(200, 'E2E Organogram Content Check', 'E2E');

    const organogramItems = page.locator('li:visible');
    await expect(organogramItems).not.toHaveCount(0);
  });
});
