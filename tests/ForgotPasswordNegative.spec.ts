import { test, expect } from '../fixtures/baseTest';
import { CmsLoginPage } from '../pages/CmsLoginPage';
import { CmsLoginTestData } from '../test-data/cmsLoginTestData';

test.describe('Forgot Password Negative Testing', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new CmsLoginPage(page);
    await loginPage.navigateToLogin();
    await loginPage.waitForLoginPage();
    await loginPage.openForgotPassword();
  });

  test('NEG-FP-01: Submit empty recovery email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toContain('required');
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-02: Submit malformed email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.noAtSymbol);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-03: Email without @', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.noAtSymbol);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-04: Email without domain', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.noDomain);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-05: Email containing spaces', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.withSpaces);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-06: Extremely long email @manual', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.extremeLengths.longEmail);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-07: HTML markup in email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.htmlMarkup);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-08: SQL injection-like email @manual', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.sqlInjection);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-09: Whitespace-only email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.onlySpaces);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/required|invalid|not valid/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });

  test('NEG-FP-10: Unsupported Unicode email', async ({ page }) => {
    const loginPage = new CmsLoginPage(page);

    await loginPage.enterRecoveryEmail(CmsLoginTestData.malformedEmails.unicodeChars);
    await loginPage.clickSendOTP();

    await expect(loginPage.forgotPasswordDialog).toBeVisible({ timeout: 5000 });
    const validationMessage = await loginPage.getRecoveryValidationMessage();
    expect(validationMessage.toLowerCase()).toMatch(/invalid|not valid|required/);
    expect(new URL(page.url()).origin).toBe('https://cms.gctp.in');
  });
});
