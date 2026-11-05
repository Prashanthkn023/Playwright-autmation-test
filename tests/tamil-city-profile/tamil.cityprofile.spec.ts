import { test, expect, Page } from '@playwright/test';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const baseUrl = 'https://gctp.in';

async function selectTamil(page: Page): Promise<void> {
  const languageSelector = page.getByRole('combobox', {
    name: 'English',
  });
  await expect(languageSelector).toBeVisible();
  await languageSelector.click();
  await page.getByRole('option', { name: 'தமிழ்' }).click();
  await expect(
    page.getByRole('combobox', { name: 'தமிழ்' })
  ).toBeVisible();
}

test('verify Tamil City Profile content', async ({ page }) => {
  await page.goto(`${baseUrl}/chennai-home`, {
    waitUntil: 'domcontentloaded',
  });
  await closeAwarenessPopup(page);
  await selectTamil(page);

  await page.getByRole('link', { name: 'நகர சுயவிவரம்' }).click();

  await expect(page.getByRole('link', { name: 'நகர சுயவிவரம்' })).toBeVisible();
  await expect(page.getByText('நகர சுயவிவரம்').nth(2)).toBeVisible();
  await expect(
    page.getByText(
      'சென்னை என்பது ஒரு பெருநகரம் மட்டுமல்ல; நவீன வாழ்க்கைக்கு அழகூட்டும் கலாச்சாரம், '
    )
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'சிறந்த கவர்ச்சிகள்' })
  ).toBeVisible();
  await expect(page.locator('.GCTPImg')).toBeVisible();

  const attractionImages = page.locator('.home-hero-card-imgGTGC > img');
  await expect(attractionImages).toHaveCount(3);
  await expect(attractionImages.nth(0)).toBeVisible();

  await page.getByText('மேலும் வாசிக்கவும்').first().click();
  await expect(page.locator('#root')).toContainText(
    'குழந்தைகள் சாலை பாதுகாப்பு மற்றும் போக்குவரத்து பூங்கா'
  );
  await expect(page.locator('#root')).toContainText(
    'வேபரி க போக்குவரத்து பூங்கா சென்னை நகரில் வரலாற்றுப்பூர்வமான முக்கியமான சாலை பாதுகாப்பு கல்வியறிவு பகுதி ஆகும்'
  );

  await expect(attractionImages.nth(1)).toBeVisible();
  await expect(page.getByText('போலீஸ் நினைவு மரபு')).toBeVisible();
  await page.getByText('மேலும் வாசிக்கவும்').first().click();
  await expect(page.locator('#root')).toContainText(
    'மண்மொழிப்பு தினத்தை குறிக்கும் போலீஸ் நினைவுநாள் ஒவ்வாண்டும் அக்டோபர் 21-ஆம் தேதி நடைபெறும் போது'
  );

  await expect(attractionImages.nth(2)).toBeVisible();
  await expect(
    page.getByText('தமிழ்நாடு மாநில காவல் படை அருங்காட்சியகம்')
  ).toBeVisible();
  await page.getByText('மேலும் வாசிக்கவும்').first().click();
  await expect(page.locator('#root')).toContainText(
    'அருங்காட்சியகம் பழைய மெட்ராஸ் போலீஸ் கமிஷனரின் அலுவலகத்திலிருந்து இயங்குகிறது, இது முதலில் 1842 இல் கட்டப்பட்டது மற்றும் 1856 இல் போலீஸ் நிர்வாகம் வாங்கியது.'
  );
  await expect(page.locator('#root')).toContainText('குறைவாக வாசிக்கவும்');

  await expect(page.getByRole('img', { name: 'Nature' })).toBeVisible();
  await expect(
    page.getByText('Greater Chennai Traffic Police')
  ).toBeVisible();
  await expect(
    page.getByText('சென்னை பெருநகர போக்குவரத்து காவல்துறை')
  ).toBeVisible();
});
