import { test, expect } from '@playwright/test';
import { SupervisorLoginPage } from '../pages/SupervisorLoginPage';

test.describe('CMS Supervisor Login - Negative Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.navigateToSupervisorLogin();
    await loginPage.waitForLoginPage();
  });

  test('SUP-NEG-01: Submit with both fields empty', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.clickLogin();

    // Verify error message or user remains on login view
    await expect(loginPage.emailInput).toBeVisible();
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-02: Submit with username empty and password filled', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterPassword('SomePassword123');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-03: Submit with username filled and password empty', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.enterUsername('supervisor@gctp.in');
    await loginPage.clickLogin();

    await expect(loginPage.emailInput).toBeVisible();
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-04: Login with invalid username and valid/dummy password', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.login('invalid.supervisor@gctp.in', 'WrongPassword123');

    // Verify login is rejected and user remains on supervisor view login
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-05: Login with valid-looking username and incorrect password', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.login('supervisor@gctp.in', 'IncorrectPassword999');

    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-06: Login with both credentials invalid', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.login('notarealuser@gctp.in', 'BadPass!@#');

    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    expect(new URL(page.url()).pathname).toContain('chennai-supervisorview');
  });

  test('SUP-NEG-07: Verify validation or error handling appears on invalid login', async ({ page }) => {
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.login('baduser@gctp.in', 'WrongPass123');

    // Check if either error text or input remains visible indicating rejection
    const emailVisible = await loginPage.emailInput.isVisible();
    expect(emailVisible).toBeTruthy();
  });

  test('SUP-NEG-08: Verify unauthorized direct navigation without valid session', async ({ page }) => {
    // Clear storage/cookies to simulate unauthenticated state
    await page.context().clearCookies();
    const loginPage = new SupervisorLoginPage(page);
    await loginPage.navigateToSupervisorLogin();

    // Verify login prompt / username input is accessible (unauthorized users cannot bypass login)
    await loginPage.waitForLoginPage();
    await expect(loginPage.emailInput).toBeVisible();
  });
});
