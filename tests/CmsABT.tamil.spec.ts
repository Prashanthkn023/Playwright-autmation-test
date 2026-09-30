import { test, expect, Page } from '@playwright/test';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const baseUrl = 'https://gctp.in';

async function selectTamil(page: Page) {
  const languageSelector = page.getByRole('combobox', { name: 'English' });

  await languageSelector.click();
  await page.getByRole('option', { name: 'தமிழ்' }).click();

  await expect(
    page.getByRole('combobox', { name: 'தமிழ்' })
  ).toBeVisible();
}

async function openTamilHome(page: Page) {
  await page.goto(`${baseUrl}/chennai-home`, { waitUntil: 'domcontentloaded' });
  await closeAwarenessPopup(page);

  const awarenessPopup = page.locator('.flash-popup-overlay:visible').first();
  if (await awarenessPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
    const closeButton = awarenessPopup.getByRole('button').first();
    await closeButton.click({ force: true });
    await awarenessPopup.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => undefined);
  }

  await selectTamil(page);
}

async function openTamilAboutUsPage(
  page: Page,
  menuText: string,
  pageUrl: string
) {
  const aboutUsButton = page.getByRole('button', { name: 'துறை பற்றி' });
  await aboutUsButton.click();

  await page
    .getByRole('navigation')
    .getByText(menuText, { exact: true })
    .click();

  await expect(page).toHaveURL(new RegExp(`${pageUrl}$`));
  await expect(page.getByRole('combobox', { name: 'தமிழ்' })).toBeVisible();
}

async function expectTamilPageContent(page: Page, minimumCharacters: number) {
  const bodyText = await page.locator('body').innerText();
  const normalizedText = bodyText.replace(/\s+/g, ' ').trim();

  expect(normalizedText.length).toBeGreaterThan(minimumCharacters);
  expect(normalizedText).toMatch(/[அ-ஹ]/);
}

async function expectImagesLoaded(page: Page, selector: string) {
  const images = page.locator(selector);
  const imageCount = await images.count();

  expect(imageCount).toBeGreaterThan(0);

  for (let index = 0; index < imageCount; index++) {
    const image = images.nth(index);

    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /\S+/);
  }
}

test('verify all About Us content in Tamil', async ({ page }) => {
  test.setTimeout(120000);

  await openTamilHome(page);

  await openTamilAboutUsPage(
    page,
    'பெருநகர சென்னை போக்குவரத்து காவல் துறை',
    '/chennai-gctp'
  );

  await expect(page.getByText('கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.')).toBeVisible();
  await expect(page.getByText('1659 ஆம் ஆண்டு', { exact: false })).toBeVisible();
  await expect(page.locator('.GCTPImg')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'புதுப்பிப்புகள்' })).toBeVisible();
  await expectTamilPageContent(page, 1000);
  await expectImagesLoaded(page, '.GCTPImg, .home-hero-card-imgGTGC > img');

  const updateCards = page.locator('.home-hero-card-imgGTGC > img');
  await expect(updateCards).toHaveCount(3);

  for (let index = 0; index < 3; index++) {
    await expect(updateCards.nth(index)).toBeVisible();
  }

  await expect(
    page.getByText('போக்குவரத்து போலீசார்: சேவை மற்றும் சுகாதாரத்தில் ஒரு நூற்றாண்டு')
  ).toBeVisible();
  await expect(
    page.getByText('சென்னையில் முதல் போக்குவரத்து காவல் நிலையம்')
  ).toBeVisible();
  await expect(
    page.getByText('பிரிட்டிஷ் இராணுவ மற்றும் நிர்வாகப் பாரம்பர்யங்கள்.')
  ).toBeVisible();

  const updateDescriptions = page.locator('.home-hero-traffic-card-des');
  await expect(updateDescriptions).toHaveCount(3);

  for (let index = 0; index < 3; index++) {
    await expect(updateDescriptions.nth(index)).not.toBeEmpty();
  }

  await openTamilAboutUsPage(
    page,
    'காவல்துறை ஆணையரிடமிருந்து செய்தி',
    '/chennai-policecommissioner'
  );

  await expect(page.getByText('காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து')).toBeVisible();
  await expect(page.getByText('அன்புடைய சென்னை மக்களே', { exact: false })).toBeVisible();
  await expect(page.getByText('திரு டாக்டர் ஏ. அமல்ராஜ், ஐபிஎஸ்', { exact: false })).toBeVisible();
  await expect(page.locator('.CopPolice')).toBeVisible();
  await expectTamilPageContent(page, 500);
  await expectImagesLoaded(page, 'img.CopPolice, .CopPolice img');

  await openTamilAboutUsPage(
    page,
    'கூடுதல் காவல்துறை ஆணையரிடமிருந்து செய்தி',
    '/chennai-additionalcop'
  );

  await expect(page.getByText('கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து')).toBeVisible();
  await expect(page.getByText('அன்புள்ள சென்னை குடிமக்களே', { exact: false })).toBeVisible();
  await expect(page.getByText('டாக்டர் பி. ஷமூந்திரேச்வரி, ஐபிஎஸ்')).toBeVisible();
  await expect(page.locator('.addcopPolice')).toBeVisible();
  await expectTamilPageContent(page, 500);
  await expectImagesLoaded(page, 'img.addcopPolice, .addcopPolice img');

  await openTamilAboutUsPage(page, 'கட்டமைப்பு', '/chennai-organogram');

  await expect(page.getByText('அமைப்பியல்')).toBeVisible();
  await expect(page.getByText('துணை காவல் ஆணையர்', { exact: false })).toBeVisible();
  await expectTamilPageContent(page, 300);

  const organogramItems = page.locator('li:visible');
  await expect(organogramItems).not.toHaveCount(0);

  const emptyOrganogramItems = await organogramItems.evaluateAll((items) =>
    items.filter((item) => !(item.textContent || '').trim()).length
  );

  expect(emptyOrganogramItems).toBe(0);
});
