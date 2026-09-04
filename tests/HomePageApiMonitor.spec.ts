import dotenv from 'dotenv';
import path from 'path';

import {
  test,
  BrowserContext,
  Page,
  Request,
  Response
} from '@playwright/test';

/*
 * Increase test timeout because CMS login
 * and both website API captures take time
 */

test.setTimeout(
  120000
);

/*
 * Load .env from project root
 */

dotenv.config({
  path: path.resolve(
    process.cwd(),
    '.env'
  )
});

interface ApiCall {
  url: string;
  path: string;
  method: string;
  status: number;
}

/*
 * Check successful API status
 */

function isSuccessfulStatus(
  status: number
): boolean {
  return (
    (status >= 200 && status < 300) ||
    status === 304
  );
}

/*
 * Check whether request is a backend API request
 *
 * Excludes image upload files
 */

function isApiRequest(
  request: Request,
  url: string
): boolean {
  const resourceType =
    request.resourceType();

  const isXhrOrFetch =
    resourceType === 'xhr' ||
    resourceType === 'fetch';

  const isBackendApi =
    url.includes(
      '/api/fusion-cms-web-backend/'
    ) ||
    url.includes(
      '/api/fusion-public-facing-web-backend/'
    ) ||
    url.includes(
      '/api/fusion-configuration-service/'
    );

  const isUploadFile =
    url.includes(
      '/uploads/'
    );

  return (
    isXhrOrFetch &&
    isBackendApi &&
    !isUploadFile
  );
}

/*
 * Get API path
 */

function getApiPath(
  apiUrl: string
): string {
  try {
    return new URL(
      apiUrl
    ).pathname;
  } catch {
    return apiUrl;
  }
}

/*
 * Start API capture
 */

function startApiCapture(
  page: Page,
  websiteName: string
): {
  apiCalls: ApiCall[];
  stopCapture: () => void;
} {
  const apiCalls: ApiCall[] = [];

  const responseHandler = (
    response: Response
  ): void => {
    const request =
      response.request();

    const apiUrl =
      response.url();

    if (
      !isApiRequest(
        request,
        apiUrl
      )
    ) {
      return;
    }

    const apiCall: ApiCall = {
      url: apiUrl,
      path: getApiPath(
        apiUrl
      ),
      method: request.method(),
      status: response.status()
    };

    apiCalls.push(
      apiCall
    );

    console.log(
      `[${websiteName}] ${apiCall.method} ${apiCall.path} -> ${apiCall.status}`
    );
  };

  page.on(
    'response',
    responseHandler
  );

  return {
    apiCalls,

    stopCapture: (): void => {
      page.off(
        'response',
        responseHandler
      );
    }
  };
}

/*
 * Remove duplicate API calls
 *
 * If an API fails at least once,
 * keep the failed response.
 */

function getUniqueApis(
  apiCalls: ApiCall[]
): ApiCall[] {
  const uniqueApis =
    new Map<string, ApiCall>();

  for (
    const api of apiCalls
  ) {
    const key =
      `${api.method} ${api.path}`;

    const existingApi =
      uniqueApis.get(
        key
      );

    if (!existingApi) {
      uniqueApis.set(
        key,
        api
      );

      continue;
    }

    if (
      !isSuccessfulStatus(
        api.status
      )
    ) {
      uniqueApis.set(
        key,
        api
      );
    }
  }

  return Array.from(
    uniqueApis.values()
  );
}

/*
 * Get failed APIs
 */

function getFailedApis(
  apiCalls: ApiCall[]
): ApiCall[] {
  return apiCalls.filter(
    (api) =>
      !isSuccessfulStatus(
        api.status
      )
  );
}

/*
 * Automatically login to CMS
 */

async function loginToCms(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  console.log(
    '\nChecking CMS login page...'
  );

  const emailInput =
    page.getByPlaceholder(
      'example@gmail.com'
    );

  const passwordInput =
    page.locator(
      'input[type="password"]'
    ).first();

  const loginButton =
    page.getByRole(
      'button',
      {
        name: /login/i
      }
    );

  await emailInput.waitFor({
    state: 'visible',
    timeout: 15000
  });

  console.log(
    'CMS login page detected.'
  );

  console.log(
    'Entering CMS username...'
  );

  await emailInput.fill(
    username
  );

  console.log(
    'Entering CMS password...'
  );

  await passwordInput.fill(
    password
  );

  console.log(
    'Clicking LOGIN button...'
  );

  await loginButton.click();

  /*
   * Wait for CMS page after login
   */

  await page.waitForTimeout(
    5000
  );

  console.log(
    `CMS after login: ${page.url()}`
  );
}

/*
 * MAIN TEST
 */

