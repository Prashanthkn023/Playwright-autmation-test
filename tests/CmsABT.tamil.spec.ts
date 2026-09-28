import { test, expect, Page } from '@playwright/test';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const baseurl = 'https://gctp.in';

async function selectTamil(page: Page) {
  const languageSelector = page.getByRole('combobox', { name: 'English' });

  if (await languageSelector.count()) {
    await languageSelector.click();
    await page.getByRole('option', { name: 'தமிழ்' }).click();
  }
}

async function openAboutUsPage(page: Page, href: string) {
  const mobileNavigation = page.getByRole('button', { name: 'Toggle navigation' });

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

test('verify Tamil About Us content with published website', async ({ page }) => {
  await page.goto(`${baseurl}/chennai-home`);
  await closeAwarenessPopup(page);
  await selectTamil(page);

  await openAboutUsPage(page, '/chennai-gctp');

  await expect(page.getByText('கிரேட்டர் சென்னை போக்குவரத்து போலீஸ்.', { exact: true }))
    .toBeVisible();
  await expect(page.getByText('1659 ஆம் ஆண்டு, அப்போது', { exact: false })).toBeVisible();

  await openAboutUsPage(page, '/chennai-policecommissioner');

  await expect(page.getByText('காவல்துறை ஆணையரின் செய்தி-போக்குவரத்து', { exact: true }))
    .toBeVisible();
  await expect(page.getByText('அன்புடைய சென்னை மக்களே', { exact: false })).toBeVisible();
  await expect(page.getByText('Thiru Dr. A. Amalraj, IPS, Commissioner of Police', { exact: true }))
    .toBeVisible();

  await openAboutUsPage(page, '/chennai-additionalcop');

  const additionalCopContent = await page.locator('body').innerText();
  expect(additionalCopContent).toContain('கூடுதல் காவல் ஆணையரின் செய்தி-போக்குவரத்து');

  await openAboutUsPage(page, '/chennai-organogram');

  const organogramContent = await page.locator('body').innerText();
  expect(organogramContent).toContain('காவல்');
});