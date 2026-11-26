import { test, expect } from '@playwright/test';
import { SupervisorLoginPage } from '../pages/SupervisorLoginPage';

test.describe('CMS Supervisor Login - Positive Test Cases', () => {
  let supervisorUrl: string;
  let username: string;
  let password: string;

  test.beforeAll(() => {
    supervisorUrl = process.env.CMS_Supervisor_url || 'https://cms.gctp.in/chennai-supervisorview';
    username = process.env.CMS_Supervisor_username || '';
    password = process.env.CMS_Supervisor_password || '';
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.navigateToSupervisorLogin();
  });

  test('SUP-POS-01: Verify password is masked by default', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.waitForLoginPage();
    await loginPage.enterPassword('TestPassword123');

    const isMasked = await loginPage.isPasswordMasked();
    expect(isMasked).toBeTruthy();
  });

  test('SUP-POS-02: Verify password visibility toggle functionality', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.waitForLoginPage();
    await loginPage.enterPassword('TestPassword123');

    // Toggle to show password
    await loginPage.togglePasswordVisibility();
    const isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBeTruthy();

    // Toggle back to mask password
    await loginPage.togglePasswordVisibility();
    const isMaskedAgain = await loginPage.isPasswordMasked();
    expect(isMaskedAgain).toBeTruthy();
  });

  test('SUP-POS-03: Verify Enter-key login submission from password field', async ({ page }) => {
    if (!username || !password) {
      test.skip(true, 'CMS_Supervisor_username and CMS_Supervisor_password must be set in environment variables for authenticated test.');
    }

    const loginPage = new SupervisorLoginPage(page);
    await loginPage.waitForLoginPage();

    await loginPage.enterUsername(username);
    await loginPage.enterPassword(password);
    await loginPage.passwordInput.press('Enter');

    // Verify successful authentication, redirection, and unique supervisor dashboard element ("APPROVAL LIST")
    await expect(loginPage.emailInput).toBeHidden({ timeout: 30000 });
    await expect(page).toHaveURL(/chennai-supervisorview/);
    await expect(page.locator('text=APPROVAL LIST').first()).toBeVisible({ timeout: 15000 });
  });

  test('SUP-POS-04: Login with valid supervisor credentials and verify success behavior', async ({ page }) => {
    if (!username || !password) {
      test.skip(true, 'CMS_Supervisor_username and CMS_Supervisor_password must be set in environment variables for authenticated test.');
    }

    const loginPage = new SupervisorLoginPage(page);
    await loginPage.waitForLoginPage();

    await loginPage.login(username, password);

    // Verify successful authentication, redirection, and unique supervisor dashboard element ("APPROVAL LIST")
    await expect(loginPage.emailInput).toBeHidden({ timeout: 30000 });
    await expect(page).toHaveURL(/chennai-supervisorview/);
    await expect(page.locator('text=APPROVAL LIST').first()).toBeVisible({ timeout: 15000 });
  });
});
