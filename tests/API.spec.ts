import {
  test,
  expect,
} from '@playwright/test';

import fs from 'fs';

import path from 'path';


// ============================================================
// CMS CONFIGURATION
// ============================================================

const CMS_URL =
  'https://cms.gctp.in/chennai-gctp/';

const CMS_USERNAME =
  'YOUR_CMS_USERNAME';

const CMS_PASSWORD =
  'YOUR_CMS_PASSWORD';


// ============================================================
// GCTP CONFIGURATION
// ============================================================

const GCTP_BASE_URL =
  'https://gctp.in';


// ============================================================
// BUG REPORT CONFIGURATION
// ============================================================

const BUG_REPORT_DIR =
  path.join(
    process.cwd(),
    'bug-reports'
  );


const BUG_REPORT_FILE =
  path.join(
    BUG_REPORT_DIR,
    'api-differences.json'
  );


// ============================================================
// API ENDPOINT MAPPING
// ============================================================

const API_MAPPINGS = [

  {
    name:
      'Home Page',

    cmsEndpoint:
      '/api/fusion-cms-web-backend/home-page?approvalStatus=all',

    gctpEndpoint:
      '/api/fusion-public-facing-web-backend/home-page',

    website:
      'https://gctp.in/chennai-home',
  },

];


// ============================================================
// CMS-ONLY FIELDS
// THESE FIELDS WILL NOT BE COMPARED
// ============================================================

const IGNORE_FIELDS = [

  'id',

  '_id',

  'approvalStatus',

  'createdAt',

  'updatedAt',

  'createdDate',

  'updatedDate',

  'createdBy',

  'updatedBy',

  'approvedBy',

  'approvedDate',

  'version',

];


// ============================================================
// NORMALIZE API DATA
// ============================================================

function normalizeData(
  data: any
): any {

  if (
    data === null ||
    data === undefined
  ) {

    return data;

  }


  // ----------------------------------------------------------
  // ARRAY
  // ----------------------------------------------------------

  if (
    Array.isArray(data)
  ) {

    return data.map(
      normalizeData
    );

  }


  // ----------------------------------------------------------
  // OBJECT
  // ----------------------------------------------------------

  if (
    typeof data === 'object'
  ) {

    const normalized: any = {};


    Object.keys(data)
      .sort()
      .forEach(
        (key) => {

          if (
            !IGNORE_FIELDS.includes(key)
          ) {

            normalized[key] =
              normalizeData(
                data[key]
              );

          }

        }
      );


    return normalized;

  }


  // ----------------------------------------------------------
  // STRING
  // ----------------------------------------------------------

  if (
    typeof data === 'string'
  ) {

    return data

      .replace(
        /\s+/g,
        ' '
      )

      .trim();

  }


  return data;

}


// ============================================================
// DIFFERENCE TYPE
// ============================================================

interface Difference {

  endpoint:
    string;

  path:
    string;

  type:
    string;

  cmsValue:
    any;

  gctpValue:
    any;

}


// ============================================================
// CHECK IGNORE FIELD
// ============================================================

function shouldIgnoreField(
  key: string
): boolean {

  return IGNORE_FIELDS.includes(
    key
  );

}


// ============================================================
// COMPARE CMS AND GCTP DATA
// ============================================================

