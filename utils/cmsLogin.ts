import { expect, Page } from '@playwright/test';

// Credentials come from .env locally and GitHub Actions secrets in CI.
export const CMS_USERNAME = process.env.CMS_USERNAME ?? '';
export const CMS_PASSWORD = process.env.CMS_PASSWORD ?? '';

export async function loginToConfiguredCms(
  page: Page,
  cmsUrl: string
) {
  await loginToCms(page, cmsUrl, CMS_USERNAME, CMS_PASSWORD);
}

export async function loginToCms(
  page: Page,
  cmsUrl: string,
  username: string,
  password: string
) {
  const usernameInput = page.locator(
    'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]'
  );
  const passwordInput = page.locator('input[type="password"]');

  let loginFormLoaded = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(cmsUrl, { waitUntil: 'domcontentloaded' });

    loginFormLoaded = await usernameInput
      .isVisible({ timeout: 30000 })
      .catch(() => false);

    if (loginFormLoaded) {
      break;
    }
  }

  expect(
    loginFormLoaded,
    'CMS login form should load after retrying the CMS portal'
  ).toBe(true);

  await usernameInput.fill(username);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 30000 });
  await closeCmsPopup(page);
}

export async function openCmsAboutUsGctp(page: Page) {
  await openCmsAboutUsDropdown(page);

  const gctpLink = page
    .getByRole('navigation')
    .getByText('GCTP', { exact: true });
  await expect(gctpLink).toBeVisible({ timeout: 30000 });
  await gctpLink.click();
  await page.waitForLoadState('domcontentloaded');
}

export async function openCmsAboutUsDropdown(page: Page) {
  await closeCmsPopup(page);

  const aboutUsItem = page
    .getByRole('navigation')
    .getByText('About Us', { exact: true })
    .first();

  await expect(aboutUsItem).toBeVisible({ timeout: 30000 });
  await aboutUsItem.hover();
}

async function closeCmsPopup(page: Page) {
  const popupSelector = '.flash-popup-overlay:visible, .flash-popup:visible, .modal.show:visible';

  for (let attempt = 0; attempt < 5; attempt++) {
    const popup = page.locator(popupSelector).first();

    if (!(await popup.waitFor({
      state: 'visible',
      timeout: attempt === 0 ? 5000 : 1500,
    }).then(() => true).catch(() => false))) {
      return;
    }

    const closeButton = popup.locator('.flash-close-btn, button').first();

    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 5000 });
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    await popup.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
  }

  await expect(page.locator(popupSelector).first()).toBeHidden({ timeout: 10000 });
}