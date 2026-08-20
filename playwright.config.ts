import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({

  testDir: './tests',

  timeout: Number(process.env.TIMEOUT) || 600000, // Increased to 10 minutes

  expect: {
    timeout: 30000, // Increased expectation timeout
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['allure-playwright']
  ],

  use: {

    baseURL: process.env.BASE_URL || 'https://gctp.in/chennai-home',
    headless: process.env.CI ? true : process.env.HEADLESS === 'true',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    actionTimeout: 60000,

    navigationTimeout: 120000, // Increased navigation timeout

    ignoreHTTPSErrors: true,

    viewport: {
      width: 1366,
      height: 768
    },

    launchOptions: {
      slowMo: 200,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-blink-features=BlockCredentialedSubresources' // Allow loading images without CORS issues
      ]
    }

  },

  projects: [

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        bypassCSP: true,
      }
    },

  ],

  outputDir: 'test-results/',

});
