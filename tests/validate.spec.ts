import { expect, test } from '@playwright/test';

// =================================================
// API URLS
// =================================================

const cmsHomePageApi: string =
  'https://cms.gctp.in/api/fusion-cms-web-backend/home-page?approvalStatus=all';

const gctpHomePageApi: string =
  'https://gctp.in/api/fusion-public-facing-web-backend/home-page';

// =================================================
// API RESPONSE INTERFACE
// =================================================

interface ApiResponse {
  payload?: unknown[];
}

// =================================================
// TEST CONFIGURATION
// =================================================

test.setTimeout(120000);

// =================================================
// MAIN TEST
// =================================================

test(
  'CMS Home Page API vs GCTP Home Page API Comparison',
  async ({ request, page }) => {

    // =================================================
    // STEP 1: GET CMS API
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('STEP 1: GET CMS HOME PAGE API');
    console.log('========================================');

    console.log(`CMS API URL: ${cmsHomePageApi}`);

    const cmsResponse = await request.get(
      cmsHomePageApi,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const cmsContentType =
      cmsResponse.headers()['content-type'] ?? '';

    console.log(
      `CMS Status: ${cmsResponse.status()}`
    );

    console.log(
      `CMS Status Text: ${cmsResponse.statusText()}`
    );

    console.log(
      `CMS Content-Type: ${cmsContentType}`
    );

    // =================================================
    // VALIDATE CMS STATUS
    // =================================================

    expect(
      cmsResponse.status(),
      'CMS API should return status 200'
    ).toBe(200);

    // =================================================
    // VALIDATE CMS CONTENT TYPE
    // =================================================

    expect(
      cmsContentType,
      'CMS API should return JSON'
    ).toContain(
      'application/json'
    );

    // =================================================
    // GET CMS RESPONSE
    // =================================================

    const cmsData: ApiResponse =
      await cmsResponse.json();

    console.log('');
    console.log(
      'CMS RESPONSE RECEIVED SUCCESSFULLY'
    );

    // =================================================
    // EXTRACT CMS PAYLOAD
    // =================================================

    const cmsPayload: unknown[] =
      Array.isArray(cmsData.payload)
        ? cmsData.payload
        : [];

    console.log(
      `CMS Total Payload Count: ${cmsPayload.length}`
    );

    // =================================================
    // FILTER APPROVED CMS DATA
    // =================================================

    const approvedCmsPayload =
      cmsPayload.filter(
        (item: unknown) => {

          if (
            typeof item !== 'object' ||
            item === null
          ) {
            return false;
          }

          const record =
            item as Record<string, unknown>;

          return (
            record['f_approval_status'] ===
              'APPROVED' ||
            record['approval_status'] ===
              'APPROVED'
          );
        }
      );

    // =================================================
    // PRINT CMS APPROVED INFORMATION
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('CMS APPROVED DATA');
    console.log('========================================');

    console.log(
      `CMS Total Records: ${cmsPayload.length}`
    );

    console.log(
      `CMS Approved Records: ${approvedCmsPayload.length}`
    );

    // =================================================
    // VALIDATE APPROVED CMS DATA
    // =================================================

    expect(
      approvedCmsPayload.length,
      'CMS has no APPROVED records'
    ).toBeGreaterThan(
      0
    );

    // =================================================
    // PRINT CMS APPROVED PAYLOAD
    // =================================================

    console.log('');
    console.log(
      'CMS APPROVED PAYLOAD:'
    );

    console.log(
      JSON.stringify(
        approvedCmsPayload,
        null,
        2
      )
    );

    // =================================================
    // STEP 2: OPEN GCTP WEBSITE
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('STEP 2: OPEN GCTP WEBSITE');
    console.log('========================================');

    await page.goto(
      'https://gctp.in',
      {
        waitUntil: 'networkidle',
        timeout: 60000,
      }
    );

    console.log(
      `Website opened: ${page.url()}`
    );

    // =================================================
    // STEP 3: CALL GCTP API FROM BROWSER
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('STEP 3: GET GCTP API FROM BROWSER');
    console.log('========================================');

    console.log(
      `GCTP API URL: ${gctpHomePageApi}`
    );

    const gctpResponse = await request.get(
      gctpHomePageApi,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const gctpResult = {
      status: gctpResponse.status(),
      statusText: gctpResponse.statusText(),
      contentType:
        gctpResponse.headers()['content-type'] ?? '',
      responseText: await gctpResponse.text(),
    };

    // =================================================
    // PRINT GCTP RESPONSE INFORMATION
    // =================================================

    console.log(
      `GCTP Status: ${gctpResult.status}`
    );

    console.log(
      `GCTP Status Text: ${gctpResult.statusText}`
    );

    console.log(
      `GCTP Content-Type: ${gctpResult.contentType}`
    );

    // =================================================
    // VALIDATE GCTP STATUS
    // =================================================

    expect(
      gctpResult.status,
      'GCTP API should return status 200'
    ).toBe(
      200
    );

    // =================================================
    // VALIDATE GCTP CONTENT TYPE
    // =================================================

    if (
      !gctpResult.contentType.includes(
        'application/json'
      )
    ) {

      console.log('');
      console.log('========================================');
      console.log('GCTP RESPONSE IS NOT JSON');
      console.log('========================================');

      console.log(
        gctpResult.responseText.substring(
          0,
          3000
        )
      );

      throw new Error(
        `GCTP API returned ${gctpResult.contentType} instead of application/json`
      );
    }

    // =================================================
    // PARSE GCTP JSON
    // =================================================

    let gctpData: ApiResponse;

    try {

      gctpData =
        JSON.parse(
          gctpResult.responseText
        ) as ApiResponse;

    } catch (error) {

      console.log('');
      console.log('========================================');
      console.log('GCTP JSON PARSE ERROR');
      console.log('========================================');

      console.log(
        gctpResult.responseText.substring(
          0,
          3000
        )
      );

      throw new Error(
        `GCTP response could not be parsed as JSON: ${String(error)}`
      );
    }

    // =================================================
    // EXTRACT GCTP PAYLOAD
    // =================================================

    const gctpPayload: unknown[] =
      Array.isArray(gctpData.payload)
        ? gctpData.payload
        : [];

    // =================================================
    // PRINT GCTP PAYLOAD INFORMATION
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('GCTP DATA');
    console.log('========================================');

    console.log(
      `GCTP Total Records: ${gctpPayload.length}`
    );

    // =================================================
    // VALIDATE GCTP PAYLOAD
    // =================================================

    expect(
      gctpPayload.length,
      'GCTP payload is empty'
    ).toBeGreaterThan(
      0
    );

    // =================================================
    // PRINT GCTP PAYLOAD
    // =================================================

    console.log('');
    console.log(
      'GCTP PAYLOAD:'
    );

    console.log(
      JSON.stringify(
        gctpPayload,
        null,
        2
      )
    );

    // =================================================
    // NORMALIZE DATA
    //
    // Remove CMS-only fields before comparison
    // =================================================

    const normalizeData = (
      data: unknown
    ): unknown => {

      // =============================================
      // ARRAY
      // =============================================

      if (
        Array.isArray(
          data
        )
      ) {

        return data.map(
          normalizeData
        );
      }

      // =============================================
      // OBJECT
      // =============================================

      if (
        typeof data === 'object' &&
        data !== null
      ) {

        const normalized:
          Record<string, unknown> = {};

        // ===========================================
        // CMS-ONLY FIELDS
        // ===========================================

        const ignoredFields: string[] = [

          'f_approval_status',

          'approval_status',

          'created_at',

          'updated_at',

          'createdBy',

          'updatedBy',

        ];

        // ===========================================
        // LOOP THROUGH OBJECT
        // ===========================================

        for (
          const [key, value] of
          Object.entries(
            data
          )
        ) {

          if (
            ignoredFields.includes(
              key
            )
          ) {
            continue;
          }

          normalized[key] =
            normalizeData(
              value
            );
        }

        return normalized;
      }

      // =============================================
      // PRIMITIVE VALUE
      // =============================================

      return data;
    };

    // =================================================
    // NORMALIZE CMS DATA
    // =================================================

    const normalizedCmsPayload =
      approvedCmsPayload.map(
        normalizeData
      );

    // =================================================
    // NORMALIZE GCTP DATA
    // =================================================

    const normalizedGctpPayload =
      gctpPayload.map(
        normalizeData
      );

    // =================================================
    // STEP 4: COMPARE CMS VS GCTP
    // =================================================

    console.log('');
    console.log('========================================');
    console.log('STEP 4: COMPARING CMS VS GCTP');
    console.log('========================================');

    console.log(
      `CMS Approved Records Being Compared: ${normalizedCmsPayload.length}`
    );

    console.log(
      `GCTP Records Being Compared: ${normalizedGctpPayload.length}`
    );

    // =================================================
    // COMPARE
    //
    // Every approved CMS record should exist
    // inside GCTP payload.
    // =================================================

    try {

      expect(
        normalizedGctpPayload,
        'Published CMS content should match GCTP content'
      ).toEqual(
        expect.arrayContaining(
          normalizedCmsPayload
        )
      );

      console.log('');
      console.log('========================================');

      console.log(
        'PASS | CMS APPROVED DATA MATCHES GCTP DATA'
      );

      console.log('========================================');

    } catch (error) {

      console.log('');
      console.log('========================================');

      console.log(
        'FAIL | CMS AND GCTP DATA DO NOT MATCH'
      );

      console.log('========================================');

      console.error(
        error
      );

      throw error;
    }

    // =================================================
    // FINAL SUCCESS MESSAGE
    // =================================================

    console.log('');
    console.log('========================================');

    console.log(
      'HOME PAGE API COMPARISON COMPLETED SUCCESSFULLY'
    );

    console.log('========================================');

  }
);