import { expect, test } from '@playwright/test';

test('CMS Supervisor login', async ({ page }) => {
  const supervisorUrl =
    process.env.CMS_Supervisor_url || 'https://cms.gctp.in/chennai-supervisorview';
  const username = process.env.CMS_Supervisor_username;
  const password = process.env.CMS_Supervisor_password;

  if (!username || !password) {
    throw new Error(
      'CMS supervisor credentials are missing. Set CMS_Supervisor_username and CMS_Supervisor_password.',
    );
  }

  await page.goto(supervisorUrl, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('CMS Website');

  const emailInput = page
    .locator('input[placeholder="example@gmail.com"], input[type="email"], input[name="username"]')
    .first();
  const passwordInput = page
    .locator('input[placeholder="*******"], input[type="password"], input[name="password"]')
    .first();
  const loginButton = page
    .getByRole('button', { name: /^login$/i })
    .or(page.locator('button[type="submit"], input[type="submit"]'))
    .first();

  await expect(emailInput).toBeVisible();
  await emailInput.fill(username);
  await passwordInput.fill(password);
  await loginButton.click();

  await expect(emailInput).toBeHidden({ timeout: 30000 });
  await expect(page).toHaveURL(/chennai-supervisorview/);
});