test(
  'Monitor CMS and Published Website Homepage APIs',
  async ({ browser }) => {
    const cmsUrl =
      process.env.CMS_MODULE_URL?.trim();

    const publishedUrl =
      process.env.BASE_URL?.trim();

    const cmsUsername =
      process.env.CMS_USERNAME?.trim();

    const cmsPassword =
      process.env.CMS_PASSWORD?.trim();

    console.log(
      '\n========================================'
    );

    console.log(
      'ENVIRONMENT CHECK'
    );

    console.log(
      '========================================'
    );

    console.log(
      `CMS_MODULE_URL : ${cmsUrl || 'NOT FOUND'}`
    );

    console.log(
      `BASE_URL       : ${publishedUrl || 'NOT FOUND'}`
    );

    console.log(
      `CMS_USERNAME   : ${cmsUsername ? 'FOUND' : 'NOT FOUND'}`
    );

    console.log(
      `CMS_PASSWORD   : ${cmsPassword ? 'FOUND' : 'NOT FOUND'}`
    );

    console.log(
      '========================================'
    );

    if (!cmsUrl) {
      throw new Error(
        'CMS_MODULE_URL is missing in .env'
      );
    }

    if (!publishedUrl) {
      throw new Error(
        'BASE_URL is missing in .env'
      );
    }

    if (!cmsUsername) {
      throw new Error(
        'CMS_USERNAME is missing in .env'
      );
    }

    if (!cmsPassword) {
      throw new Error(
        'CMS_PASSWORD is missing in .env'
      );
    }

    /*
     * Create CMS browser context
     */

    const cmsContext: BrowserContext =
      await browser.newContext();

    const cmsPage: Page =
      await cmsContext.newPage();

    /*
     * Create Published browser context
     */

    const publishedContext: BrowserContext =
      await browser.newContext();

    const publishedPage: Page =
      await publishedContext.newPage();

    let cmsCapture:
      | {
          apiCalls: ApiCall[];
          stopCapture: () => void;
        }
      | undefined;

    let publishedCapture:
      | {
          apiCalls: ApiCall[];
          stopCapture: () => void;
        }
      | undefined;

    try {
      /*
       * ========================================
       * STEP 1 - OPEN CMS
       * ========================================
       */

      console.log(
        `\nOpening CMS: ${cmsUrl}`
      );

      /*
       * Start CMS API capture
       */

      cmsCapture =
        startApiCapture(
          cmsPage,
          'CMS'
        );

      await cmsPage.goto(
        cmsUrl,
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        }
      );

      console.log(
        `CMS opened: ${cmsPage.url()}`
      );

      /*
       * Login automatically
       */

      await loginToCms(
        cmsPage,
        cmsUsername,
        cmsPassword
      );

      /*
       * Capture CMS homepage APIs
       */

      console.log(
        '\nCapturing CMS homepage API calls...'
      );

      await cmsPage.waitForTimeout(
        8000
      );

      /*
       * Stop CMS capture
       */

      cmsCapture.stopCapture();

      /*
       * ========================================
       * STEP 2 - OPEN PUBLISHED WEBSITE
       * ========================================
       */

      console.log(
        `\nOpening PUBLISHED: ${publishedUrl}`
      );

      /*
       * Start Published API capture
       */

      publishedCapture =
        startApiCapture(
          publishedPage,
          'PUBLISHED'
        );

      await publishedPage.goto(
        publishedUrl,
        {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        }
      );

      console.log(
        `PUBLISHED opened: ${publishedPage.url()}`
      );

      /*
       * Capture Published homepage APIs
       */

      console.log(
        '\nCapturing Published homepage API calls...'
      );

      await publishedPage.waitForTimeout(
        8000
      );

      /*
       * Stop Published capture
       */

      publishedCapture.stopCapture();

      /*
       * Remove duplicate APIs
       */

      const cmsApis =
        getUniqueApis(
          cmsCapture.apiCalls
        );

      const publishedApis =
        getUniqueApis(
          publishedCapture.apiCalls
        );

      /*
       * Find failed APIs
       */

      const failedCmsApis =
        getFailedApis(
          cmsApis
        );

      const failedPublishedApis =
        getFailedApis(
          publishedApis
        );

      /*
       * FINAL REPORT
       */

      console.log(
        '\n========================================'
      );

      console.log(
        'FINAL API VALIDATION REPORT'
      );

      console.log(
        '========================================'
      );

      console.log('');

      console.log(
        `CMS APIs Captured       : ${cmsApis.length}`
      );

      console.log(
        `Published APIs Captured : ${publishedApis.length}`
      );

      console.log(
        `Failed CMS APIs         : ${failedCmsApis.length}`
      );

      console.log(
        `Failed Published APIs   : ${failedPublishedApis.length}`
      );

      console.log(
        '\nFailed CMS APIs:'
      );

      if (
        failedCmsApis.length === 0
      ) {
        console.log(
          '  None'
        );
      } else {
        for (
          const api of failedCmsApis
        ) {
          console.log(
            `  ${api.method} ${api.path} -> ${api.status}`
          );
        }
      }

      console.log(
        '\nFailed Published APIs:'
      );

      if (
        failedPublishedApis.length === 0
      ) {
        console.log(
          '  None'
        );
      } else {
        for (
          const api of failedPublishedApis
        ) {
          console.log(
            `  ${api.method} ${api.path} -> ${api.status}`
          );
        }
      }

      console.log(
        '\n========================================'
      );
    } finally {
      /*
       * Safely stop listeners
       */

      cmsCapture?.stopCapture();

      publishedCapture?.stopCapture();

      /*
       * Safely close contexts
       */

      await Promise.allSettled([
        cmsContext.close(),
        publishedContext.close()
      ]);
    }
  }
);