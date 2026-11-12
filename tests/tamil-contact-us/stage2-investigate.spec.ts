import { test, expect } from '@playwright/test';
import { TamilContactUsPage } from './TamilContactUsPage';

test('Stage 2: Frontend Investigation', async ({ page }) => {
  const contactPage = new TamilContactUsPage(page);

  // 1. Reproduce TC-CON-02: Layout/Clipping
  await contactPage.openInTamil();
  await page.setViewportSize({ width: 390, height: 844 });
  const tableBox = await contactPage.table.boundingBox();
  await page.screenshot({ path: 'clipping-390px.png' });
  console.log('390px Layout Box:', JSON.stringify(tableBox));

  // 2. Reproduce TC-CON-03: Actionable Links
  const phoneLinks = await page.locator('table td').nth(2).locator('a').count();
  const emailLinks = await page.locator('table td').nth(3).locator('a').count();
  console.log('Phone links count:', phoneLinks);
  console.log('Email links count:', emailLinks);

  // 3. Reproduce TC-CON-06: Popup Overlay
  // Need to observe the home page and wait for popup
  await page.goto('/chennai-home');
  const popup = page.locator('.flash-popup-overlay');
  if (await popup.isVisible()) {
      await page.screenshot({ path: 'popup-overlay.png' });
      console.log('Popup overlay detected and captured.');
  } else {
      console.log('No popup overlay detected.');
  }
});
