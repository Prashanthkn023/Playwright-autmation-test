import { test, expect } from '@playwright/test';
import { SupervisorLoginPage } from '../pages/SupervisorLoginPage';

test.describe('CMS Supervisor Login - Corner Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.navigateToSupervisorLogin();
    await loginPage.waitForLoginPage();
  });

  test('SUP-COR-01: Username with leading and trailing spaces', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('  supervisor@gctp.in  ');
    await loginPage.enterPassword('SomePassword123');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-02: Password with leading and trailing spaces', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.enterPassword('  Password123!  ');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-03: Very long username input handling', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    const longUsername = 'a'.repeat(250) + '@gctp.in';
    await loginPage.enterUsername(longUsername);
    await loginPage.enterPassword('Password123!');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-04: Very long password input handling', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    const longPassword = 'P1!' + 'a'.repeat(300);
    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.enterPassword(longPassword);
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-05: Special characters in username and password fields', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('sup+test!#$@gctp.in');
    await loginPage.enterPassword('P@ssw0rd_%^&*()_+{}[]|\\:;"\'<>?,./~`-');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-06: Rapid login button double-clicks', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.enterPassword('Password123!');
    await loginPage.loginButton.click({ clickCount: 2 });

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-07: Refresh login page during data entry', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('temp-supervisor@gctp.in');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await loginPage.waitForLoginPage();

    const usernameVal = await loginPage.emailInput.inputValue();
    expect(usernameVal).toBe('');
  });

  test('SUP-COR-08: Browser back and forward navigation behavior', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await page.goto('https://cms.gctp.in/', { waitUntil: 'domcontentloaded' });
    await page.goBack(); // returns to supervisor view or login

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('SUP-COR-09: Network interruption during login submission', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    const loginPage = new SupervisorLoginPage(page);

    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.enterPassword('Password123!');

    // Go offline right before clicking login
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    });

    await loginPage.clickLogin().catch(() => {});

    // Restore network
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1024 * 1024,
      uploadThroughput: 1024 * 1024,
      latency: 0,
    });

    await expect(loginPage.emailInput).toBeVisible();
    await client.detach();
  });

  test('SUP-COR-10: Login using Enter key from username field', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.emailInput.press('Enter');

    await expect(loginPage.emailInput).toBeVisible();
  });
});
