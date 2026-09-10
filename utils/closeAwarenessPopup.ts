import { Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  const popup = page.locator('.flash-popup-overlay').first();
  const awarenessText = popup.getByText('AWARENESS', { exact: true }).first();

  if (!(await awarenessText.isVisible({ timeout: 5000 }).catch(() => false))) {
    return;
  }

  const closeButton = popup.locator(
    '[aria-label*="close" i], [title*="close" i], .btn-close, .close, button:has-text("Close"), button:has-text("✕"), button'
  ).first();

  for (let attempt = 0; attempt < 2; attempt++) {
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    if (await popup.waitFor({ state: 'hidden', timeout: 2000 }).then(() => true).catch(() => false)) {
      return;
    }
  }
}