import { test, expect } from '@playwright/test';
import { CmsCityPage } from '../pages/CmsCityPage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const cmsurl =
  process.env.CMS_BASE_URL ||
  'https://cms.gctp.in/';

const baseurl =
  'https://gctp.in/chennai-home';

const cmsUsername =
  process.env.CMS_USERNAME;

const cmsPassword =
  process.env.CMS_PASSWORD;


test(
  'verify CMS City Profile content with published website',
  async ({ page }) => {

    const cityPage =
      new CmsCityPage(page);


    // =====================================================
    // CMS CONTENT → EXPECTED
    // =====================================================

    if (!cmsUsername || !cmsPassword) {

      throw new Error(
        'CMS_USERNAME and CMS_PASSWORD must be configured in .env before this test can run.'
      );
    }


    // =====================================================
    // CMS LOGIN
    // =====================================================

    await cityPage.loginToCms(
      cmsurl,
      cmsUsername,
      cmsPassword
    );


    // =====================================================
    // OPEN CITY PROFILE
    // =====================================================

    await cityPage.openCmsCityProfile();


    // =====================================================
    // CITY PROFILE
    // =====================================================

    const expectedCityProfileHeading =
      await cityPage.getCityProfileHeading();

    const expectedCityDescription =
      await cityPage.getCityDescription();


    // =====================================================
    // TOP ATTRACTIONS
    // =====================================================

    const expectedTopAttractionsHeading =
      await cityPage.getTopAttractionsHeading();


    // =====================================================
    // READ MORE
    // =====================================================

    await cityPage.clickReadMore();


    // =====================================================
    // ATTRACTION 1
    // =====================================================

    const expectedAttraction1Title =
      await cityPage.getAttraction1Title();

    const expectedAttraction1Description =
      await cityPage.getAttraction1Description();


    // =====================================================
    // POLICE MEMORIAL
    // =====================================================

    const expectedAttraction2Title =
      await cityPage.getAttraction2Title();

    const expectedAttraction2Description =
      await cityPage.getAttraction2Description();


    // =====================================================
    // ATTRACTION 3
    // =====================================================

    const expectedAttraction3Title =
      await cityPage.getAttraction3Title();

    const expectedAttraction3Description =
      await cityPage.getAttraction3Description();


    // =====================================================
    // PUBLISHED WEBSITE → ACTUAL
    // =====================================================

    await page.goto(baseurl, {
      waitUntil: 'domcontentloaded'
    });

    await closeAwarenessPopup(page);


    // =====================================================
    // OPEN CITY PROFILE
    // =====================================================

    await cityPage.openPublishedCityProfile();


    // =====================================================
    // CITY PROFILE
    // =====================================================

    const actualCityProfileHeading =
      await cityPage.getCityProfileHeading();

    const actualCityDescription =
      await cityPage.getCityDescription();


    // =====================================================
    // TOP ATTRACTIONS
    // =====================================================

    const actualTopAttractionsHeading =
      await cityPage.getTopAttractionsHeading();


    // =====================================================
    // READ MORE
    // =====================================================

    await cityPage.clickReadMore();


    // =====================================================
    // ATTRACTION 1
    // =====================================================

    const actualAttraction1Title =
      await cityPage.getAttraction1Title();

    const actualAttraction1Description =
      await cityPage.getAttraction1Description();


    // =====================================================
    // POLICE MEMORIAL
    // =====================================================

    const actualAttraction2Title =
      await cityPage.getAttraction2Title();

    const actualAttraction2Description =
      await cityPage.getAttraction2Description();


    // =====================================================
    // ATTRACTION 3
    // =====================================================

    const actualAttraction3Title =
      await cityPage.getAttraction3Title();

    const actualAttraction3Description =
      await cityPage.getAttraction3Description();


    // =====================================================
    // COMPARE EXPECTED WITH ACTUAL
    // =====================================================

    // =====================================================
    // CITY PROFILE
    // =====================================================

    expect(
      actualCityProfileHeading?.trim()
    ).toBe(
      expectedCityProfileHeading?.trim()
    );

    expect(
      actualCityDescription?.trim()
    ).toBe(
      expectedCityDescription?.trim()
    );


    // =====================================================
    // TOP ATTRACTIONS
    // =====================================================

    expect(
      actualTopAttractionsHeading?.trim()
    ).toBe(
      expectedTopAttractionsHeading?.trim()
    );


    // =====================================================
    // ATTRACTION 1
    // =====================================================

    expect(
      actualAttraction1Title?.trim()
    ).toBe(
      expectedAttraction1Title?.trim()
    );

    expect(
      actualAttraction1Description?.trim()
    ).toBe(
      expectedAttraction1Description?.trim()
    );

    // =====================================================
    // POLICE MEMORIAL
    // =====================================================

    expect(
      actualAttraction2Title?.trim()
    ).toBe(
      expectedAttraction2Title?.trim()
    );

    expect(
      actualAttraction2Description?.trim()
    ).toBe(
      expectedAttraction2Description?.trim()
    );

    // =====================================================
    // ATTRACTION 3
    // =====================================================

    expect(
      actualAttraction3Title?.trim()
    ).toBe(
      expectedAttraction3Title?.trim()
    );

    expect(
      actualAttraction3Description?.trim()
    ).toBe(
      expectedAttraction3Description?.trim()
    );

    // =====================================================
    // FINAL RESULT
    // =====================================================

    console.log(
      '======================================'
    );

    console.log(
      'CMS VS PUBLISHED WEBSITE'
    );

    console.log(
      '======================================'
    );

    console.log(
      'City Profile Heading: PASS'
    );

    console.log(
      'City Description: PASS'
    );

    console.log(
      'Top Attractions Heading: PASS'
    );

    console.log(
      'Attraction 1 Title: PASS'
    );

    console.log(
      'Attraction 1 Description: PASS'
    );

    console.log(
      'Police Memorial Title: PASS'
    );

    console.log(
      'Police Memorial Description: PASS'
    );

    console.log(
      'Attraction 3 Title: PASS'
    );

    console.log(
      'Attraction 3 Description: PASS'
    );

    console.log(
      '======================================'
    );

    console.log(
      'ALL CITY PROFILE CONTENT MATCHED'
    );

    console.log(
      'TEST CASE PASSED'
    );

    console.log(
      '======================================'
    );
  }
);