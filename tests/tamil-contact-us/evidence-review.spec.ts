import { test, expect } from '@playwright/test';
import { TamilContactUsPage } from './TamilContactUsPage';

test('Stage 2: Final Evidence Review', async ({ page }) => {
  const contactPage = new TamilContactUsPage(page);
  await contactPage.openInTamil();

  // 1. DEF-03: Responsive Table/Container Dimensions
  const table = contactPage.table;
  const tableInfo = await table.evaluate(el => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    overflowX: window.getComputedStyle(el).overflowX
  }));
  console.log('DEF-03_TABLE_DIMENSIONS:', JSON.stringify(tableInfo));

  const parent = await table.evaluateHandle(el => el.parentElement);
  const parentInfo = await parent.evaluate(el => {
    if (!el) {
      return { scrollWidth: 0, clientWidth: 0, overflowX: '' };
    }
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX: window.getComputedStyle(el).overflowX
    };
  });
  console.log('DEF-03_PARENT_DIMENSIONS:', JSON.stringify(parentInfo));

  // 2. DEF-01: Actionable Link Requirements Verification
  // Check the DOM structure for phone/email to verify implementation
  const cell0 = await table.locator('tbody tr').first().locator('td').nth(2).evaluate(el => el.innerHTML);
  console.log('DEF-01_CELL_CONTENT:', cell0);

  // 3. DEF-02: Popup Dismissal & Navigation
  await page.goto('/chennai-home');
  const popupClose = page.getByRole('button', { name: '✕' });
  const isPopupVisible = await popupClose.isVisible();
  console.log('DEF-02_POPUP_VISIBLE:', isPopupVisible);

  if (isPopupVisible) {
      await popupClose.click();
      console.log('DEF-02_POPUP_DISMISSED: true');
  }

  await page.locator('#language-select').click();
  await page.getByRole('option', { name: 'தமிழ்' }).click();

  // Verify Tamil navigation visibility before clicking
  const tamilNav = page.getByRole('link', { name: 'தொடர்பு' });
  await expect(tamilNav).toBeVisible();
  await tamilNav.click();
  console.log('DEF-02_NAV_SUCCESS: true');
});
