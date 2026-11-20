import { test, expect } from '@playwright/test';

test('GCTP external links navigation test', async ({ page }) => {
  await page.goto('https://gctp.in/');
  await page.goto('https://gctp.in/chennai-home');

  // Dismiss overlay popup if present
  const popupClose = page.getByRole('button', { name: '✕' });
  if (await popupClose.isVisible({ timeout: 5000 }).catch(() => false)) {
    await popupClose.click();
  }

  // Locate and interact with the Vehicle Challan dropdown/menu
  const vehicleChallanBtn = page.getByRole('button', { name: 'Vehicle Challan' });
  await expect(vehicleChallanBtn).toBeVisible();
  await vehicleChallanBtn.hover();

  // 1. eChallan Popup Verification
  const eChallanLink = page.getByRole('link', { name: 'eChallan' });
  await expect(eChallanLink).toBeVisible();
  const eChallanHref = await eChallanLink.getAttribute('href');
  console.log('ACTUAL_ECHALLAN_HREF:', eChallanHref);

  const page1Promise = page.waitForEvent('popup');
  await eChallanLink.click();
  const page1 = await page1Promise;
  await page1.waitForLoadState();
  console.log('ACTUAL_ECHALLAN_URL:', page1.url());
  expect(page1.url()).toBe(eChallanHref);
  await page1.close();

  // Re-open/hover menu for Parivahan
  await vehicleChallanBtn.hover();

  // 2. Parivahan Popup Verification
  const parivahanLink = page.getByRole('link', { name: 'Parivahan', exact: true });
  await expect(parivahanLink).toBeVisible();
  const parivahanHref = await parivahanLink.getAttribute('href');
  console.log('ACTUAL_PARIVAHAN_HREF:', parivahanHref);

  const page2Promise = page.waitForEvent('popup');
  await parivahanLink.click();
  const page2 = await page2Promise;
  await page2.waitForLoadState();
  console.log('ACTUAL_PARIVAHAN_URL:', page2.url());
  expect(page2.url()).toBe(parivahanHref);
  await page2.close();

  // 3. Tamil Nadu Police Popup/Navigation Verification
  const tnPoliceLink = page.getByRole('link', { name: 'Tamil Nadu Police' });
  await expect(tnPoliceLink).toBeVisible();
  const tnPoliceHref = await tnPoliceLink.getAttribute('href');
  console.log('ACTUAL_TN_POLICE_HREF:', tnPoliceHref);

  const page3Promise = page.waitForEvent('popup');
  await tnPoliceLink.click();
  const page3 = await page3Promise;
  await page3.waitForLoadState();
  console.log('ACTUAL_TN_POLICE_URL:', page3.url());
  expect(page3.url()).toBe(tnPoliceHref);
  await page3.close();
});
