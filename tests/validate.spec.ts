import {
  expect,
  test,
} from '@playwright/test';


// =================================================
// API URLS
// =================================================

const cmsHomePageApi: string =
  'https://cms.gctp.in/api/fusion-cms-web-backend/home-page?approvalStatus=all';


const gctpHomePageApi: string =
  'https://gctp.in/api/fusion-public-facing-web-backend/home-page';


// =================================================
// MAIN TEST
// =================================================

test.setTimeout(
  120000
);


test(
  'CMS Home Page API vs GCTP Home Page API Comparison',

  async ({
    request,
  }) => {


    // =============================================
    // GET CMS API RESPONSE
    // =============================================

    const cmsResponse =
      await request.get(
        cmsHomePageApi
      );


    // =============================================
    // VALIDATE CMS STATUS
    // =============================================

    expect(
      cmsResponse.status(),
      'CMS API should return 200'
    ).toBe(
      200
    );

    expect(
      cmsResponse.headers()['content-type'],
      'CMS API should return JSON'
    ).toContain(
      'application/json'
    );


    // =============================================
    // GET CMS RESPONSE JSON
    // =============================================

    const cmsData =
      await cmsResponse.json();


    // =============================================
    // GET GCTP API RESPONSE
    // =============================================

    const gctpResponse =
      await request.get(
        gctpHomePageApi
      );


    // =============================================
    // VALIDATE GCTP STATUS
    // =============================================

    expect(
      gctpResponse.status(),
      'GCTP API should return 200'
    ).toBe(
      200
    );

    expect(
      gctpResponse.headers()['content-type'],
      'GCTP API should return JSON'
    ).toContain(
      'application/json'
    );


    // =============================================
    // GET GCTP RESPONSE JSON
    // =============================================

    const gctpData =
      await gctpResponse.json();


    // =============================================
    // PRINT COMPARISON HEADER
    // =============================================

    console.log('');

    console.log(
      '========================================'
    );

    console.log(
      'HOME PAGE API COMPARISON'
    );

    console.log(
      '========================================'
    );


    // =============================================
    // PRINT API STATUS
    // =============================================

    console.log(
      'CMS API  | ' +
      cmsResponse.status() +
      ' | GET | ' +
      cmsHomePageApi
    );


    console.log(
      'GCTP API | ' +
      gctpResponse.status() +
      ' | GET | ' +
      gctpHomePageApi
    );


    // =============================================
    // COMPARE ONLY PUBLISHED CMS DATA WITH GCTP DATA
    // =============================================

    const cmsPayload = Array.isArray(cmsData?.payload)
      ? cmsData.payload.filter(
          (item: any) =>
            item?.f_approval_status === 'APPROVED' ||
            item?.approval_status === 'APPROVED' ||
            !item?.f_approval_status
        )
      : [];

    const gctpPayload = Array.isArray(gctpData?.payload)
      ? gctpData.payload
      : [];

    try {

      expect(
        cmsPayload.length,
        'CMS has no approved home-page payloads to compare'
      ).toBeGreaterThan(0);

      expect(
        gctpPayload.length,
        'GCTP home-page payload is empty'
      ).toBeGreaterThan(0);

      expect(
        gctpPayload,
        'Published CMS content and GCTP content do not match'
      ).toEqual(
        expect.arrayContaining(cmsPayload)
      );


      console.log(
        'PASS | Approved CMS content matches the published GCTP payload'
      );

    } catch {

      console.log(
        'FAIL | CMS and GCTP responses are different'
      );


      throw new Error(
        'Published CMS and GCTP Home Page API responses do not match'
      );

    }


    console.log(
      '========================================'
    );


    console.log(
      'Home Page API comparison completed successfully'
    );

  }

);