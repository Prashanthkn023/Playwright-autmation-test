import { expect, Page, Locator } from '@playwright/test';
import { closeAwarenessPopup } from './closeAwarenessPopup';

// ============================================================
// CMS CREDENTIALS
// Require actual credentials from environment variables.
// Do not hardcode CMS usernames/passwords in source.
// Set CMS_USERNAME and CMS_PASSWORD in the local shell, CI,
// or a .env file before running the CMS tests.
// ============================================================

export const CMS_USERNAME =
  (process.env.CMS_USERNAME ?? '').trim();

export const CMS_PASSWORD =
  (process.env.CMS_PASSWORD ?? '').trim();

// ============================================================
// SELECTORS
// ============================================================

const USERNAME_SELECTOR =
  'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]';

const PASSWORD_SELECTOR = 'input[type="password"]';

const LOGIN_BUTTON_SELECTOR =
  'button[type="submit"], input[type="submit"]';

const POPUP_SELECTOR =
  '.flash-popup-overlay:visible, .flash-popup:visible, .modal.show:visible';

// ============================================================
// HELPER: GET USERNAME FIELD
// ============================================================

function getUsernameField(page: Page): Locator {
  return page.locator(USERNAME_SELECTOR).first();
}

// ============================================================
// HELPER: GET PASSWORD FIELD
// ============================================================

function getPasswordField(page: Page): Locator {
  return page.locator(PASSWORD_SELECTOR).first();
}

// ============================================================
// HELPER: CHECK WHETHER LOGIN FORM IS VISIBLE
// ============================================================

async function isLoginFormVisible(page: Page): Promise<boolean> {
  try {
    const username = getUsernameField(page);
    const password = getPasswordField(page);

    return (
      (await username.isVisible().catch(() => false)) &&
      (await password.isVisible().catch(() => false))
    );
  } catch {
    return false;
  }
}

