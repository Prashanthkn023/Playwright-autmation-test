import { test } from '@playwright/test';

test('Log all API responses', async ({ page }) => {

  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();

    if (url.includes('gctp.in/api/fusion-public-facing')) {
      console.log(`API Status: ${status} | URL: ${url}`);
    }
  });

  await page.goto('https://gctp.in/chennai-media');
  await page.pause();
  await page.waitForLoadState('networkidle');
});