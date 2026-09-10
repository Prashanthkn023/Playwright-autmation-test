import { test, expect, Page } from '@playwright/test';

// =================================================
// CONFIGURATION
// =================================================

const CMS_URL = 'https://cms.gctp.in/chennai-gctp/';

// IMPORTANT:
// Replace this with the REAL API endpoint you see in
// Chrome DevTools -> Network -> Fetch/XHR when you
// manually create and save a record in CMS.
const CMS_CREATE_API =
  process.env.CMS_CREATE_API || '';

// IMPORTANT:
// Replace with the correct public GCTP GET API.
const GCTP_GET_API =
  process.env.GCTP_GET_API || 'https://gctp.in/api/fusion-public-facing-web-backend/home-page';


// =================================================
// CMS CREDENTIALS
// =================================================

// Recommended:
// Set these as environment variables.
//
// Windows PowerShell:
//
// $env:CMS_USERNAME="your_username"
// $env:CMS_PASSWORD="your_password"

const CMS_USERNAME =
  process.env.CMS_USERNAME || '';

const CMS_PASSWORD =
  process.env.CMS_PASSWORD || '';


// =================================================
// CLOSE POPUP / DIALOG
// =================================================

async function closePopup(page: Page) {

  const closeSelectors = [
    '[aria-label="Close"]',
    '[title="Close"]',
    '.btn-close',
    'button.close',
    '.close',
  ];

  for (const selector of closeSelectors) {

    const locator =
      page.locator(selector);

    const count =
      await locator.count();

    for (let i = 0; i < count; i++) {

      const element =
        locator.nth(i);

      if (
        await element
          .isVisible()
          .catch(() => false)
      ) {

        await element
          .click()
          .catch(() => {});

        console.log(
          'Popup closed'
        );

        return;

      }

    }

  }

}


// =================================================
// CMS LOGIN
// =================================================

async function loginToCMS(
  page: Page
) {

  console.log('');
  console.log('========================================');
  console.log('STEP 1: CMS LOGIN');
  console.log('========================================');


  // -----------------------------------------------
  // Validate credentials
  // -----------------------------------------------

  if (!CMS_USERNAME) {

    throw new Error(
      'CMS_USERNAME environment variable is missing'
    );

  }

  if (!CMS_PASSWORD) {

    throw new Error(
      'CMS_PASSWORD environment variable is missing'
    );

  }


  // -----------------------------------------------
  // Open CMS
  // -----------------------------------------------

  await page.goto(
    CMS_URL,
    {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    }
  );


  console.log(
    `CMS opened: ${page.url()}`
  );


  await page.waitForTimeout(2000);

  await closePopup(page);


  // =================================================
  // USERNAME / EMAIL INPUT
  // =================================================

  const usernameInput =
    page.locator(
      [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="username" i]',
        'input[placeholder*="example" i]',
        'input[type="text"]',
      ].join(', ')
    ).filter({
      has: page.locator(':scope')
    }).first();


  await expect(
    usernameInput,
    'CMS username/email field was not found'
  ).toBeVisible({
    timeout: 30000,
  });


  console.log(
    'Entering CMS username'
  );


  await usernameInput.fill(
    CMS_USERNAME
  );


  // =================================================
  // PASSWORD INPUT
  // =================================================

  const passwordInput =
    page.locator(
      'input[type="password"]'
    ).first();


  await expect(
    passwordInput,
    'CMS password field was not found'
  ).toBeVisible({
    timeout: 30000,
  });


  console.log(
    'Entering CMS password'
  );


  await passwordInput.fill(
    CMS_PASSWORD
  );


  // =================================================
  // LOGIN BUTTON
  // =================================================

  const loginButton =
    page.getByRole(
      'button',
      {
        name: /login|sign in|submit/i,
      }
    ).first();


  await expect(
    loginButton,
    'CMS login button was not found'
  ).toBeVisible({
    timeout: 30000,
  });


  console.log(
    'Clicking CMS login button'
  );


  await loginButton.click();


  // =================================================
  // WAIT AFTER LOGIN
  // =================================================

  await page.waitForTimeout(
    5000
  );


  console.log(
    `CMS URL after login: ${page.url()}`
  );


  // Basic login validation

  expect(
    page.url(),
    'CMS login did not navigate away from login page'
  ).not.toBe(CMS_URL);


  console.log('');
  console.log('========================================');
  console.log('CMS LOGIN SUCCESSFUL');
  console.log('========================================');

}


