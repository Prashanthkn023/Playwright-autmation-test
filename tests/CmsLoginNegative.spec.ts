import { enforceProductionSafety } from '../utils/cmsTestSafety';
import { test, expect } from '../fixtures/baseTest';
import { CmsLoginPage } from '../pages/CmsLoginPage';
import { CmsLoginTestData, EmptyValues, WhitespaceValues, QA_TEST_PASSWORD } from '../test-data/cmsLoginTestData';

test.describe('CMS Login Negative Testing', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new CmsLoginPage(page);
    await loginPage.navigateToLogin();
    await loginPage.waitForLoginPage();
  });

  test('NEG-LOGIN-01: Submit both fields empty', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.clickLogin();

    // Expected: User remains on login screen, validation message "Login Error!" is visible
    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-02: Submit email empty', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    // Expected: Login rejected, remain on screen
    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-03: Submit password empty', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail('qa-test@gctp.in');
    await loginPage.clickLogin();

    // Expected: Login rejected, remain on screen
    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-04: Email without @ symbol', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.noAtSymbol);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-05: Email without domain', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.noDomain);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-06: Email containing spaces', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.withSpaces);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-07: Email containing only spaces', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.onlySpaces);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-08: Password containing only spaces', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterPassword(CmsLoginTestData.malformedEmails.onlySpaces); // Reuse space-only string
    await loginPage.enterEmail('qa-test@gctp.in');
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-09: Extremely long email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.extremeLengths.longEmail);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-10: Extremely long password', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterPassword(CmsLoginTestData.extremeLengths.longPassword);
    await loginPage.enterEmail('qa-test@gctp.in');
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-11: Password containing special characters', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail('qa-test@gctp.in');
    await loginPage.enterPassword(CmsLoginTestData.specialChars.password);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-12: Email containing Unicode characters', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.unicodeChars);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-13: Invalid QA credentials', async ({ page }) => {
    enforceProductionSafety('NEG-LOGIN-13', true);
    const loginPage = new CmsLoginPage(page);
    await loginPage.enterEmail('invalid-qa-user@gctp.in');
    await loginPage.enterPassword('WrongPassword123');
    await loginPage.clickLogin();
    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-14: HTML markup in email field', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.htmlMarkup);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-LOGIN-15: SQL injection-like input', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterEmail(CmsLoginTestData.malformedEmails.sqlInjection);
    await loginPage.enterPassword(QA_TEST_PASSWORD);
    await loginPage.clickLogin();

    await expect(loginPage.loginErrorText).toBeVisible({ timeout: 5000 });
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });
});