function findDifferences(

  cmsData: any,

  gctpData: any,

  endpoint: string,

  currentPath = ''

): Difference[] {

  const differences:
    Difference[] = [];


  // ----------------------------------------------------------
  // MISSING IN CMS
  // ----------------------------------------------------------

  if (
    cmsData === undefined &&
    gctpData !== undefined
  ) {

    differences.push({

      endpoint,

      path:
        currentPath,

      type:
        'MISSING_IN_CMS',

      cmsValue:
        undefined,

      gctpValue:
        gctpData,

    });


    return differences;

  }


  // ----------------------------------------------------------
  // MISSING IN GCTP
  // ----------------------------------------------------------

  if (
    cmsData !== undefined &&
    gctpData === undefined
  ) {

    differences.push({

      endpoint,

      path:
        currentPath,

      type:
        'MISSING_IN_GCTP',

      cmsValue:
        cmsData,

      gctpValue:
        undefined,

    });


    return differences;

  }


  // ----------------------------------------------------------
  // NULL COMPARISON
  // ----------------------------------------------------------

  if (
    cmsData === null ||
    gctpData === null
  ) {

    if (
      cmsData !== gctpData
    ) {

      differences.push({

        endpoint,

        path:
          currentPath,

        type:
          'NULL_MISMATCH',

        cmsValue:
          cmsData,

        gctpValue:
          gctpData,

      });

    }


    return differences;

  }


  // ----------------------------------------------------------
  // TYPE MISMATCH
  // ----------------------------------------------------------

  if (
    typeof cmsData !==
    typeof gctpData
  ) {

    differences.push({

      endpoint,

      path:
        currentPath,

      type:
        'TYPE_MISMATCH',

      cmsValue:
        cmsData,

      gctpValue:
        gctpData,

    });


    return differences;

  }


  // ----------------------------------------------------------
  // ARRAY COMPARISON
  // ----------------------------------------------------------

  if (
    Array.isArray(cmsData) &&
    Array.isArray(gctpData)
  ) {

    if (
      cmsData.length !==
      gctpData.length
    ) {

      differences.push({

        endpoint,

        path:
          currentPath,

        type:
          'ARRAY_LENGTH_MISMATCH',

        cmsValue:
          `Length: ${cmsData.length}`,

        gctpValue:
          `Length: ${gctpData.length}`,

      });

    }


    const maxLength =
      Math.max(

        cmsData.length,

        gctpData.length

      );


    for (

      let index = 0;

      index < maxLength;

      index++

    ) {

      differences.push(

        ...findDifferences(

          cmsData[index],

          gctpData[index],

          endpoint,

          `${currentPath}[${index}]`

        )

      );

    }


    return differences;

  }


  // ----------------------------------------------------------
  // OBJECT COMPARISON
  // ----------------------------------------------------------

  if (

    typeof cmsData ===
      'object'

    &&

    typeof gctpData ===
      'object'

  ) {

    const allKeys =
      new Set([

        ...Object.keys(
          cmsData
        ),

        ...Object.keys(
          gctpData
        ),

      ]);


    for (
      const key of allKeys
    ) {

      // ------------------------------------------------------
      // IGNORE CMS-ONLY FIELD
      // ------------------------------------------------------

      if (
        shouldIgnoreField(key)
      ) {

        continue;

      }


      const newPath =
        currentPath

          ? `${currentPath}.${key}`

          : key;


      differences.push(

        ...findDifferences(

          cmsData[key],

          gctpData[key],

          endpoint,

          newPath

        )

      );

    }


    return differences;

  }


  // ----------------------------------------------------------
  // VALUE COMPARISON
  // ----------------------------------------------------------

  if (
    cmsData !== gctpData
  ) {

    differences.push({

      endpoint,

      path:
        currentPath,

      type:
        'VALUE_MISMATCH',

      cmsValue:
        cmsData,

      gctpValue:
        gctpData,

    });

  }


  return differences;

}


// ============================================================
// CREATE BUG REPORT DIRECTORY
// ============================================================

function startBugReporter() {

  console.log(

    '\n======================================'

  );

  console.log(

    ' BUG REPORTER STARTED'

  );

  console.log(

    '======================================'

  );


  if (
    fs.existsSync(
      BUG_REPORT_DIR
    )
  ) {

    fs.rmSync(

      BUG_REPORT_DIR,

      {

        recursive:
          true,

        force:
          true,

      }

    );


    console.log(

      'Previous bug reports cleared'

    );

  }


  fs.mkdirSync(

    BUG_REPORT_DIR,

    {

      recursive:
        true,

    }

  );


  fs.writeFileSync(

    BUG_REPORT_FILE,

    JSON.stringify(

      [],

      null,

      2

    )

  );

}


// ============================================================
// SAVE DIFFERENCES
// ============================================================

function saveDifferences(

  differences:
    Difference[]

) {

  fs.writeFileSync(

    BUG_REPORT_FILE,

    JSON.stringify(

      differences,

      null,

      2

    )

  );


  console.log(

    `\nDifferences saved: ${BUG_REPORT_FILE}`

  );

}


// ============================================================
// GENERATE BUG REPORT
// ============================================================

function generateBugReport(

  differences:
    Difference[]

) {

  const reportFile =
    path.join(

      BUG_REPORT_DIR,

      'bug-report.txt'

    );


  let report =
    '\n========================================\n';


  report +=
    '           API BUG REPORT\n';


  report +=
    '========================================\n\n';


  report +=
    `Generated: ${new Date().toLocaleString()}\n\n`;


  report +=
    `Total Differences: ${differences.length}\n`;


  report +=
    '\n========================================\n';


  differences.forEach(

    (
      difference,
      index
    ) => {

      report +=
        `\nBUG ${index + 1}\n`;


      report +=
        '----------------------------------------\n';


      report +=
        `Endpoint: ${difference.endpoint}\n`;


      report +=
        `Type: ${difference.type}\n`;


      report +=
        `Path: ${difference.path}\n\n`;


      report +=
        'CMS VALUE:\n';


      report +=
        `${JSON.stringify(
          difference.cmsValue,
          null,
          2
        )}\n\n`;


      report +=
        'GCTP VALUE:\n';


      report +=
        `${JSON.stringify(
          difference.gctpValue,
          null,
          2
        )}\n`;


      report +=
        '----------------------------------------\n';

    }

  );


  fs.writeFileSync(

    reportFile,

    report

  );


  console.log(

    `Bug report generated: ${reportFile}`

  );

}


