import { test, expect } from '../fixtures/baseTest';
import { CmsTamilABTPage } from '../pages/CmsTamilABTPage';

test.describe('CmsTamilABT – 01 Content Validation', () => {
  test('Validate Chennai GCTP department content', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    const testName = 'Validate Chennai GCTP department content';
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
      '/chennai-gctp'
    );

    expect(await cmsTamilAbt.verifyAndLog(testName, 'Heading', 'கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.'), 'Heading text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'History year text', '1659 ஆம் ஆண்டு', false), 'History year text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Subtitle', 'போக்குவரத்து போலீசார்: சேவை மற்றும் சுகாதாரத்தில் ஒரு நூற்றாண்டு'), 'Subtitle text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'First police station text', 'சென்னையில் முதல் போக்குவரத்து காவல் நிலையம்'), 'First police station text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'British administration text', 'பிரிட்டிஷ் இராணுவ மற்றும் நிர்வாகப் பாரம்பர்யங்கள்.'), 'British administration text mismatch').toBe(true);
  });

  test('Validate Commissioner message content', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    const testName = 'Validate Commissioner message content';
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-policecommissioner'
    );

    expect(await cmsTamilAbt.verifyAndLog(testName, 'Page title', 'காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து'), 'Page title mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Salutation', 'அன்புடைய சென்னை மக்களே', false), 'Salutation text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Name and title', 'திரு டாக்டர் ஏ. அமல்ராஜ், ஐபிஎஸ்', false), 'Name and title mismatch').toBe(true);
  });

  test('Validate Additional Commissioner message content', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    const testName = 'Validate Additional Commissioner message content';
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage(
      'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
      '/chennai-additionalcop'
    );

    expect(await cmsTamilAbt.verifyAndLog(testName, 'Page title', 'கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து'), 'Page title mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Salutation', 'அன்புள்ள சென்னை குடிமக்களே', false), 'Salutation text mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Name and title', 'டாக்டர் பி. ஷமூந்திரேச்வரி, ஐபிஎஸ்'), 'Name and title mismatch').toBe(true);
  });

  test('Validate organogram content', async ({ page }) => {
    test.setTimeout(120000);
    const cmsTamilAbt = new CmsTamilABTPage(page);
    const testName = 'Validate organogram content';
    await cmsTamilAbt.openTamilHome();
    await cmsTamilAbt.openTamilAboutUsPage('கட்டமைப்பு', '/chennai-organogram');

    expect(await cmsTamilAbt.verifyAndLog(testName, 'Page title', 'அமைப்பியல்'), 'Page title mismatch').toBe(true);
    expect(await cmsTamilAbt.verifyAndLog(testName, 'Role text', 'துணை காவல் ஆணையர்', false), 'Role text mismatch').toBe(true);
  });
});
