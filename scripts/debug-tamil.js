const { chromium } = require('playwright');

async function closeAwarenessPopup(page) {
  const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible';
  for (let attempt = 0; attempt < 3; attempt++) {
    const popup = page.locator(popupSelector).first();
    if (!(await popup.isVisible({ timeout: 3000 }).catch(() => false))) return;
    const closeButton = popup.getByRole('button').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 5000 }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
    if (await popup.waitFor({ state: 'hidden', timeout: 3000 }).then(() => true).catch(() => false)) return;
  }
}

async function selectTamil(page) {
  const languageSelector = page.getByRole('combobox', { name: 'English' });
  console.log('combo count', await languageSelector.count());
  if (await languageSelector.count()) {
    await languageSelector.click();
    await page.getByRole('option', { name: 'தமிழ்' }).click();
  }
}

async function openAboutUsPage(page, href) {
  const mobileNavigation = page.getByRole('button', { name: 'Toggle navigation' });
  console.log('mobile nav visible?', await mobileNavigation.isVisible().catch(() => false));
  if (await mobileNavigation.isVisible().catch(() => false)) {
    await mobileNavigation.click();
    const menu = page.getByRole('dialog');
    await menu.getByRole('link', { name: 'துறை பற்றி', exact: true }).click();
    await menu.locator(`a[href="${href}"]`).click();
  } else {
    const navigation = page.getByRole('navigation');
    await navigation.getByText('துறை பற்றி', { exact: true }).click();
    await navigation.locator(`a[href="${href}"]`).click();
  }
  await page.waitForURL(`**${href}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  try {
    console.log('goto');
    await page.goto('https://gctp.in/chennai-home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('after goto');
    await closeAwarenessPopup(page);
    console.log('after popup');
    await selectTamil(page);
    console.log('after select');
    await openAboutUsPage(page, '/chennai-gctp');
    console.log('after open about gctp');
    const txt = await page.locator('body').innerText();
    console.log('body begins:', txt.slice(0, 500));
  } catch (e) {
    console.log('ERROR', e && e.message || e);
  }
  await browser.close();
})();
