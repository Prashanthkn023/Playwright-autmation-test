
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',

  // Empty placeholder test used only by Playwright agents
  testIgnore: /seed\.spec\.ts/,

  // Global teardown
  globalTeardown: './global-teardown.ts',

  // Global test timeout
  timeout: Math.min(Number(process.env.TIMEOUT) || 90000, 90000),

  // Assertion timeout
  expect: {
    timeout: 10000,
  },

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : Number(process.env.WORKERS) || 1,

  // Terminal + HTML + JUnit + Allure + Excel Bug Report
  reporter: [
    ['list'],

    // Playwright HTML report
    [
      'html',
      {
        open: 'never',
        outputFolder: 'playwright-report',
      },
    ],

    // JUnit XML report for Jenkins email summary
    [
      'junit',
      {
        outputFile: 'test-results/results.xml',
      },
    ],

    // Allure report
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
      },
    ],

    // Custom Excel Bug Reporter
    ['./reporters/bugReporter.ts'],
  ],

  use: {
    // Application URL
    baseURL: process.env.BASE_URL || 'https://gctp.in',

    // Optional runner-specific request identity and headers
    userAgent: process.env.PLAYWRIGHT_USER_AGENT || process.env.USER_AGENT,
    extraHTTPHeaders: (() => {
      const rawHeaders = process.env.EXTRA_HEADERS;
      if (!rawHeaders) return undefined;
      try {
        return JSON.parse(rawHeaders);
      } catch (error) {
        throw new Error(
          `EXTRA_HEADERS must be valid JSON: ${(error as Error).message}`
        );
      }
    })(),

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
    actionTimeout: 30000,
    navigationTimeout: 45000,

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
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'cms-tests',
      testMatch: /(?:cms-vs-website-comparison[\\/].*\.(?:spec\.ts)|cms-abt-tamil[\\/].*\.spec\.ts)/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        bypassCSP: true,
        storageState: 'playwright/.auth/cms-state.json',
      },
    },
    {
      name: 'chromium',
      testIgnore: /(?:cms-vs-website-comparison[\\/].*\.spec\.ts|cms-abt-tamil[\\/].*\.spec\.ts|auth\.setup\.ts)/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        bypassCSP: true,
      },
    },
    // {
    //   name: 'firefox',
    //   testIgnore: /(?:cms-vs-website-comparison[\\/].*\.spec\.ts|cms-abt-tamil[\\/].*\.spec\.ts|auth\.setup\.ts)/,
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     bypassCSP: true,
    //   },
    // },
  ],

  // Test output directory
  outputDir: 'test-results/',
});
