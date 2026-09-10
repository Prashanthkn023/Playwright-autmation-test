import {
  expect,
  Locator,
  Page,
  Response,
  test,
} from '@playwright/test';


// =================================================
// TYPES
// =================================================

type ApiResult = {
  method: string;
  url: string;
  status: number;
};


type ModuleLink = {
  name: string;
  linkName: string;
  aboutUs?: boolean;
};


// =================================================
// CONFIGURATION
// =================================================

const homeUrl: string =
  'https://gctp.in/chennai-home';


const modules: ModuleLink[] = [

  {
    name: 'Home',
    linkName: 'Home',
  },

  {
    name: 'City Profile',
    linkName: 'City Profile',
  },

  {
    name: 'City Map',
    linkName: 'City Map',
  },

  {
    name: 'News Updates',
    linkName: 'News',
  },

  {
    name: 'Media',
    linkName: 'Media',
  },

  {
    name: 'Contact Us',
    linkName: 'Contact Us',
  },


  // ===============================================
  // ABOUT US MODULES
  // ===============================================

  {
    name: 'GCTP',
    linkName: 'GCTP',
    aboutUs: true,
  },

  {
    name:
      'Message from Police Commissioner',

    linkName:
      'Message from Police Commissioner',

    aboutUs: true,
  },

  {
    name:
      'Message from Additional COP',

    linkName:
      'Message from Additional COP',

    aboutUs: true,
  },

  {
    name: 'Organogram',
    linkName: 'Organogram',
    aboutUs: true,
  },


  // ===============================================
  // OTHER MODULES
  // ===============================================

  {
    name: 'Feedback',
    linkName: 'Feedback',
  },

  {
    name: 'Complaints',
    linkName: 'Complaints',
  },

  {
    name: 'Site Map',
    linkName: 'Site Map',
  },

];


// =================================================
// FIND FIRST VISIBLE LOCATOR
// =================================================

async function getFirstVisibleLocator(
  locator: Locator
): Promise<Locator | null> {

  const count: number =
    await locator.count();


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const element: Locator =
      locator.nth(i);


    const visible: boolean =
      await element
        .isVisible()
        .catch(() => false);


    if (visible) {

      return element;

    }

  }


  return null;

}


// =================================================
// CLOSE AWARENESS POPUP
// =================================================

async function closeAwarenessPopup(
  page: Page
): Promise<void> {

  await page.waitForTimeout(
    500
  );


  const awarenessText: Locator =
    page.getByText(
      'AWARENESS',
      {
        exact: true,
      }
    );


  const popupVisible: boolean =
    await awarenessText
      .isVisible()
      .catch(() => false);


  if (!popupVisible) {

    return;

  }


  const closeSelectors: string[] = [

    '[aria-label="Close"]',

    '[aria-label="close"]',

    '[title="Close"]',

    '[title="close"]',

    '.btn-close',

    '.close',

    'button.close',

    'button[class*="close"]',

    'button[class*="Close"]',

  ];


  for (
    const selector
    of closeSelectors
  ) {

    const buttons: Locator =
      page.locator(
        selector
      );


    const count: number =
      await buttons.count();


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const button: Locator =
        buttons.nth(i);


      const visible: boolean =
        await button
          .isVisible()
          .catch(() => false);


      if (!visible) {

        continue;

      }


      try {

        await button.click(
          {
            force: true,
            timeout: 3000,
          }
        );


        await page.waitForTimeout(
          300
        );


        const stillVisible: boolean =
          await awarenessText
            .isVisible()
            .catch(() => false);


        if (!stillVisible) {

          return;

        }

      } catch {

        // Silent

      }

    }

  }


  const closeButton: Locator =
    page.getByRole(
      'button',
      {
        name:
          /close|dismiss|cancel/i,
      }
    );


  const visibleCloseButton:
    Locator | null =

      await getFirstVisibleLocator(
        closeButton
      );


  if (
    visibleCloseButton !== null
  ) {

    try {

      await visibleCloseButton.click(
        {
          force: true,
        }
      );


      await page.waitForTimeout(
        300
      );


      return;

    } catch {

      // Silent

    }

  }


  await page.keyboard
    .press('Escape')
    .catch(() => {});


  await page.waitForTimeout(
    300
  );

}


// =================================================
// CHECK SUCCESS STATUS
// =================================================

function isSuccessfulStatus(
  status: number
): boolean {

  return (

    (
      status >= 200 &&
      status < 300
    )

    ||

    status === 304

  );

}


// =================================================
// CHECK API TYPE
// =================================================

function isTargetApi(
  response: Response
): boolean {

  const resourceType: string =
    response
      .request()
      .resourceType();


  return (

    resourceType === 'xhr'

    ||

    resourceType === 'fetch'

  );

}


// =================================================
// WAIT FOR API REQUESTS
// =================================================

async function waitForApis(
  page: Page
): Promise<void> {

  try {

    await page.waitForLoadState(
      'networkidle',
      {
        timeout: 10000,
      }
    );

  } catch {

    // Silent

  }


  await page.waitForTimeout(
    2000
  );

}


// =================================================
// NAVIGATE TO NORMAL MODULE
// =================================================

