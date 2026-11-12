import { test, expect } from '@playwright/test';
import { CmsTamilABTPage } from '../../pages/CmsTamilABTPage';

test.describe('Tamil CMS ABT - Content Validation', () => {
  test.setTimeout(120000);

  test('validate Tamil content across About Us and related pages', async ({ page }) => {
    const abtPage = new CmsTamilABTPage(page);

    await abtPage.openTamilHome('Tamil Home Content Validation', 'CONTENT');

    // GCTP About Us Content
    await abtPage.openTamilAboutUsPage(
      'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
      '/chennai-gctp',
      'Navigate to GCTP About Us',
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'GCTP Heading',
      'கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'GCTP History Text',
      '1659 ஆம் ஆண்டு',
      false,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'Updates Heading',
      'புதுப்பிப்புகள்',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'Update 1 Title',
      'போக்குவரத்து போலீசார்: சேவை மற்றும் சுகாதாரத்தில் ஒரு நூற்றாண்டு',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'Update 2 Title',
      'சென்னையில் முதல் போக்குவரத்து காவல் நிலையம்',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'GCTP Content Check',
      'Update 3 Title',
      'பிரிட்டிஷ் இராணுவ மற்றும் நிர்வாகப் பாரம்பர்யங்கள்.',
      true,
      'CONTENT'
    );

    await abtPage.expectTamilPageContent('GCTP Page Tamil Content Completeness', 'CONTENT');

    // Commissioner Page Content
    await abtPage.openTamilAboutUsPage(
      'காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-policecommissioner',
      'Navigate to Commissioner Page',
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Commissioner Content Check',
      'Commissioner Heading',
      'காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Commissioner Content Check',
      'Commissioner Message',
      'அன்புடைய சென்னை மக்களே',
      false,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Commissioner Content Check',
      'Commissioner Name',
      'திரு டாக்டர் ஏ. அமல்ராஜ், ஐபிஎஸ்',
      false,
      'CONTENT'
    );

    await abtPage.expectTamilPageContent('Commissioner Page Tamil Content Completeness', 'CONTENT');

    // Additional COP Page Content
    await abtPage.openTamilAboutUsPage(
      'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-additionalcop',
      'Navigate to Additional COP Page',
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Additional COP Content Check',
      'Additional COP Heading',
      'கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து',
      true,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Additional COP Content Check',
      'Additional COP Message',
      'அன்புள்ள சென்னை குடிமக்களே',
      false,
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Additional COP Content Check',
      'Additional COP Name',
      'டாக்டர் பி. ஷமூந்திரேச்வரி, ஐபிஎஸ்',
      true,
      'CONTENT'
    );

    await abtPage.expectTamilPageContent('Additional COP Page Tamil Content Completeness', 'CONTENT');

    // Organogram Page Content
    await abtPage.openTamilAboutUsPage(
      'கட்டமைப்பு',
      '/chennai-organogram',
      'Navigate to Organogram Page',
      'CONTENT'
    );

    await abtPage.verifyAndLog(
      'Organogram Content Check',
      'Organogram Heading',
      'அமைப்பியல்',
      true,
      'CONTENT'
    );

    const organogramMaintenance = page.getByText('Organisational structure updates in progress');
    if (await organogramMaintenance.isVisible()) {
      console.log('[UNAVAILABLE VALIDATION] Organogram content is currently under maintenance. Subtext check skipped as content is unavailable.');
    } else {
      await abtPage.verifyAndLog(
        'Organogram Content Check',
        'Organogram Subtext',
        'துணை காவல் ஆணையர்',
        false,
        'CONTENT'
      );
    }

    await abtPage.expectTamilPageContent('Organogram Page Tamil Content Completeness', 'CONTENT');
  });
});
