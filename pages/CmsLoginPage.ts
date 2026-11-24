import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

export class CmsLoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly toggleVisibilityButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly loginErrorText: Locator;

  // Forgot password dialog locators
  readonly forgotPasswordDialog: Locator;
  readonly recoveryEmailInput: Locator;
  readonly sendOtpButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input[placeholder="example@gmail.com"], input[type="email"], input[name="username"]').first();
    this.passwordInput = page.locator('input[placeholder="*******"], input[name="password"], input[type="password"]').first();
    this.toggleVisibilityButton = page.locator('div:has(> input[placeholder="*******"]) button, input[placeholder="*******"] ~ button, input[type="password"] ~ button, div:has(> input[type="password"]) button').first();
    this.loginButton = page.getByRole('button', { name: /^login$/i }).or(page.locator('button[type="submit"], input[type="submit"]')).first();
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i }).or(page.locator('button:has-text("Forgot password")')).first();
    this.loginErrorText = page.locator('.alert-danger, .invalid-feedback, [role="alert"], p:has-text("Login Error!"), div:has-text("Login Error!")').first();

    // Forgot password dialog
    this.forgotPasswordDialog = page.locator('div[role="dialog"], .modal.show, .MuiDialog-root').first();
    this.recoveryEmailInput = page.locator('div[role="dialog"] input[type="email"], div[role="dialog"] input[type="text"], .modal input').first();
    this.sendOtpButton = page.locator('div[role="dialog"] button:has-text("Send OTP"), .modal button:has-text("Send OTP")').first();
    this.cancelButton = page.locator('div[role="dialog"] button:has-text("Cancel"), .modal button:has-text("Cancel")').first();
  }

  async navigateToLogin(timeout = 60000) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.goto('https://cms.gctp.in', { waitUntil: 'domcontentloaded', timeout });
        break;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ERR_NETWORK_CHANGED') && attempt < maxAttempts) {
          console.warn(`Navigation hit net::ERR_NETWORK_CHANGED on attempt ${attempt}. Retrying...`);
          await this.page.waitForTimeout(2000);
          continue;
        }
        throw error;
      }
    }
    // Allow natural application redirect to occur without forcing a specific URL
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await closeAwarenessPopup(this.page).catch(() => {});
  }

  async waitForLoginPage(timeout = 15000) {
    await expect(this.emailInput).toBeVisible({ timeout });
  }

  async enterEmail(email: string) {
    await this.emailInput.click();
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  async getLoginError(): Promise<Locator> {
    return this.loginErrorText;
  }

  async togglePasswordVisibility() {
    if (await this.toggleVisibilityButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.toggleVisibilityButton.click({ force: true });
    } else {
      console.warn('Password visibility toggle button not visible, skipping click.');
    }
  }

  async isPasswordVisible(): Promise<boolean> {
    const input = this.page.locator('input[placeholder="*******"], input[type="password"], input[type="text"]').first();
    const type = await input.getAttribute('type');
    return type === 'text';
  }

  async openForgotPassword() {
    await this.forgotPasswordButton.click({ force: true });
    await expect(this.forgotPasswordDialog).toBeVisible({ timeout: 10000 });
  }

  getForgotPasswordDialog(): Locator {
    return this.forgotPasswordDialog;
  }

  async enterRecoveryEmail(email: string) {
    await this.recoveryEmailInput.click();
    await this.recoveryEmailInput.fill(email);
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickSendOTP() {
    await this.sendOtpButton.click();
  }

  async getRecoveryValidationMessage(): Promise<string> {
    const helperText = this.page.locator('div[role="dialog"] .MuiFormHelperText-root, div[role="dialog"] .error-message, div[role="dialog"] p.text-danger, .modal .invalid-feedback').first();
    if (await helperText.isVisible({ timeout: 3000 }).catch(() => false)) {
      return (await helperText.textContent()) || '';
    }
    return '';
  }
}