// =================================================
// GET AUTH TOKEN
// =================================================

async function getCmsToken(
  page: Page
): Promise<string | null> {

  console.log('');
  console.log('Checking CMS authentication token');


  const token =
    await page.evaluate(() => {

      // Check localStorage

      const localToken =
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('authToken');


      if (localToken) {
        return localToken;
      }


      // Check sessionStorage

      const sessionToken =
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('authToken');


      return sessionToken;

    });


  if (token) {

    console.log(
      'CMS authentication token found'
    );

  } else {

    console.log(
      'No token found. CMS may use cookies.'
    );

  }


  return token;

}


// =================================================
// CREATE CMS RECORD
// =================================================

async function createCmsRecord(
  page: Page,
  title: string
) {

  console.log('');
  console.log('========================================');
  console.log('STEP 2: CMS POST - CREATE RECORD');
  console.log('========================================');


  // Get token if CMS uses token authentication

  const token =
    await getCmsToken(page);


  // -----------------------------------------------
  // CREATE PAYLOAD
  // IMPORTANT:
  // Change this according to your actual CMS API
  // -----------------------------------------------

  const cmsPayload = {

    title: title,

    description:
      'Record created through Playwright automation',

  };


  console.log(
    'CMS POST Payload:'
  );

  console.log(
    JSON.stringify(
      cmsPayload,
      null,
      2
    )
  );


  // -----------------------------------------------
  // HEADERS
  // -----------------------------------------------

  const headers:
    Record<string, string> = {

      'Content-Type':
        'application/json',

    };


  // Add token only if one exists

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  // -----------------------------------------------
  // CMS POST REQUEST
  // -----------------------------------------------

  const response =
    await page.request.post(
      CMS_CREATE_API,
      {

        headers,

        data:
          cmsPayload,

      }
    );


  console.log(
    `CMS POST URL: ${CMS_CREATE_API}`
  );

  console.log(
    `CMS POST Status: ${response.status()}`
  );


  // Read response safely

  const responseText =
    await response.text();


  console.log(
    'CMS POST Response:'
  );

  console.log(
    responseText
  );


  // -----------------------------------------------
  // VALIDATE STATUS
  // -----------------------------------------------

  expect(

    response.ok(),

    `CMS POST API FAILED\n` +
    `Status: ${response.status()}\n` +
    `URL: ${CMS_CREATE_API}\n` +
    `Response: ${responseText}`

  ).toBeTruthy();


  // Parse JSON

  let responseData: any;

  try {

    responseData =
      JSON.parse(
        responseText
      );

  } catch {

    throw new Error(
      'CMS POST response is not valid JSON'
    );

  }


  return {

    cmsPayload,

    responseData,

  };

}


// =================================================
// EXTRACT CREATED ID
// =================================================

function extractCreatedRecord(
  cmsResponse: any,
  uniqueTitle: string
) {

  console.log('');
  console.log('========================================');
  console.log('STEP 3: EXTRACT CREATED RECORD');
  console.log('========================================');


  const createdId =

    cmsResponse.id ??

    cmsResponse._id ??

    cmsResponse.data?.id ??

    cmsResponse.data?._id ??

    cmsResponse.result?.id ??

    cmsResponse.result?._id;


  const createdTitle =

    cmsResponse.title ??

    cmsResponse.data?.title ??

    cmsResponse.result?.title ??

    uniqueTitle;


  console.log(
    `Created ID: ${createdId ?? 'Not returned'}`
  );

  console.log(
    `Created Title: ${createdTitle}`
  );


  return {

    createdId,

    createdTitle,

  };

}


// =================================================
// FIND RECORD IN GCTP
// =================================================

