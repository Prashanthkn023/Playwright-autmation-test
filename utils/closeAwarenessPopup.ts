import { expect, Page } from '@playwright/test';

// Scoped explicitly to the awareness popup and flash overlay elements
const POPUP_SELECTOR = '.flash-popup-overlay:visible, .flash-popup:visible';

export async function closeAwarenessPopup(page: Page) {
  const popup = page.locator(POPUP_SELECTOR).first();

  for (let attempt = 0; attempt < 3; attempt++) {
    const isVisible = await popup.isVisible();
    if (!isVisible) {
      break;
    }

    // Scoped specifically inside the awareness popup to avoid clicking unrelated page buttons
    const closeCandidates = [
      popup.locator('.flash-close-btn').first(),
      popup.getByRole('button', { name: /^(close|✕|×)$/i }).first(),
      popup.locator('button[aria-label="Close"], button[aria-label="close"]').first(),
      popup.locator('[data-bs-dismiss="modal"], [data-dismiss="modal"]').first(),
      popup.locator('button.close, .btn-close').first(),
      popup.locator('button:has-text("Close"), button:has-text("Dismiss")').first(),
    ];

    let dismissed = false;

    for (const candidate of closeCandidates) {
      const candidateVisible = await candidate.isVisible().catch(() => false);
      if (!candidateVisible) {
        continue;
      }

      try {
        // Normal Playwright click scoped within the popup
        await candidate.click({ timeout: 2000 });
        dismissed = true;
        break;
      } catch {
        // If clicking this candidate fails or is intercepted, continue to the next candidate
        // without prematurely aborting or hiding genuine test failures.
        continue;
      }
    }

    if (!dismissed) {
      await page.keyboard.press('Escape');
    }

    // Await natural popup and overlay disappearance
    await popup.waitFor({ state: 'hidden', timeout: 3000 });
  }

  // Ensure overlay/popup is fully hidden before subsequent interactions (e.g. language selection)
  await expect(popup).toBeHidden({ timeout: 5000 });
}