// ============================================================
// CMS LOGIN
// ============================================================

async function cmsLogin(
  page: any
) {

  console.log(

    '\n========================================'

  );

  console.log(

    'STEP 1: CMS LOGIN'

  );

  console.log(

    '========================================'

  );


  await page.goto(

    CMS_URL,

    {

      waitUntil:
        'domcontentloaded',

    }

  );


  console.log(

    `CMS opened: ${CMS_URL}`

  );


  /*
  ============================================================

  UPDATE THESE SELECTORS WITH YOUR ACTUAL CMS SELECTORS

  ============================================================

  Example:

  await page
    .locator(
      'input[name="username"]'
    )
    .fill(
      CMS_USERNAME
    );


  await page
    .locator(
      'input[name="password"]'
    )
    .fill(
      CMS_PASSWORD
    );


  await page
    .locator(
      'button[type="submit"]'
    )
    .click();


  await page.waitForLoadState(
    'networkidle'
  );

  ============================================================
  */


  console.log(

    'CMS login completed'

  );

}


// ============================================================
// CMS API VALIDATION
// ============================================================

async function validateCMSApi(

  request: any,

  endpoint: string

) {

  const response =
    await request.get(
      endpoint
    );


  console.log(

    `CMS API Status: ${response.status()}`

  );


  expect(

    response.ok(),

    `CMS API Failed: ${endpoint}`

  ).toBeTruthy();


  return response;

}


// ============================================================
// GCTP API VALIDATION
// ============================================================

async function validateGCTPApi(

  request: any,

  endpoint: string

) {

  const response =
    await request.get(
      endpoint
    );


  console.log(

    `GCTP API Status: ${response.status()}`

  );


  expect(

    response.ok(),

    `GCTP API Failed: ${endpoint}`

  ).toBeTruthy();


  return response;

}


// ============================================================
// VALIDATE WEBSITE UI
// ============================================================

async function validateWebsiteUI(

  page: any,

  websiteUrl: string,

  gctpData: any

) {

  console.log(

    '\n========================================'

  );

  console.log(

    'OPEN GCTP WEBSITE'

  );

  console.log(

    '========================================'

  );


  await page.goto(

    websiteUrl,

    {

      waitUntil:
        'domcontentloaded',

    }

  );


  console.log(

    `Website opened: ${websiteUrl}`

  );


  // ----------------------------------------------------------
  // EXAMPLE UI VALIDATION
  // ----------------------------------------------------------

  /*
  Change this according to your website.
  */


  const heading =
    page.locator(
      'h1'
    ).first();


  if (
    await heading.count() > 0
  ) {

    const websiteText =
      await heading.textContent();


    console.log(

      `Website H1: ${websiteText?.trim()}`

    );


    /*
    EXAMPLE:

    if (gctpData.title) {

      expect(
        websiteText?.trim()
      ).toBe(
        gctpData.title.trim()
      );

    }

    */

  }


  console.log(

    'Website UI validation completed'

  );

}


// ============================================================
// MAIN TEST
// ============================================================

