import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({

  testDir: './tests',

  timeout: Number(process.env.TIMEOUT) || 180000,

  expect: {
    timeout: 10000,
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

    navigationTimeout: 60000,

    ignoreHTTPSErrors: true,

    viewport: {
      width: 1366,
      height: 768
    },

    launchOptions: {
      slowMo: 200
    }

  },

  projects: [

    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome']
      }
    },

    // {
    //   name: 'Firefox',
    //   use: {
    //     ...devices['Desktop Firefox']
    //   }
    // },

    // {
    //   name: 'Webkit',
    //   use: {
    //     ...devices['Desktop Safari']
    //   }
    // }

  ],

  outputDir: 'test-results/',

});
