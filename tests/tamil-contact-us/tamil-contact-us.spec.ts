import { expect, test, type Page } from '@playwright/test';
import { TamilContactUsPage } from './TamilContactUsPage';
import { tamilContactUsLabels } from './tamilContactUsLabels';

const tamilScript = /[\u0B80-\u0BFF]/;

async function openContactUs(page: Page) {
  const contactPage = new TamilContactUsPage(page);
  await contactPage.openInTamil();
  await expect(contactPage.table).toBeVisible();
  return contactPage;
}

test.describe('Tamil Contact Us', () => {
  test('TC-CON-01: Validate Contact Us content in Tamil', async ({ page }) => {
    const contactPage = await openContactUs(page);

    // 1. Open the public website, switch to Tamil, and open Contact Us.
    await expect(page.getByRole('link', { name: tamilContactUsLabels.navigation })).toBeVisible();

    // 2. Verify the Contact Us heading and Tamil table headings.
    await expect(contactPage.table.getByText(tamilContactUsLabels.title)).toBeVisible();
    for (const label of tamilContactUsLabels.columnHeaders) {
      await expect(contactPage.table.getByText(label, { exact: true })).toBeVisible();
    }

    // 3. Verify officer names and designations contain Tamil script and details are formatted.
    const rows = contactPage.table.locator('tbody tr');
    expect(await rows.count(), 'The public page should show at least one contact record').toBeGreaterThan(0);
    for (const row of await rows.all()) {
      const nameCell = row.locator('td').nth(0);
      const designationCell = row.locator('td').nth(1);
      const phoneCell = row.locator('td').nth(2);
      const emailCell = row.locator('td').nth(3);

      // Tamil script validation for Name and Designation only (td.nth(0) and td.nth(1))
      await expect(nameCell, `Name cell in row should contain Tamil: ${await nameCell.innerText()}`).toContainText(tamilScript);
      await expect(designationCell, `Designation cell in row should contain Tamil: ${await designationCell.innerText()}`).toContainText(tamilScript);

      // Phone (td.nth(2)) and Email (td.nth(3)) format validation
      const phoneText = (await phoneCell.innerText()).trim();
      const emailText = (await emailCell.innerText()).trim();
      expect(phoneText, `Phone number format mismatch: ${phoneText}`).toMatch(/^\+?[\d\s()-]{7,}$/);
      expect(emailText, `Email format mismatch: ${emailText}`).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });

  test('TC-CON-02: Verify Contact Us layout and media at desktop, tablet, and mobile sizes', async ({ page }) => {
    const contactPage = await openContactUs(page);

    // 1. Scroll through the Contact Us page and verify its images are loaded.
    for (const image of await page.locator('img').all()) {
      await expect(image).toHaveAttribute('src', /.+/);
      await expect(image).toHaveJSProperty('complete', true);
      await expect(image).not.toHaveJSProperty('naturalWidth', 0);
    }

    // 2. Check that the contact table fits or scrolls properly at desktop, tablet, and mobile widths.
    for (const viewport of [{ width: 1366, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await expect(contactPage.table).toBeVisible();

      if (viewport.width === 1366) {
        // Desktop: Table should fit without horizontal scrollbar on parent
        const tableBox = await contactPage.table.boundingBox();
        expect(tableBox, `Contact table should have a layout box at ${viewport.width}px`).not.toBeNull();
        if (tableBox) {
          expect(tableBox.x, 'Contact table should not be clipped on the left').toBeGreaterThanOrEqual(0);
          expect(tableBox.x + tableBox.width, `Contact table should fit at ${viewport.width}px`).toBeLessThanOrEqual(viewport.width);
        }
      } else {
        // Tablet / Mobile: Parent should have overflow-x and support horizontal scroll
        const scrollInfo = await contactPage.table.evaluate(table => {
          const parent = table.parentElement;
          if (!parent) return { hasParent: false, overflowX: '', scrollWidth: 0, clientWidth: 0, isScrollable: false };
          const style = window.getComputedStyle(parent);
          return {
            hasParent: true,
            overflowX: style.overflowX,
            scrollWidth: parent.scrollWidth,
            clientWidth: parent.clientWidth,
            isScrollable: parent.scrollWidth > parent.clientWidth
          };
        });

        expect(scrollInfo.hasParent).toBe(true);
        expect(['auto', 'scroll']).toContain(scrollInfo.overflowX);
        expect(scrollInfo.isScrollable, `Parent container should be scrollable at viewport width ${viewport.width}px`).toBe(true);

        // Verify container can scroll and make the last column visible
        await contactPage.table.evaluate(table => {
          const parent = table.parentElement;
          if (parent) {
            parent.scrollLeft = parent.scrollWidth - parent.clientWidth;
          }
        });

        const isLastColumnScrolledIn = await contactPage.table.evaluate(table => {
          const rows = table.querySelectorAll('tr');
          if (rows.length === 0) return false;
          const lastCell = rows[0].lastElementChild;
          if (!lastCell) return false;
          const rect = lastCell.getBoundingClientRect();
          const parent = table.parentElement;
          if (!parent) return false;
          const parentRect = parent.getBoundingClientRect();
          return rect.right <= parentRect.right + 2 && rect.right > parentRect.left;
        });

        expect(isLastColumnScrolledIn, 'The last table column should be accessible and fully visible after scrolling to the right').toBe(true);

        // Reset scroll position
        await contactPage.table.evaluate(table => {
          const parent = table.parentElement;
          if (parent) {
            parent.scrollLeft = 0;
          }
        });
      }

      const rows = await contactPage.table.locator('tbody tr').all();
      const rowBoxes = await Promise.all(rows.map(row => row.boundingBox()));
      for (let index = 1; index < rowBoxes.length; index++) {
        const previous = rowBoxes[index - 1];
        const current = rowBoxes[index];
        expect(previous).not.toBeNull();
        expect(current).not.toBeNull();
        if (previous && current) expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height);
      }
    }
  });

  test('TC-CON-03: Verify contact details and text visibility', async ({ page }) => {
    const contactPage = await openContactUs(page);

    // 1. Verify table rows are present and contain contact details.
    const rows = contactPage.table.locator('tbody tr');
    // The table might be rendering slowly, wait for rows to be present
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await rows.count();
    expect(rowCount, 'Contact table should contain at least 8 records').toBeGreaterThanOrEqual(8);

    // 2. Verify displayed phone numbers and emails are visible and have valid formats in table cells.
    for (const row of await rows.all()) {
      const phoneCell = row.locator('td').nth(2);
      const emailCell = row.locator('td').nth(3);

      await expect(phoneCell).toBeVisible();
      await expect(emailCell).toBeVisible();

      const phoneText = (await phoneCell.innerText()).trim();
      const emailText = (await emailCell.innerText()).trim();

      expect(phoneText, `Phone number format mismatch: ${phoneText}`).toMatch(/^\+?[\d\s()-]{7,}$/);
      expect(emailText, `Email format mismatch: ${emailText}`).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    // 3. Verify any direction or map links target valid URLs if present.
    const mapLinks = page.locator('a[href*="maps"]');
    if (await mapLinks.count() > 0) {
      for (const link of await mapLinks.all()) {
        await expect(link).toHaveAttribute('href', /^https?:\/\//);
      }
    }
  });

  test('TC-CON-04: Validate empty Contact Us form in Tamil without production submission', async ({ page }) => {
    await openContactUs(page);
    const form = page.locator('form').first();
    if (await form.count() === 0) {
      test.skip(true, 'No Contact Us form is currently rendered on the live page.');
    }

    const hostname = new URL(page.url()).hostname;
    if (hostname === 'gctp.in' || hostname === 'www.gctp.in') {
      test.skip(true, 'Form validation is exercised only against an authorized non-production environment.');
    }

    // 1. Verify field labels or placeholders contain Tamil text.
    const fields = form.locator('input:not([type="hidden"]), textarea, select');
    await expect(fields.first()).toBeVisible();
    for (const field of await fields.all()) {
      const placeholder = await field.getAttribute('placeholder');
      const ariaLabel = await field.getAttribute('aria-label');
      const id = await field.getAttribute('id');
      const associatedLabel = id
        ? page.locator(`label[for="${id}"]`)
        : field.locator('xpath=ancestor::label[1]');
      const labelText = await associatedLabel.first().textContent().catch(() => null);
      expect([placeholder, ariaLabel, labelText].filter(Boolean).join(' '), 'Each field should have a Tamil label or placeholder').toMatch(tamilScript);
    }

    // 2. Submit only when native required fields ensure an empty submission is blocked by the browser.
    const requiredFields = form.locator('input[required]:not([type="hidden"]), textarea[required], select[required]');
    expect(await requiredFields.count(), 'At least one native required field is needed for a safe empty-submit test').toBeGreaterThan(0);
    const submitButton = form.locator('button[type="submit"]').first();
    const submitInput = form.locator('input[type="submit"]').first();
    const submitControl = await submitButton.count() > 0 ? submitButton : submitInput;
    await expect(submitControl).toBeVisible();
    if (await submitButton.count() > 0) {
      await expect(submitButton).toContainText(tamilScript);
    } else {
      expect(await submitInput.getAttribute('value')).toMatch(tamilScript);
    }
    await submitControl.click();
    await expect(form.locator(':invalid')).toHaveCount(await requiredFields.count());
  });

  test('TC-CON-06: Complete the Tamil Contact Us navigation journey', async ({ page }) => {
    const contactPage = await openContactUs(page);

    // 1. Verify the Tamil Contact Us page and its contact records.
    await expect(page.getByRole('link', { name: tamilContactUsLabels.navigation })).toBeVisible();
    await expect(contactPage.table.locator('tbody tr').first()).toBeVisible();

    // 2. Return home and navigate back to Contact Us from the Tamil navigation.
    await contactPage.openFromTamilHome();
    await expect(contactPage.table).toBeVisible();
    await expect(page.getByRole('link', { name: tamilContactUsLabels.navigation })).toBeVisible();

    // 3. Confirm the Tamil language remains active on the homepage.
    await page.getByRole('link', { name: tamilContactUsLabels.home }).click();
    await expect(page).toHaveURL(/\/chennai-home$/);
    await expect(page.getByRole('link', { name: tamilContactUsLabels.navigation })).toBeVisible();
  });
});
