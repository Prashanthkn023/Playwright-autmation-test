import { test as setup, expect } from '@playwright/test';
import { loginToConfiguredCms, hasCmsSession, isLoginFormVisible } from '../utils/cmsLogin';
import fs from 'fs';
import path from 'path';

const cmsUrl = process.env.CMS_BASE_URL || 'https://cms.gctp.in/';
const finalAuthFile = 'playwright/.auth/cms-state.json';
const tempAuthFile = 'playwright/.auth/temp-cms-state.json';

setup('authenticate CMS session', async ({ page, browser }) => {
  setup.setTimeout(180000);
  console.log('\n============================================================');
  console.log('CENTRALIZED CMS AUTHENTICATION SETUP');
  console.log('============================================================');

  // Ensure the auth directory exists
  const authDir = path.dirname(finalAuthFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Check if existing auth state is already valid to avoid CMS rate-limiting on rapid re-runs
  if (fs.existsSync(finalAuthFile)) {
    try {
      console.log('Checking existing CMS authentication state...');
      const existingContext = await browser.newContext({ storageState: finalAuthFile });
      const existingPage = await existingContext.newPage();
      const targetUrl = new URL(cmsUrl);
      await existingPage.goto(`${targetUrl.origin}/chennai-home`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      const hasAuth = await hasCmsSession(existingPage, targetUrl.hostname);
      const formVisible = await isLoginFormVisible(existingPage);
      const isValid = hasAuth && !formVisible;
      await existingContext.close();

      if (isValid) {
        console.log('Existing CMS session is valid. Skipping re-login.');
        console.log('============================================================\n');
        return;
      }
    } catch {
      console.log('Existing CMS session check failed. Proceeding with fresh login.');
    }
  }

  // Perform the actual login using the existing shared helper.
  console.log(`Logging in to CMS at: ${cmsUrl}`);
  await loginToConfiguredCms(page, cmsUrl);

  // Reload the page to ensure CMS app state picks up the new session token
  console.log('Reloading to ensure session persistence...');
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Save storage state to a TEMPORARY file first
  await page.context().storageState({ path: tempAuthFile });
  console.log(`CMS authentication state saved temporarily to: ${tempAuthFile}`);

  // --------------------------------------------------------------------------
  // PHASE 3: VERIFY SAVED SESSION IN A FRESH CONTEXT
  // --------------------------------------------------------------------------
  console.log('\nVerifying saved session in a fresh browser context...');

  // Create a completely fresh context using the temporary state
  const freshContext = await browser.newContext({
    storageState: tempAuthFile,
  });
  const freshPage = await freshContext.newPage();

  try {
    // Navigate directly to a protected CMS page
    const targetUrl = new URL(cmsUrl);
    const protectedUrl = `${targetUrl.origin}/chennai-home`;

    console.log(`Navigating to protected URL: ${protectedUrl}`);
    await freshPage.goto(protectedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });

    // 1. Verify the login form is absent
    const usernameField = freshPage.locator('input[name="username"], input[type="email"]').first();
    const isLoginVisible = await usernameField.isVisible().catch(() => false);

    if (isLoginVisible) {
       throw new Error('Verification FAILED: Login form is still visible in the fresh context.');
    }
    console.log('Verification: Login form is absent.');

    // 2. Verify authenticated CMS navigation is visible
    // This selector is from utils/cmsLogin.ts:isCmsNavigationVisible
    const cmsNav = freshPage.locator('nav a[href*="-Cms"], nav a[href*="news"], nav a[href*="contact"], nav a[href*="city"]').first();
    await expect(cmsNav).toBeVisible({ timeout: 30000 });

    console.log('Verification: Authenticated CMS navigation is visible.');
    console.log('PASS: Centralized CMS authentication verified successfully.');

    // Move temporary file to final file only on success
    if (fs.existsSync(tempAuthFile)) {
      fs.renameSync(tempAuthFile, finalAuthFile);
      console.log(`Final authentication state moved to: ${finalAuthFile}`);
    }
  } catch (error) {
    console.error('Verification FAILED:', (error as Error).message);

    // Clean up temporary file on failure
    if (fs.existsSync(tempAuthFile)) {
        fs.unlinkSync(tempAuthFile);
        console.log('Temporary authentication state cleaned up.');
    }
    throw error;
  } finally {
    await freshContext.close();
  }

  console.log('============================================================\n');
});