async function findRecordInGctp(
  page: Page,
  createdId: any,
  createdTitle: string
) {

  console.log('');
  console.log('========================================');
  console.log('STEP 4: GCTP GET - FIND RECORD');
  console.log('========================================');


  const maxAttempts = 10;

  const delay = 3000;


  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    console.log(
      `Checking GCTP API: Attempt ${attempt}/${maxAttempts}`
    );


    const response =
      await page.request.get(
        GCTP_GET_API
      );


    console.log(
      `GCTP GET Status: ${response.status()}`
    );


    expect(
      response.ok(),
      `GCTP GET API failed with ${response.status()}`
    ).toBeTruthy();


    const data =
      await response.json();


    // =============================================
    // FIND RECORD ARRAY
    // =============================================

    let records: any[] = [];


    if (
      Array.isArray(data)
    ) {

      records = data;

    }

    else if (
      Array.isArray(data.data)
    ) {

      records = data.data;

    }

    else if (
      Array.isArray(data.results)
    ) {

      records = data.results;

    }

    else if (
      Array.isArray(data.content)
    ) {

      records = data.content;

    }


    // =============================================
    // FIND SAME RECORD
    // =============================================

    const record =
      records.find(
        (item: any) => {

          const itemId =
            item.id ??
            item._id ??
            item.recordId;


          const itemTitle =
            item.title ??
            item.name ??
            item.heading;


          return (

            (
              createdId !== undefined &&
              createdId !== null &&
              String(itemId) ===
                String(createdId)
            )

            ||

            itemTitle ===
              createdTitle

          );

        }
      );


    if (record) {

      console.log(
        'PASS: CMS record found in GCTP'
      );

      return record;

    }


    console.log(
      'Record not yet reflected in GCTP'
    );


    if (
      attempt < maxAttempts
    ) {

      await page.waitForTimeout(
        delay
      );

    }

  }


  return null;

}


// =================================================
// MAIN TEST
// =================================================

test(
  'CMS POST -> GCTP GET -> Compare',

  async ({ page }) => {

    test.setTimeout(
      180000
    );

    test.skip(
      !CMS_CREATE_API || CMS_CREATE_API.includes('YOUR-CREATE-ENDPOINT'),
      'CMS create endpoint is not configured. Set CMS_CREATE_API in the environment to enable this test.'
    );


    // =============================================
    // HANDLE BROWSER POPUPS
    // =============================================

    page.on(
      'dialog',

      async (dialog) => {

        console.log(
          `Browser dialog: ${dialog.message()}`
        );

        await dialog.dismiss();

      }

    );


    // =============================================
    // STEP 1: AUTO LOGIN
    // =============================================

    await loginToCMS(
      page
    );


    // =============================================
    // UNIQUE DATA
    // =============================================

    const uniqueTitle =
      `Playwright Automation ${Date.now()}`;


    // =============================================
    // STEP 2: CMS POST
    // =============================================

    const {

      cmsPayload,

      responseData,

    } = await createCmsRecord(
      page,
      uniqueTitle
    );


    // =============================================
    // STEP 3: EXTRACT RECORD
    // =============================================

    const {

      createdId,

      createdTitle,

    } = extractCreatedRecord(
      responseData,
      uniqueTitle
    );


    // =============================================
    // STEP 4: GCTP GET
    // =============================================

    const gctpRecord =
      await findRecordInGctp(

        page,

        createdId,

        createdTitle

      );


    // =============================================
    // STEP 5: VERIFY RECORD EXISTS
    // =============================================

    console.log('');
    console.log('========================================');
    console.log('STEP 5: VERIFY RECORD');
    console.log('========================================');


    expect(

      gctpRecord,

      `CMS record was not found in GCTP.\n` +
      `ID: ${createdId}\n` +
      `Title: ${createdTitle}`

    ).toBeTruthy();


    // =============================================
    // STEP 6: COMPARE DATA
    // =============================================

    console.log('');
    console.log('========================================');
    console.log('STEP 6: COMPARE CMS VS GCTP');
    console.log('========================================');


    const gctpTitle =

      gctpRecord.title ??

      gctpRecord.name ??

      gctpRecord.heading;


    expect(

      gctpTitle,

      'Title mismatch between CMS and GCTP'

    ).toBe(

      createdTitle

    );


    console.log(
      'PASS: Title matches'
    );


    // Description comparison

    const gctpDescription =

      gctpRecord.description ??

      gctpRecord.content ??

      gctpRecord.details;


    if (
      gctpDescription !== undefined
    ) {

      expect(

        gctpDescription,

        'Description mismatch between CMS and GCTP'

      ).toBe(

        cmsPayload.description

      );


      console.log(
        'PASS: Description matches'
      );

    }


    // =============================================
    // FINAL RESULT
    // =============================================

    console.log('');
    console.log('========================================');
    console.log('FINAL RESULT');
    console.log('========================================');

    console.log(
      'PASS: CMS POST -> GCTP GET -> DATA MATCH'
    );

    console.log('========================================');

  }

);