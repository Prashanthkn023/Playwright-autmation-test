import { expect, Page } from '@playwright/test';

const getRequiredCredential = (name: 'CMS_USERNAME' | 'CMS_PASSWORD') => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured in environment variables/secrets before running CMS tests.`);
  }
  return value;
};

export const CMS_USERNAME = getRequiredCredential('CMS_USERNAME');
export const CMS_PASSWORD = getRequiredCredential('CMS_PASSWORD');

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
  const popup = page
    .locator('.flash-popup-overlay:visible, .flash-popup:visible, .modal.show:visible')
    .first();

  if (!(await popup.isVisible({ timeout: 5000 }).catch(() => false))) {
    return;
  }

  const closeButton = popup.locator('button').first();

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true, timeout: 5000 });
  } else {
    await page.keyboard.press('Escape');
  }

  await expect(popup).toBeHidden({ timeout: 10000 });
}
