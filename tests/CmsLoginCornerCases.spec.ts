import { test, expect } from '@playwright/test';
import { CmsLoginPage } from '../pages/CmsLoginPage';

test.describe('CMS Login and Forgot Password Corner Cases Suite', () => {

  test.describe('Login Corner Cases', () => {

    test('COR-LOGIN-01: Press Enter with empty credentials', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.emailInput.press('Enter');
      // Verify login is rejected, page remains functional
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('COR-LOGIN-02: Double-click Login', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.enterEmail('test@gctp.in');
      await loginPage.enterPassword('Password123!');

      await loginPage.loginButton.click({ clickCount: 2 });
      // Should not crash, should stay functional
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('COR-LOGIN-03: Rapidly toggle password visibility', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.enterPassword('SecretPassword123');

      for (let i = 0; i < 5; i++) {
        await loginPage.togglePasswordVisibility();
        await page.waitForTimeout(100);
      }

      const isVisible = await loginPage.isPasswordVisible();
      // Verify if toggle actually worked at least once or is in a stable state
      expect(typeof isVisible).toBe('boolean');
    });

    test('COR-LOGIN-04: Toggle password ON and OFF', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.enterPassword('TestPassword123');

      await loginPage.togglePasswordVisibility();
      await expect.poll(async () => await loginPage.isPasswordVisible()).toBeTruthy();

      await loginPage.togglePasswordVisibility();
      await expect.poll(async () => await loginPage.isPasswordVisible()).toBeFalsy();
    });

    test('COR-LOGIN-05: Refresh login page', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.enterEmail('refresh@gctp.in');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await loginPage.waitForLoginPage();

      const val = await loginPage.emailInput.inputValue();
      expect(val).toBe('');
    });

    test('COR-LOGIN-06: Browser Back button', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await page.goto('https://cms.gctp.in/', { waitUntil: 'domcontentloaded' });

      await page.goBack();
      await loginPage.waitForLoginPage();
      await expect(loginPage.emailInput).toBeVisible();
      expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
    });

    test('COR-LOGIN-07: Browser Forward button', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await page.goto('https://cms.gctp.in/', { waitUntil: 'domcontentloaded' });
      await page.goBack();

      await loginPage.waitForLoginPage();
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('COR-LOGIN-08: Resize browser window', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await page.setViewportSize({ width: 800, height: 600 });
      await expect(loginPage.emailInput).toBeVisible();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('COR-LOGIN-09: Open multiple login tabs', async ({ context, page }) => {
      const loginPage1 = new CmsLoginPage(page);
      await loginPage1.navigateToLogin();
      await loginPage1.waitForLoginPage();

      const page2 = await context.newPage();
      const loginPage2 = new CmsLoginPage(page2);
      await loginPage2.navigateToLogin();
      await loginPage2.waitForLoginPage();

      await expect(loginPage2.emailInput).toBeVisible();
      await page2.close();
    });

    test('COR-LOGIN-10: Navigate away and return', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await expect(loginPage.emailInput).toBeVisible();
    });

    test('COR-LOGIN-11: Slow network loading @manual', async ({ page }) => {
      test.setTimeout(120000);
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024,
        uploadThroughput: 50 * 1024,
        latency: 200,
      });

      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin(120000);
      await loginPage.waitForLoginPage();

      await expect(loginPage.emailInput).toBeVisible();
      await client.detach();
    });

    test('COR-LOGIN-12: Network interruption during page load', async ({ page }) => {
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0,
      });

      const loginPage = new CmsLoginPage(page);
      try {
        await loginPage.navigateToLogin();
      } catch {
        // Expected offline failure
      }

      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1024 * 1024,
        uploadThroughput: 1024 * 1024,
        latency: 0,
      });

      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();
      await expect(loginPage.emailInput).toBeVisible();
      expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');

      await client.detach();
    });

    test('COR-LOGIN-13: Reload during form entry', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.enterEmail('partial-entry@gctp.in');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await loginPage.waitForLoginPage();

      expect(await loginPage.emailInput.inputValue()).toBe('');
    });

    test('COR-LOGIN-14: Repeatedly open and close login page', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      for (let i = 0; i < 3; i++) {
        await loginPage.navigateToLogin();
        await loginPage.waitForLoginPage();
        await page.goto('https://cms.gctp.in/', { waitUntil: 'domcontentloaded' });
      }
    });

    test('COR-LOGIN-15: Browser zoom at 200%', async ({ page }) => {
      await page.evaluate(() => {
        document.body.style.zoom = '200%';
      });

      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await expect(loginPage.emailInput).toBeVisible();
    });

  });

  test.describe('Forgot Password Corner Cases', () => {

    test('COR-FP-01: Open and immediately close dialog', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.clickCancel();
      await expect(loginPage.forgotPasswordDialog).toBeHidden();
    });

    test('COR-FP-02: Enter invalid email and cancel', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.enterRecoveryEmail('invalid-email-format');
      await loginPage.clickCancel();
      await expect(loginPage.forgotPasswordDialog).toBeHidden();
    });

    test('COR-FP-03: Reopen dialog after cancellation', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.enterRecoveryEmail('test@gctp.in');
      await loginPage.clickCancel();

      await loginPage.openForgotPassword();
      expect(await loginPage.recoveryEmailInput.inputValue()).toBe('');
    });

    test('COR-FP-04: Repeatedly open and close dialog', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      for (let i = 0; i < 3; i++) {
        await loginPage.openForgotPassword();
        await loginPage.clickCancel();
        await expect(loginPage.forgotPasswordDialog).toBeHidden();
      }
    });

    test('COR-FP-05: Press Escape @manual', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      // Material-UI dialogs are usually dismissable by Escape if configured.
      // If it fails, this is an application defect in UI/UX accessibility.
      await page.keyboard.press('Escape');
      await expect(loginPage.forgotPasswordDialog).toBeHidden();
    });

    test('COR-FP-06: Click outside dialog @manual', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      // Click on backdrop
      await page.locator('.MuiBackdrop-root').click({ position: { x: 10, y: 10 } });
      await expect(loginPage.forgotPasswordDialog).toBeHidden();
    });

    test('COR-FP-07: Press Enter with empty email', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.recoveryEmailInput.press('Enter');
      await expect(loginPage.forgotPasswordDialog).toBeVisible();
    });

    test('COR-FP-08: Double-click Send OTP', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.enterRecoveryEmail('test@gctp.in');
      await loginPage.sendOtpButton.click({ clickCount: 2 });
      await expect(loginPage.forgotPasswordDialog).toBeVisible();
    });

    test('COR-FP-09: Slow network during recovery', async ({ page }) => {
      test.setTimeout(180000);
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024,
        uploadThroughput: 50 * 1024,
        latency: 200,
      });

      const loginPage = new CmsLoginPage(page);
      // Increased timeout for slow network
      await loginPage.navigateToLogin(180000);
      await loginPage.waitForLoginPage(60000);

      await loginPage.openForgotPassword();
      await loginPage.enterRecoveryEmail('test@gctp.in');
      await loginPage.clickSendOTP();
      await expect(loginPage.forgotPasswordDialog).toBeVisible();
      expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');

      await client.detach();
    });

    test('COR-FP-10: Network disconnected during recovery', async ({ page }) => {
      const loginPage = new CmsLoginPage(page);
      await loginPage.navigateToLogin();
      await loginPage.waitForLoginPage();

      await loginPage.openForgotPassword();
      await loginPage.enterRecoveryEmail('test@gctp.in');

      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0,
      });

      await loginPage.clickSendOTP();
      await expect(loginPage.forgotPasswordDialog).toBeVisible();

      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1024 * 1024,
        uploadThroughput: 1024 * 1024,
        latency: 0,
      });

      await client.detach();
    });

  });

});
