import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({

  testDir: './tests',

  timeout: Number(process.env.TIMEOUT) || 300000,

  expect: {
    timeout: 15000,
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

    navigationTimeout: 90000,

    ignoreHTTPSErrors: true,

    viewport: {
      width: 1366,
      height: 768
    },

    launchOptions: {
      slowMo: 200,
      args: [
        '--disable-blink-features=AutomationControlled'
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
