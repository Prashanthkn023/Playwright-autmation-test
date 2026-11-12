import { test, expect } from '@playwright/test';
import { CmsTamilABTPage } from '../../pages/CmsTamilABTPage';

test.describe('Tamil CMS ABT - UI Validation', () => {
  test.setTimeout(120000);

  test('validate UI elements and image loading across About Us and related pages', async ({ page }) => {
    const abtPage = new CmsTamilABTPage(page);

    await abtPage.openTamilHome('Tamil Home UI Validation', 'UI');

    // GCTP About Us UI
    await abtPage.openTamilAboutUsPage(
      'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
      '/chennai-gctp',
      'Navigate to GCTP About Us',
      'UI'
    );

    await expect(page.locator('.GCTPImg')).toBeVisible();
    await abtPage.expectImagesLoaded('.GCTPImg, .home-hero-card-imgGTGC > img', 'GCTP Images Loaded', 'UI');

    const updateCards = page.locator('.home-hero-card-imgGTGC > img');
    await expect(updateCards).toHaveCount(3);
    for (let index = 0; index < 3; index++) {
      await expect(updateCards.nth(index)).toBeVisible();
    }

    const updateDescriptions = page.locator('.home-hero-traffic-card-des');
    await expect(updateDescriptions).toHaveCount(3);
    for (let index = 0; index < 3; index++) {
      await expect(updateDescriptions.nth(index)).not.toBeEmpty();
    }

    // Commissioner Page UI
    await abtPage.openTamilAboutUsPage(
      'காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-policecommissioner',
      'Navigate to Commissioner Page',
      'UI'
    );

    await expect(page.locator('.CopPolice')).toBeVisible();
    await abtPage.expectImagesLoaded('img.CopPolice, .CopPolice img', 'Commissioner Images Loaded', 'UI');

    // Additional COP Page UI
    await abtPage.openTamilAboutUsPage(
      'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-additionalcop',
      'Navigate to Additional COP Page',
      'UI'
    );

    await expect(page.locator('.addcopPolice')).toBeVisible();
    await abtPage.expectImagesLoaded('img.addcopPolice, .addcopPolice img', 'Additional COP Images Loaded', 'UI');

    // Organogram Page UI
    await abtPage.openTamilAboutUsPage(
      'கட்டமைப்பு',
      '/chennai-organogram',
      'Navigate to Organogram Page',
      'UI'
    );

    const maintenanceMessage = page.getByText('Organisational structure updates in progress');
    if (await maintenanceMessage.isVisible()) {
      console.log('[UNAVAILABLE VALIDATION] Organogram content is currently under maintenance. Validation skipped as content is unavailable.');
    } else {
      const organogramItems = page.locator('li:visible');
      await expect(organogramItems).not.toHaveCount(0);

      const emptyOrganogramItems = await organogramItems.evaluateAll((items) =>
        items.filter((item) => !(item.textContent || '').trim()).length
      );

      expect(emptyOrganogramItems).toBe(0);
    }
  });
});
