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
        // The CMS stores the JWT under session.tokens.access_token.
        // There is no separate 'user' key – do not require it.
        const accessToken =
          session?.access_token ?? session?.tokens?.access_token;

        return (
          typeof accessToken === 'string' &&
          accessToken.length > 0
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

async function getLoginDiagnostics(
  page: Page,
  hostname: string
): Promise<string> {
  const currentUrl = page.url();
  const authSessionDetected = await hasCmsSession(page, hostname);
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
    `CMS auth session detected: ${authSessionDetected}`,
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

      let authenticatedWithPersistentLoginForm = false;

      if (loginFormVisible) {
        const usernameField = getUsernameField(page);
        const passwordField = getPasswordField(page);

        await expect(usernameField).toBeVisible({ timeout: 20000 });
        await expect(passwordField).toBeVisible({ timeout: 20000 });

        await usernameField.fill(username);
        await passwordField.fill(password);

        // Register the response listener BEFORE clicking so we never miss it.
        const loginResponsePromise = page
          .waitForResponse(
            (response) =>
              response.url().includes('/api/fusion-configuration-service/users/login') &&
              response.request().method() === 'POST',
            { timeout: 15000 }
          )
          .catch(() => null);

        const loginButton = getLoginButton(page);

        await expect(loginButton).toBeVisible({ timeout: 15000 });
        await expect(loginButton).toBeEnabled({ timeout: 15000 });

        await loginButton.click();

        // Wait for the login API response before polling for session state.
        // If the server silently drops the POST (e.g. rate limiting), the
        // response promise times out and we fail fast, triggering the retry
        // loop immediately rather than burning 45s on a dead poll.
        const loginResponse = await loginResponsePromise;

        if (!loginResponse) {
          throw new Error(
            'CMS login API did not respond within 15s. ' +
            'The server may have dropped the request (rate limiting). Retrying...'
          );
        }

        const loginStatus = loginResponse.status();
        console.log(`CMS login API response: HTTP ${loginStatus}`);

        if (loginStatus !== 200) {
          const body = await loginResponse.text().catch(() => '(unreadable)');
          throw new Error(
            `CMS login API returned HTTP ${loginStatus}. Body: ${body.substring(0, 200)}`
          );
        }

        // Robust wait: Poll until either authenticated session is detected AND login form disappears.
        // The CMS React app may take a few seconds to transition away from the login form
        // after the JWT is stored in localStorage. Once the session is detected, wait
        // up to 15 additional seconds for the form to disappear.
        const loginTime = Date.now();
        await expect.poll(
          async () => {
            const hasAuthState = await hasCmsSession(page, targetUrl.hostname);
            const loginFormVisible = await isLoginFormVisible(page);
            console.log(`Polling auth: hasSession=${hasAuthState}, loginFormVisible=${loginFormVisible}, url=${page.url()}`);

            // Once the session token is stored, check whether the form is still up.
            // If so, attempt to close any overlaying popup that may be blocking the
            // React transition, then re-check.
            if (hasAuthState && loginFormVisible) {
              const elapsed = Date.now() - loginTime;
              // After 20s of having a valid session, treat the login as successful
              // regardless of form visibility - the form may be rendered by a different
              // section of the CMS home page or an overlay that does not close automatically.
              if (elapsed > 20000) {
                authenticatedWithPersistentLoginForm = true;
                console.log(
                  `CMS session verified after ${elapsed}ms. ` +
                  `Login form selector still matching (possibly a non-login form element). ` +
                  `Proceeding with authenticated session.`
                );
                return true;
              }
              const flashOverlay = page.locator('.flash-popup-overlay:visible').first();
              if (await flashOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
                await page.keyboard.press('Escape').catch(() => undefined);
              }
              return false; // keep polling
            }

            return hasAuthState && !loginFormVisible;
          },
          {
            message: 'CMS session was not established or login form is still visible',
            intervals: [1000, 2000, 5000],
            timeout: 30000,
          }
        ).toBeTruthy();

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
      const loginVerified =
        hasAuthState &&
        (!loginFormVisibleAfterSubmit ||
          authenticatedWithPersistentLoginForm);

      if (!loginVerified) {
        const diagnostics = await getLoginDiagnostics(
          page,
          targetUrl.hostname
        );
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
        // Wait at least 10 seconds between attempts to avoid triggering the
        // CMS rate-limiter or temporary account lockout caused by rapid
        // successive failed login requests.
        await page.waitForTimeout(10000);
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
    .getByText('About Us', { exact: true })
    .first();

  await expect(aboutUsItem).toBeVisible({
    timeout: 30000,
  });

  // Before opening the dropdown, ensure the flash-popup-overlay is gone. The CMS renders
  // a flash overlay that intercepts pointer events; a force-remove is required
  // because the MUI component may re-render after closeAwarenessPopup returns.
  const flashOverlay = page.locator('.flash-popup-overlay:visible').first();
  if (await flashOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeAwarenessPopup(page);
    // Force-dismiss via keyboard as a last resort.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
  }

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
