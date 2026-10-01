import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',

  // Global test timeout
  timeout: Number(process.env.TIMEOUT) || 600000,

  // Assertion timeout
  expect: {
    timeout: 30000,
  },

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : Number(process.env.WORKERS) || 1,

  // Terminal + Allure + Excel Bug Report
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
      },
    ],
    ['./reporters/bugReporter.ts'],
  ],

  use: {
    // Application URL
    baseURL: process.env.BASE_URL || 'https://gctp.in',

    // Browser mode:
    // HEADLESS=false -> Show browser locally
    // HEADLESS=true  -> Run browser in background
    // Default        -> Headless mode
    headless: process.env.HEADLESS?.toLowerCase() !== 'false',

    // Failure artifacts
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Timeouts
    actionTimeout: 60000,
    navigationTimeout: 120000,

    // Browser settings
    ignoreHTTPSErrors: true,

    viewport: {
      width: 1366,
      height: 768,
    },

    launchOptions: {
      slowMo: process.env.HEADLESS?.toLowerCase() === 'false' ? 200 : 0,

      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-blink-features=BlockCredentialedSubresources',
      ],
    },
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        bypassCSP: true,
      },
    },
  ],

  // Test output directory
  outputDir: 'test-results/',
});