async function hasCmsSession(
  page: Page,
  hostname: string
): Promise<boolean> {
  try {
    const cookies = await page.context().cookies();

    const hasAuthCookie = cookies.some((cookie) => {
      const name = cookie.name.toLowerCase();
      const domain = (cookie.domain || '').toLowerCase();
      const hasDomainMatch =
        domain === hostname ||
        domain.endsWith(`.${hostname}`) ||
        hostname.includes(domain.replace(/^\./, ''));

      return (
        hasDomainMatch &&
        Boolean(cookie.value) &&
        /^(?:session|token|jwt|auth)/i.test(name)
      );
    });

    if (hasAuthCookie) {
      return true;
    }

    return await page.evaluate(() => {
      try {
        const session = JSON.parse(
          localStorage.getItem('session') ?? 'null'
        ) as {
          access_token?: unknown;
          tokens?: { access_token?: unknown } | null;
        } | null;
        const user = JSON.parse(localStorage.getItem('user') ?? 'null');
        const accessToken =
          session?.access_token ?? session?.tokens?.access_token;

        return (
          typeof accessToken === 'string' &&
          accessToken.length > 0 &&
          user !== null &&
          typeof user === 'object'
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// ============================================================
// HELPER: FIND LOGIN BUTTON
// ============================================================

function getLoginButton(page: Page): Locator {
  return page
    .getByRole('button', { name: /^login$/i })
    .or(page.locator(LOGIN_BUTTON_SELECTOR))
    .first();
}

// ============================================================
// HELPER: CLOSE CMS POPUPS
// ============================================================

async function closeCmsPopup(page: Page): Promise<void> {
  try {
    const popup = page.locator(POPUP_SELECTOR).first();

    if (await popup.isVisible().catch(() => false)) {
      const closeButton = popup
        .locator(
          'button[aria-label="Close"], ' +
            'button.close, ' +
            '.btn-close, ' +
            '[data-bs-dismiss="modal"], ' +
            '[data-dismiss="modal"]'
        )
        .first();

      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click({ timeout: 5000 }).catch(() => undefined);
      } else {
        await page.keyboard
          .press('Escape')
          .catch(() => undefined);
      }

      await popup
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => undefined);
    }
  } catch {
    // Ignore optional popup handling failures.
    // Do not fail a successful CMS login because of a popup.
  }
}

// ============================================================
// HELPER: READ SAFE LOGIN DIAGNOSTICS
// Never print credentials or the complete login API response.
// ============================================================

async function getLoginDiagnostics(page: Page): Promise<string> {
  const currentUrl = page.url();
  const usernameVisible = await getUsernameField(page)
    .isVisible()
    .catch(() => false);

  const passwordVisible = await getPasswordField(page)
    .isVisible()
    .catch(() => false);

  const validationMessages = await page
    .locator(
      '.invalid-feedback, ' +
        '.error-message, ' +
        '.alert-danger, ' +
        '[role="alert"], ' +
        '.text-danger'
    )
    .allTextContents()
    .catch(() => []);

  const messages = validationMessages
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(0, 5);

  return [
    `Current URL: ${currentUrl}`,
    `Username visible: ${usernameVisible}`,
    `Password visible: ${passwordVisible}`,
    `Validation messages: ${
      messages.length > 0 ? messages.join(' | ') : 'None detected'
    }`,
  ].join('\n');
}

// ============================================================
// MAIN LOGIN FUNCTION
// ============================================================

export async function loginToCms(
  page: Page,
  cmsUrl: string,
  username: string,
  password: string,
  expectedUrlPattern?: RegExp
): Promise<void> {
  if (
    !username ||
    !password ||
    username === 'YOUR_CMS_USERNAME' ||
    password === 'YOUR_CMS_PASSWORD'
  ) {
    throw new Error(
      'CMS credentials are not configured. Set CMS_USERNAME and ' +
        'CMS_PASSWORD in the environment before running CMS tests.'
    );
  }

  const targetUrl = new URL(cmsUrl);
  const cmsHomeUrl = `${targetUrl.origin}/chennai-home`;

  const attempts = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log('\n========================================');
      console.log(`CMS LOGIN STARTED (attempt ${attempt}/${attempts})`);
      console.log('========================================');

      await page.goto(cmsHomeUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });

      await page.waitForLoadState('domcontentloaded').catch(() => undefined);

      let loginFormVisible = await isLoginFormVisible(page);

      if (!loginFormVisible) {
        await page.goto(cmsUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 120000,
        });

        await page.waitForLoadState('domcontentloaded').catch(() => undefined);
        loginFormVisible = await isLoginFormVisible(page);
      }

      if (loginFormVisible) {
        const usernameField = getUsernameField(page);
        const passwordField = getPasswordField(page);

        await expect(usernameField).toBeVisible({ timeout: 20000 });
        await expect(passwordField).toBeVisible({ timeout: 20000 });

        await usernameField.fill(username);
        await passwordField.fill(password);

        const loginResponsePromise = page
          .waitForResponse(
            (response) =>
              response.url().includes('/api/fusion-configuration-service/users/login') &&
              response.request().method() === 'POST',
            { timeout: 30000 }
          )
          .catch(() => null);

        const loginButton = getLoginButton(page);

        await expect(loginButton).toBeVisible({ timeout: 15000 });
        await expect(loginButton).toBeEnabled({ timeout: 15000 });

        await loginButton.click();

        const loginResponse = await loginResponsePromise;

        if (loginResponse) {
          console.log(`Login API status: ${loginResponse.status()}`);
        } else {
          console.log('Login API response was not observed within 30 seconds.');
        }

        await page.waitForTimeout(3000);
      } else {
        console.log(
          'Login form is not visible. Continuing with session verification.'
        );
      }

      const hasAuthState = await hasCmsSession(
        page,
        targetUrl.hostname
      );

      const loginFormVisibleAfterSubmit = await isLoginFormVisible(page);
      const loginVerified = hasAuthState && !loginFormVisibleAfterSubmit;

      if (!loginVerified) {
        const diagnostics = await getLoginDiagnostics(page);
        throw new Error(
          'CMS login could not be verified.\n' +
            'A valid CMS auth session was not established, or the login form is still visible. ' +
            'The TS load-balancer cookie is not an authentication signal.\n\n' +
            diagnostics
        );
      }

      console.log('CMS login verified via authenticated browser session.');

      const currentUrl = new URL(page.url());

      if (
        currentUrl.origin !== targetUrl.origin ||
        currentUrl.pathname !== targetUrl.pathname ||
        currentUrl.search !== targetUrl.search
      ) {
        await page.goto(cmsUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 120000,
        });
      }

      await page.waitForLoadState('domcontentloaded').catch(() => undefined);

      if (await isLoginFormVisible(page)) {
        throw new Error(
          `CMS session was not available on the requested module: ${cmsUrl}`
        );
      }

      if (expectedUrlPattern) {
        try {
          await expect(page).toHaveURL(expectedUrlPattern, {
            timeout: 20000,
          });
        } catch (error) {
          console.warn(
            `CMS login succeeded but the page did not match the expected pattern ${expectedUrlPattern}. ` +
              `Current URL: ${page.url()}. Continuing with the authenticated session; ` +
              'the application may redirect to the default CMS home page after login.'
          );
        }
      }

      await closeAwarenessPopup(page);

      console.log(`CMS login verified. Current URL: ${page.url()}`);
      console.log('========================================\n');
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < attempts) {
        console.warn(
          `CMS login attempt ${attempt} failed: ${(error as Error).message}. Retrying...`
        );
        await page.goto(cmsHomeUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 120000,
        }).catch(() => undefined);
        await page.waitForTimeout(2000);
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }
}

// ============================================================
// LOGIN USING CONFIGURED CMS CREDENTIALS
// Keep this export for existing test imports.
// ============================================================

export async function loginToConfiguredCms(
  page: Page,
  cmsUrl: string,
  expectedUrlPattern?: RegExp
): Promise<void> {
  await loginToCms(
    page,
    cmsUrl,
    CMS_USERNAME,
    CMS_PASSWORD,
    expectedUrlPattern
  );
}

// ============================================================
// OPEN ABOUT US DROPDOWN
// ============================================================

export async function openCmsAboutUsDropdown(
  page: Page
) {
  await closeAwarenessPopup(page);

  const navigation = page.getByRole(
    'navigation'
  );

  await expect(navigation).toBeVisible({
    timeout: 30000,
  });

  const aboutUsItem = navigation
    .getByText(
      'About Us',
      {
        exact: true,
      }
    )
    .first();

  await expect(aboutUsItem).toBeVisible({
    timeout: 30000,
  });

  await aboutUsItem.hover();
}

// ============================================================
// OPEN ABOUT US > GCTP
// ============================================================

export async function openCmsAboutUsGctp(
  page: Page
) {
  await openCmsAboutUsDropdown(page);

  const navigation = page.getByRole(
    'navigation'
  );

  const gctpLink = navigation.getByText(
    'GCTP',
    {
      exact: true,
    }
  );

  await expect(gctpLink).toBeVisible({
    timeout: 30000,
  });

  await gctpLink.click();

  await page.waitForLoadState(
    'domcontentloaded'
  ).catch(() => undefined);

  await closeAwarenessPopup(page);
}