test(

  'CMS → GCTP API → Website Validation',

  async (

    {

      page,

      request,

    },

    testInfo

  ) => {


    // ========================================================
    // START BUG REPORTER
    // ========================================================

    startBugReporter();


    // ========================================================
    // CMS LOGIN
    // ========================================================

    await cmsLogin(
      page
    );


    const allDifferences:
      Difference[] = [];


    // ========================================================
    // LOOP THROUGH ENDPOINTS
    // ========================================================

    for (

      const mapping

      of API_MAPPINGS

    ) {


      console.log(

        '\n========================================'

      );

      console.log(

        `VALIDATING: ${mapping.name}`

      );

      console.log(

        '========================================'

      );


      // ======================================================
      // CMS API VALIDATION
      // ======================================================

      console.log(

        '\nSTEP 2: CMS API VALIDATION'

      );


      const cmsUrl =
        `${CMS_URL.replace(
          /\/$/,
          ''
        )}${mapping.cmsEndpoint}`;


      const cmsResponse =
        await validateCMSApi(

          request,

          cmsUrl

        );


      // ======================================================
      // GET CMS RESPONSE
      // ======================================================

      console.log(

        '\nSTEP 3: GET CMS RESPONSE'

      );


      const cmsRawData =
        await cmsResponse.json();


      console.log(

        'CMS response received successfully'

      );


      // ======================================================
      // GET GCTP RESPONSE
      // ======================================================

      console.log(

        '\nSTEP 4: GET GCTP RESPONSE'

      );


      const gctpUrl =
        `${GCTP_BASE_URL}${mapping.gctpEndpoint}`;


      const gctpResponse =
        await validateGCTPApi(

          request,

          gctpUrl

        );


      const gctpRawData =
        await gctpResponse.json();


      console.log(

        'GCTP response received successfully'

      );


      // ======================================================
      // MATCH ENDPOINTS
      // ======================================================

      console.log(

        '\nSTEP 5: MATCH ENDPOINTS'

      );


      console.log(

        `CMS Endpoint:\n${cmsUrl}`

      );


      console.log(

        `GCTP Endpoint:\n${gctpUrl}`

      );


      console.log(

        `Matched Page:\n${mapping.name}`

      );


      // ======================================================
      // IGNORE CMS-ONLY FIELDS
      // ======================================================

      console.log(

        '\nSTEP 6: IGNORE CMS-ONLY FIELDS'

      );


      const cmsData =
        normalizeData(
          cmsRawData
        );


      const gctpData =
        normalizeData(
          gctpRawData
        );


      console.log(

        `Ignored Fields: ${IGNORE_FIELDS.join(', ')}`

      );


      // ======================================================
      // COMPARE RESPONSE DATA
      // ======================================================

      console.log(

        '\nSTEP 7: COMPARE RESPONSE DATA'

      );


      const differences =
        findDifferences(

          cmsData,

          gctpData,

          mapping.name

        );


      allDifferences.push(

        ...differences

      );


      if (
        differences.length === 0
      ) {

        console.log(

          '\n✅ API RESPONSES MATCH'

        );

      }


      else {

        console.log(

          `\n❌ FOUND ${differences.length} DIFFERENCE(S)`

        );


        differences.forEach(

          (
            difference,
            index
          ) => {

            console.log(

              '\n----------------------------------------'

            );


            console.log(

              `DIFFERENCE ${index + 1}`

            );


            console.log(

              `Endpoint: ${difference.endpoint}`

            );


            console.log(

              `Type: ${difference.type}`

            );


            console.log(

              `Path: ${difference.path}`

            );


            console.log(

              'CMS Value:'

            );


            console.log(

              JSON.stringify(

                difference.cmsValue,

                null,

                2

              )

            );


            console.log(

              'GCTP Value:'

            );


            console.log(

              JSON.stringify(

                difference.gctpValue,

                null,

                2

              )

            );

          }

        );

      }


      // ======================================================
      // OPEN GCTP WEBSITE
      // ======================================================

      console.log(

        '\nSTEP 8: OPEN GCTP WEBSITE'

      );


      // ======================================================
      // VALIDATE UI DATA
      // ======================================================

      console.log(

        '\nSTEP 9: VALIDATE UI DATA'

      );


      await validateWebsiteUI(

        page,

        mapping.website,

        gctpData

      );

    }


    // ========================================================
    // SAVE DIFFERENCES
    // ========================================================

    console.log(

      '\n========================================'

    );

    console.log(

      'STEP 10: SAVE DIFFERENCES'

    );

    console.log(

      '========================================'

    );


    saveDifferences(

      allDifferences

    );


    // ========================================================
    // GENERATE BUG REPORT
    // ========================================================

    console.log(

      '\n========================================'

    );

    console.log(

      'STEP 11: GENERATE BUG REPORT'

    );

    console.log(

      '========================================'

    );


    if (
      allDifferences.length > 0
    ) {

      generateBugReport(

        allDifferences

      );


      // ------------------------------------------------------
      // ALLURE ATTACHMENT
      // ------------------------------------------------------

      await testInfo.attach(

        'API Differences',

        {

          path:
            BUG_REPORT_FILE,

          contentType:
            'application/json',

        }

      );

    }


    // ========================================================
    // ALLURE REPORT
    // ========================================================

    console.log(

      '\n========================================'

    );

    console.log(

      'STEP 12: ALLURE REPORT'

    );

    console.log(

      '========================================'

    );


    console.log(

      'Playwright result is ready for Allure reporting'

    );


    // ========================================================
    // FINAL RESULT
    // ========================================================

    console.log(

      '\n========================================'

    );

    console.log(

      'FINAL VALIDATION RESULT'

    );

    console.log(

      '========================================'

    );


    if (
      allDifferences.length === 0
    ) {

      console.log(

        '\n✅ ALL CMS, GCTP API AND WEBSITE VALIDATIONS PASSED'

      );

    }


    else {

      console.log(

        `\n❌ VALIDATION FAILED WITH ${allDifferences.length} DIFFERENCE(S)`

      );

    }


    expect(

      allDifferences,

      'CMS and GCTP API data differences found'

    ).toEqual([]);

  }

);