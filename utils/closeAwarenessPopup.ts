import { expect, Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible';

  for (let attempt = 0; attempt < 3; attempt++) {
    const popup = page.locator(popupSelector).first();

    if (!(await popup.isVisible({ timeout: attempt === 0 ? 5000 : 1500 }).catch(() => false))) {
      return;
    }

    const closeButton = popup.locator('button').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 5000 });
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    if (await popup.waitFor({ state: 'hidden', timeout: 5000 }).then(() => true).catch(() => false)) {
      return;
    }
  }

  await expect(page.locator(popupSelector).first()).toBeHidden({ timeout: 5000 });
}