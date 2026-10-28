import { test } from '../fixtures/baseTest';
import { CmsTamilABTPage } from '../pages/CmsTamilABTPage';

test.describe('CmsTamilABT – 04 End-to-End Workflow Validation', () => {
  test('Complete Tamil ABT User Journey E2E', async ({ page }) => {
    test.setTimeout(180000);
    const cmsTamilAbt = new CmsTamilABTPage(page);

    // Step 1: Open Home Page and Switch Language to Tamil
    await cmsTamilAbt.openTamilHome();

    // Step 2: Navigate to Chennai GCTP About Us
    await cmsTamilAbt.openTamilAboutUsPage('பெருநகர சென்னை போக்குவரத்து காவல் துறை', '/chennai-gctp');

    // Step 3: Navigate to Commissioner Message
    await cmsTamilAbt.openTamilAboutUsPage('காவல்துறை ஆணையரிடமிருந்து செய்தி', '/chennai-policecommissioner');

    // Step 4: Navigate to Additional Commissioner Message
    await cmsTamilAbt.openTamilAboutUsPage('கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி', '/chennai-additionalcop');

    // Step 5: Navigate to Organogram
    await cmsTamilAbt.openTamilAboutUsPage('கட்டமைப்பு', '/chennai-organogram');
  });
});
