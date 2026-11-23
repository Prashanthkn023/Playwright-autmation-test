import { expect, Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  // Target the specific flash popup overlay or flash popup container
  const overlay = page.locator('.flash-popup-overlay:visible').first();
  const popup = page.locator('.flash-popup:visible').first();

  if (!(await overlay.isVisible().catch(() => false)) && !(await popup.isVisible().catch(() => false))) {
    return;
  }

  // The actual close button is precisely .flash-close-btn inside the flash-popup
  const closeBtn = page.locator('.flash-popup .flash-close-btn:visible').first();

  for (let attempt = 0; attempt < 3; attempt++) {
    const overlayVisible = await overlay.isVisible().catch(() => false);
    const popupVisible = await popup.isVisible().catch(() => false);

    if (!overlayVisible && !popupVisible) {
      break;
    }

    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ timeout: 3000 });
    } else {
      await page.keyboard.press('Escape');
    }

    // Wait naturally for the overlay and popup to become hidden
    await Promise.all([
      overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined),
      popup.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined),
    ]);
  }

  // Verify both overlay and popup are hidden naturally
  if (await overlay.isVisible().catch(() => false)) {
    await expect(overlay).toBeHidden({ timeout: 5000 });
  }
  if (await popup.isVisible().catch(() => false)) {
    await expect(popup).toBeHidden({ timeout: 5000 });
  }
}

