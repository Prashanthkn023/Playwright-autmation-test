import { Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible';

  for (let attempt = 0; attempt < 3; attempt++) {
    const popup = page.locator(popupSelector).first();

    if (!(await popup.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    const closeButton = popup.getByRole('button').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 5000 }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    if (await popup.waitFor({ state: 'hidden', timeout: 3000 }).then(() => true).catch(() => false)) {
      return;
    }
  }
}