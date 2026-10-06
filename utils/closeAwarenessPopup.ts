import { expect, Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible';

  for (let attempt = 0; attempt < 3; attempt++) {
    const popup = page.locator(popupSelector).first();

    if (!(await popup.isVisible({ timeout: attempt === 0 ? 5000 : 1500 }).catch(() => false))) {
      return;
    }

    const closeButton = popup.locator('button').first();
    let dismissed = false;
    if (await closeButton.isVisible().catch(() => false)) {
      dismissed = await closeButton.click({ force: true, timeout: 1500 })
        .then(() => true)
        .catch(() => false);
    }

    if (!dismissed) {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    if (await popup.waitFor({ state: 'hidden', timeout: 2500 }).then(() => true).catch(() => false)) {
      return;
    }
  }

  // A third-party awareness popup should not prevent page navigation when its
  // close control is unresponsive or the popup is in the middle of an animation.
  await expect(page.locator(popupSelector).first()).toBeHidden({ timeout: 1000 }).catch(() => undefined);
}
