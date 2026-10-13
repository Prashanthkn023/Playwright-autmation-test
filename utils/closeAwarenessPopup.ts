import { expect, Page } from '@playwright/test';

const POPUP_SELECTOR =
  '.flash-popup-overlay:visible, .flash-popup:visible, .modal.show:visible, [role="dialog"]:visible, [class*="popup"]:visible';

async function forceRemovePopup(page: Page): Promise<void> {
  await page.evaluate(() => {
    const selectors = [
      '.flash-popup-overlay',
      '.flash-popup',
      '.modal.show',
      '[role="dialog"]',
      '.popup',
      '.modal',
      '.modal-backdrop',
      '.overlay',
    ];

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.display = 'none';
        htmlElement.style.visibility = 'hidden';
        htmlElement.style.opacity = '0';
        htmlElement.style.pointerEvents = 'none';
        htmlElement.setAttribute('aria-hidden', 'true');
        htmlElement.removeAttribute('open');
      });
    }

    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop, .overlay, .popup-overlay').forEach((element) => element.remove());
  });
}

export async function closeAwarenessPopup(page: Page) {
  const popup = page.locator(POPUP_SELECTOR).first();

  for (let attempt = 0; attempt < 4; attempt++) {
    if (!(await popup.isVisible({ timeout: 1500 }).catch(() => false))) {
      return;
    }

    const closeCandidates = [
      popup.locator('.flash-close-btn').first(),
      popup.locator('button[aria-label="Close"]').first(),
      popup.locator('button[aria-label="close"]').first(),
      popup.locator('[data-bs-dismiss="modal"]').first(),
      popup.locator('[data-dismiss="modal"]').first(),
      popup.locator('button.close').first(),
      popup.locator('.btn-close').first(),
      popup.locator('button:has-text("Close")').first(),
      popup.locator('button:has-text("Dismiss")').first(),
      popup.locator('button').first(),
      page.keyboard.press('Escape'),
    ];

    let dismissed = false;

    for (const candidate of closeCandidates) {
      if (candidate instanceof Promise) {
        await candidate.catch(() => undefined);
        continue;
      }

      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      dismissed = await candidate
        .click({ force: true, timeout: 1500 })
        .then(() => true)
        .catch(() => false);

      if (dismissed) {
        break;
      }
    }

    if (!dismissed) {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    await page.waitForTimeout(300);

    if (!(await popup.isVisible({ timeout: 1000 }).catch(() => false))) {
      return;
    }
  }

  await forceRemovePopup(page);
  await expect(page.locator(POPUP_SELECTOR).first()).toBeHidden({ timeout: 2000 }).catch(() => undefined);
}
