import { Page } from '@playwright/test';

export async function closeAwarenessPopup(page: Page) {
  const popup = page.locator('.flash-popup-overlay').first();
  const awarenessText = popup.getByText('AWARENESS', { exact: true }).first();

  if (!(await awarenessText.isVisible({ timeout: 5000 }).catch(() => false))) {
    return;
  }

  const closeSelectors = [
    '[aria-label="Close"]',
    '[aria-label="close"]',
    '[title="Close"]',
    '[title="close"]',
    '.btn-close',
    '.close',
    'button.close',
    'button[class*="close" i]',
    'button:has-text("✕")',
    'button:has-text("×")',
  ];

  for (const selector of closeSelectors) {
    const buttons = popup.locator(selector);

    for (let index = 0; index < await buttons.count(); index++) {
      const button = buttons.nth(index);

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      await button.click({ force: true, timeout: 5000 }).catch(() => undefined);

      if (await awarenessText.waitFor({ state: 'hidden', timeout: 2000 }).then(() => true).catch(() => false)) {
        return;
      }
    }
  }

  const namedCloseButton = popup.getByRole('button', { name: /close|dismiss|cancel/i }).first();

  if (await namedCloseButton.isVisible().catch(() => false)) {
    await namedCloseButton.click({ force: true, timeout: 5000 }).catch(() => undefined);

    if (await awarenessText.waitFor({ state: 'hidden', timeout: 2000 }).then(() => true).catch(() => false)) {
      return;
    }
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  await awarenessText.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => undefined);
}