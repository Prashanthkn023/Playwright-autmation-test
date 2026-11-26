import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

export class SupervisorLoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly toggleVisibilityButton: Locator;
  readonly loginErrorText: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input[placeholder="example@gmail.com"], input[type="email"], input[name="username"]').first();
    this.passwordInput = page.locator('input[placeholder="*******"], input[name="password"], input[type="password"]').first();
    this.toggleVisibilityButton = page.locator('div:has(> input[placeholder="*******"]) button, input[placeholder="*******"] ~ button, input[type="password"] ~ button, div:has(> input[type="password"]) button').first();
    this.loginButton = page.getByRole('button', { name: /^login$/i }).or(page.locator('button[type="submit"], input[type="submit"]')).first();
    this.loginErrorText = page.locator('.alert-danger, .invalid-feedback, [role="alert"], p:has-text("Login Error!"), div:has-text("Login Error!")').first();
  }

  async navigateToSupervisorLogin(timeout = 60000) {
    const supervisorUrl = process.env.CMS_Supervisor_url || 'https://cms.gctp.in/chennai-supervisorview';
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.goto(supervisorUrl, { waitUntil: 'domcontentloaded', timeout });
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
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await closeAwarenessPopup(this.page).catch(() => {});
  }

  async waitForLoginPage(timeout = 15000) {
    await expect(this.emailInput).toBeVisible({ timeout });
  }

  async enterUsername(username: string) {
    await this.emailInput.click();
    await this.emailInput.fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async togglePasswordVisibility() {
    if (await this.toggleVisibilityButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.toggleVisibilityButton.click({ force: true });
    } else {
      console.warn('Password visibility toggle button not visible, skipping click.');
    }
  }

  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }

  async isPasswordMasked(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'password';
  }
}
