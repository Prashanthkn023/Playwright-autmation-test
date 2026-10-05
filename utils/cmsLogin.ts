import { expect, Page } from '@playwright/test';

// ============================================================
// CMS CREDENTIALS
// ============================================================
// Direct credentials - no .env required for CMS login.
// Replace these values with your actual CMS credentials.
// ============================================================

export const CMS_USERNAME = 'Prashanth@gctp.in';
export const CMS_PASSWORD = 'Prashanth@123';

// ============================================================
// LOGIN TO CONFIGURED CMS
// ============================================================

export async function loginToConfiguredCms(
  page: Page,
  cmsUrl: string
) {
  await loginToCms(
    page,
    cmsUrl,
    CMS_USERNAME,
    CMS_PASSWORD
  );
}

// ============================================================
// CMS LOGIN
// ============================================================

export async function loginToCms(
  page: Page,
  cmsUrl: string,
  username: string,
  password: string
) {
  // Validate credentials
  expect(
    username.trim(),
    'CMS_USERNAME must be configured'
  ).not.toBe('');

  expect(
    password.trim(),
    'CMS_PASSWORD must be configured'
  ).not.toBe('');

  // ----------------------------------------------------------
  // Login form locators
  // ----------------------------------------------------------

  const usernameInput = page.locator(
    'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]'
  );

  const passwordInput = page.locator(
    'input[type="password"]'
  );

  // ----------------------------------------------------------
  // Open CMS login page
  // ----------------------------------------------------------

  let loginFormLoaded = false;

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(
      `Opening CMS login page - Attempt ${attempt}/3`
    );

    await page.goto(cmsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    loginFormLoaded = await usernameInput
      .isVisible({
        timeout: 30000,
      })
      .catch(() => false);

    if (loginFormLoaded) {
      console.log(
        'CMS login form loaded successfully.'
      );

      break;
    }

    console.log(
      `CMS login form was not visible on attempt ${attempt}.`
    );
  }

  // ----------------------------------------------------------
  // Verify login form
  // ----------------------------------------------------------

  expect(
    loginFormLoaded,
    'CMS login form should load after retrying the CMS portal'
  ).toBe(true);

  // ----------------------------------------------------------
  // Enter username
  // ----------------------------------------------------------

  await usernameInput.fill(username);

  // ----------------------------------------------------------
  // Enter password
  // ----------------------------------------------------------

  await expect(passwordInput).toBeVisible({
    timeout: 30000,
  });

  await passwordInput.fill(password);

  // ----------------------------------------------------------
  // Login button
  // ----------------------------------------------------------

  const loginButton = page.getByRole(
    'button',
    {
      name: 'Login',
    }
  );

  await expect(loginButton).toBeVisible({
    timeout: 30000,
  });

  await loginButton.click();

  // ----------------------------------------------------------
  // Wait for CMS page
  // ----------------------------------------------------------

  await page.waitForLoadState(
    'domcontentloaded'
  ).catch(() => undefined);

  await page.waitForTimeout(1000);

  console.log(
    `CMS URL after login: ${page.url()}`
  );

  // ----------------------------------------------------------
  // Close popup if displayed
  // ----------------------------------------------------------

  await closeCmsPopup(page);

  // ----------------------------------------------------------
  // Verify CMS navigation
  // ----------------------------------------------------------

  const navigation = page.getByRole(
    'navigation'
  );

  const navigationVisible = await navigation
    .isVisible({
      timeout: 30000,
    })
    .catch(() => false);

  expect(
    navigationVisible,
    'CMS navigation should be visible after successful CMS login'
  ).toBe(true);

  console.log(
    'CMS login completed successfully.'
  );
}

// ============================================================
// OPEN ABOUT US DROPDOWN
// ============================================================

export async function openCmsAboutUsDropdown(
  page: Page
) {
  await closeCmsPopup(page);

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

  await closeCmsPopup(page);
}

// ============================================================
// CLOSE CMS POPUP
// ============================================================

async function closeCmsPopup(
  page: Page
) {
  const popupSelector =
    '.flash-popup-overlay:visible, .flash-popup:visible, .modal.show:visible';

  for (
    let attempt = 1;
    attempt <= 5;
    attempt++
  ) {
    const popup = page
      .locator(popupSelector)
      .first();

    const popupVisible = await popup
      .waitFor({
        state: 'visible',
        timeout:
          attempt === 1
            ? 5000
            : 1500,
      })
      .then(() => true)
      .catch(() => false);

    // No popup
    if (!popupVisible) {
      return;
    }

    console.log(
      `CMS popup detected - closing attempt ${attempt}/5`
    );

    // --------------------------------------------------------
    // Find close button
    // --------------------------------------------------------

    const closeButton = popup
      .locator(
        '.flash-close-btn, button'
      )
      .first();

    const closeButtonVisible =
      await closeButton
        .isVisible()
        .catch(() => false);

    if (closeButtonVisible) {
      await closeButton.click({
        force: true,
        timeout: 5000,
      }).catch(() => undefined);
    } else {
      // ------------------------------------------------------
      // Fallback to Escape
      // ------------------------------------------------------

      await page.keyboard
        .press('Escape')
        .catch(() => undefined);
    }

    // --------------------------------------------------------
    // Wait for popup to close
    // --------------------------------------------------------

    await popup
      .waitFor({
        state: 'hidden',
        timeout: 5000,
      })
      .catch(() => undefined);
  }

  // ----------------------------------------------------------
  // Final popup check
  // ----------------------------------------------------------

  const remainingPopup = page
    .locator(popupSelector)
    .first();

  await expect(
    remainingPopup
  ).toBeHidden({
    timeout: 10000,
  }).catch(() => undefined);
}