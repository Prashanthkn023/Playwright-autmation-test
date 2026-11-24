import { expect, Page } from '@playwright/test';

// Module-level WeakMap for 100% type-safe serialized execution guards
const closingPromises = new WeakMap<Page, Promise<void>>();

export async function closeAwarenessPopup(page: Page): Promise<void> {
  let closingPromise = closingPromises.get(page);
  if (closingPromise) {
    return closingPromise;
  }

  closingPromise = (async () => {
    const overlay = page.locator('.flash-popup-overlay:visible').first();
    const popup = page.locator('.flash-popup:visible').first();

    const isOverlayVisible = await overlay.isVisible().catch(() => false);
    const isPopupVisible = await popup.isVisible().catch(() => false);

    if (!isOverlayVisible && !isPopupVisible) {
      return;
    }

    const closeBtn = popup.locator('.flash-close-btn:visible').first();

    for (let attempt = 0; attempt < 3; attempt++) {
      const stillOverlay = await overlay.isVisible().catch(() => false);
      const stillPopup = await popup.isVisible().catch(() => false);

      if (!stillOverlay && !stillPopup) {
        break;
      }

      if (await closeBtn.isVisible().catch(() => false)) {
        try {
          await closeBtn.click({ timeout: 2000 });
        } catch (error: unknown) {
          // If the element is detached during clicking, it is already unmounting/closing.
          // For any other error, propagate it normally to avoid hiding real issues.
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('detached') && !errorMessage.includes('hidden')) {
            throw error;
          }
        }
      } else {
        await page.keyboard.press('Escape');
      }

      // Allow animations to naturally transition
      await Promise.all([
        overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined),
        popup.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined),
      ]);
    }

    // Strict Final assertions to enforce correct closure:
    // If the popup is still visible after our dismissal attempts, we explicitly fail the test.
    await expect(overlay).toBeHidden({ timeout: 5000 });
    await expect(popup).toBeHidden({ timeout: 5000 });
  })();

  closingPromises.set(page, closingPromise);

  try {
    await closingPromise;
  } finally {
    closingPromises.delete(page);
  }
}