async function navigateToNormalModule(
  page: Page,

  module: ModuleLink

): Promise<void> {

  await closeAwarenessPopup(
    page
  );


  const linkLocator: Locator =
    page.getByRole(
      'link',
      {
        name:
          module.linkName,

        exact:
          true,
      }
    );


  const visibleLink:
    Locator | null =

      await getFirstVisibleLocator(
        linkLocator
      );


  if (
    visibleLink === null
  ) {

    throw new Error(
      'Navigation link not found: ' +
      module.name
    );

  }


  await visibleLink
    .scrollIntoViewIfNeeded();


  await visibleLink.click();


  await page.waitForTimeout(
    1000
  );


  await closeAwarenessPopup(
    page
  );

}


// =================================================
// NAVIGATE TO ABOUT US MODULE
// =================================================

async function navigateToAboutUsModule(
  page: Page,

  module: ModuleLink

): Promise<void> {

  await closeAwarenessPopup(
    page
  );


  const aboutUsLocator: Locator =
    page.getByText(
      'About Us',
      {
        exact: true,
      }
    );


  const visibleAboutUs:
    Locator | null =

      await getFirstVisibleLocator(
        aboutUsLocator
      );


  if (
    visibleAboutUs === null
  ) {

    throw new Error(
      'About Us dropdown not found'
    );

  }


  await visibleAboutUs.click(
    {
      force: true,
    }
  );


  await page.waitForTimeout(
    500
  );


  const sectionLocator: Locator =
    page.getByText(
      module.linkName,
      {
        exact: true,
      }
    );


  const visibleSection:
    Locator | null =

      await getFirstVisibleLocator(
        sectionLocator
      );


  if (
    visibleSection === null
  ) {

    throw new Error(
      'About Us section not found: ' +
      module.name
    );

  }


  await visibleSection
    .scrollIntoViewIfNeeded();


  await visibleSection.click();


  await page.waitForTimeout(
    1000
  );


  await closeAwarenessPopup(
    page
  );

}


// =================================================
// VALIDATE MODULE APIs
// =================================================

async function validateModuleApis(
  page: Page,

  moduleName: string,

  responses: ApiResult[]

): Promise<void> {

  await waitForApis(
    page
  );


  const uniqueResponses:
    ApiResult[] =

      Array.from(

        new Map<
          string,
          ApiResult
        >(

          responses.map(
            (
              response:
                ApiResult
            ) => [

              response.method +
              ' ' +
              response.url,

              response,

            ]
          )

        ).values()

      );


  const failedResponses:
    ApiResult[] =

      uniqueResponses.filter(
        (
          response:
            ApiResult
        ) =>

          !isSuccessfulStatus(
            response.status
          )
      );


  // ===============================================
  // ONLY API VALIDATION OUTPUT
  // ===============================================

  console.log('');

  console.log(
    '========================================'
  );

  console.log(
    'API VALIDATION: ' +
    moduleName
  );

  console.log(
    '========================================'
  );


  for (
    const response
    of uniqueResponses
  ) {

    const result: string =

      isSuccessfulStatus(
        response.status
      )

        ? 'PASS'

        : 'FAIL';


    console.log(

      result +

      ' | ' +

      moduleName +

      ' | ' +

      response.status +

      ' | ' +

      response.method +

      ' | ' +

      response.url

    );

  }


  console.log(
    '========================================'
  );


  expect(
    failedResponses,
    moduleName +
    ' has failed API responses'
  ).toHaveLength(
    0
  );

}


// =================================================
// MAIN TEST
// =================================================

test.setTimeout(240000);

test(

  'GCTP Complete End-to-End API Validation',

  async (
    {
      page,
    }
  ) => {


    // =============================================
    // STORE API RESPONSES
    // =============================================

    const responses:
      ApiResult[] = [];


    // =============================================
    // HANDLE BROWSER DIALOGS SILENTLY
    // =============================================

    page.on(

      'dialog',

      async (
        dialog
      ) => {

        await dialog.dismiss();

      }

    );


    // =============================================
    // CAPTURE API RESPONSES
    // NO CONSOLE LOG HERE
    // =============================================

    page.on(

      'response',

      (
        response:
          Response
      ) => {

        if (
          !isTargetApi(
            response
          )
        ) {

          return;

        }


        const apiResult:
          ApiResult = {

            method:
              response
                .request()
                .method(),

            url:
              response.url(),

            status:
              response.status(),

          };


        responses.push(
          apiResult
        );

      }

    );


    // =============================================
    // LOOP THROUGH ALL MODULES
    // =============================================

    for (
      const module
      of modules
    ) {


      // ===========================================
      // CLEAR PREVIOUS MODULE API RESPONSES
      // ===========================================

      responses.length =
        0;


      // ===========================================
      // HOME MODULE
      // ===========================================

      if (
        module.name ===
        'Home'
      ) {

        await page.goto(

          homeUrl,

          {
            waitUntil:
              'domcontentloaded',
          }

        );


        await page.waitForTimeout(
          1500
        );


        await closeAwarenessPopup(
          page
        );

      }


      // ===========================================
      // ABOUT US MODULE
      // ===========================================

      else if (
        module.aboutUs ===
        true
      ) {

        await navigateToAboutUsModule(

          page,

          module

        );

      }


      // ===========================================
      // NORMAL MODULE
      // ===========================================

      else {

        await navigateToNormalModule(

          page,

          module

        );

      }


      // ===========================================
      // VALIDATE MODULE APIs
      // ===========================================

      await validateModuleApis(

        page,

        module.name,

        responses

      );


      // ===========================================
      // ONLY COMPLETION OUTPUT
      // ===========================================

      console.log(

        module.name +
        ' completed successfully'

      );

    }

  }

);