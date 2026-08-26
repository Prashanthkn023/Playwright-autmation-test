import { test, expect } from '@playwright/test';

const cmsurl = 'https://cms.gctp.in/chennai-home';
const baseurl = 'https://gctp.in/chennai-home';

test('verify CMS About Us content with published website', async ({ page }) => {

  // =====================================================
  // CMS CONTENT → EXPECTED
  // =====================================================

  await page.goto(cmsurl);

  // Login
  await page.getByRole('textbox', { name: 'example@gmail.com' }).fill('Blessey@lnttest.com');
  await page.getByRole('textbox', { name: '*******' }).fill('Blessey@123');
  await page.getByRole('button', { name: 'Login' }).click();

  // About Us
  await page.getByRole('link', { name: 'About Us' }).click();

  // GCTP
  await page
    .getByRole('link', { name: 'Greater Chennai Traffic Police' })
    .click();

  const expectedGctpHeading =
    await page
      .getByText('Greater Chennai Traffic Police', { exact: true })
      .first()
      .textContent();
  const expectedGctpDescription =
    await page
      .getByText('In 1659, when Chennai (then')
      .textContent();

  // Updates
  await expect(page.getByRole('heading', { name: 'UPDATES' })).toBeVisible();

  const expectedUpdate1Title =
    await page
      .getByText('Traffic Police: A Century of')
      .textContent();

  await page.getByText('Read More').first().click();

  const expectedUpdate1Description =
    await page
      .locator('.home-hero-traffic-card-des > div')
      .first()
      .textContent();

  const expectedUpdate2Title =
    await page
      .getByText('First traffic police station')
      .textContent();

  await page.getByText('Read More').first().click();

  const expectedUpdate2Description =
    await page
      .getByText('The 1929 "Functional Division')
      .textContent();

  const expectedUpdate3Title =
    await page
      .getByText('Establishment of the Chennai')
      .textContent();

  await page.getByText('Read More').first().click();

  const expectedUpdate3Description =
    await page
      .getByText('This photograph dates to 1929')
      .textContent();

  // Message from Police Commissioner
  await page
    .getByRole('link', { name: 'Message from Police' })
    .click();

  const expectedCommissionerHeading =
    await page
      .getByText('Message From Commissioner Of')
      .textContent();

  const expectedCommissionerMessage =
    await page
      .getByText('Dear Citizens of Chennai Road')
      .textContent();

  const expectedCommissionerName =
    await page
      .getByText('Thiru Dr. A. Amalraj, IPS,')
      .textContent();

  // Message from Additional COP
  await page
    .getByRole('link', { name: 'Message from Additional COP' })
    .click();

  const expectedAdditionalHeading =
    await page
      .getByText(
        'Message From Additional Commissioner Of Police-Traffic'
      )
      .textContent();

  const expectedAdditionalMessage =
    await page
      .getByText('Dear Citizens of Chennai,')
      .textContent();

  const expectedAdditionalName =
    await page
      .getByText('Dr.B. Shamoondeswari , IPS')
      .textContent();

  // Organogram
  await page
    .getByRole('link', { name: 'Organogram' })
    .click();

  const expectedOrganogram =
    await page
      .getByText(
        'Commissioner of PoliceAdditional Commissioner of Police, TrafficJoint'
      )
      .textContent();


  // =====================================================
  // PUBLISHED WEBSITE → ACTUAL
  // =====================================================

  await page.goto(baseurl);

  // About Us
  await page.getByRole('button', { name: 'About Us' }).click();

  // GCTP
  await page
    .getByRole('navigation')
    .getByText('GCTP')
    .click();

  const actualGctpHeading =
    await page
      .getByText('Greater Chennai Traffic Police')
      .nth(1)
      .textContent();

  const actualGctpDescription =
    await page
      .getByText('In 1659, when Chennai (then')
      .textContent();

  // Updates
  await page
    .getByRole('heading', { name: 'Updates' })
    .click();

  const actualUpdate1Title =
    await page
      .getByText('Traffic Police: A Century of')
      .textContent();

  await page.getByText('Read More').first().click();

  const actualUpdate1Description =
    await page
      .locator('.home-hero-traffic-card-des > div')
      .first()
      .textContent();

  const actualUpdate2Title =
    await page
      .getByText('First traffic police station')
      .textContent();

  await page.getByText('Read More').first().click();

  const actualUpdate2Description =
    await page
      .getByText('The 1929 "Functional Division')
      .textContent();

  const actualUpdate3Title =
    await page
      .getByText('Establishment of the Chennai')
      .textContent();

  await page.getByText('Read More').first().click();

  const actualUpdate3Description =
    await page
      .getByText('This photograph dates to 1929')
      .textContent();

  // Message from Police Commissioner
  await page
    .getByRole('button', { name: 'About Us' })
    .hover();

  await page
    .getByRole('navigation')
    .getByText('Message from Police Commissioner')
    .click();

  const actualCommissionerHeading =
    await page
      .getByText('Message From Commissioner Of')
      .textContent();

  const actualCommissionerMessage =
    await page
      .getByText('Dear Citizens of Chennai Road')
      .textContent();

  const actualCommissionerName =
    await page
      .getByText('Thiru Dr. A. Amalraj, IPS,')
      .textContent();

  // Message from Additional COP
  await page
    .getByRole('button', { name: 'About Us' })
    .hover();

  await page
    .getByRole('navigation')
    .getByText('Message from Additional COP')
    .click();

  const actualAdditionalHeading =
    await page
      .getByText(
        'Message From Additional Commissioner Of Police-Traffic'
      )
      .textContent();

  const actualAdditionalMessage =
    await page
      .getByText('Dear Citizens of Chennai,')
      .textContent();

  const actualAdditionalName =
    await page
      .getByText('Dr.B. Shamoondeswari , IPS')
      .textContent();

  // Organogram
  await page
    .getByRole('button', { name: 'About Us' })
    .hover();

  await page
    .getByRole('navigation')
    .getByText('Organogram')
    .click();

  const actualOrganogram =
    await page
      .getByText(
        'Commissioner of PoliceAdditional Commissioner of Police, TrafficJoint'
      )
      .textContent();


  // =====================================================
  // COMPARE EXPECTED WITH ACTUAL
  // =====================================================

  // GCTP
  expect(actualGctpHeading?.trim())
    .toBe(expectedGctpHeading?.trim());

  expect(actualGctpDescription?.trim())
    .toBe(expectedGctpDescription?.trim());

  // Update 1
  expect(actualUpdate1Title?.trim())
    .toBe(expectedUpdate1Title?.trim());

  expect(actualUpdate1Description?.trim())
    .toBe(expectedUpdate1Description?.trim());

  // Update 2
  expect(actualUpdate2Title?.trim())
    .toBe(expectedUpdate2Title?.trim());

  expect(actualUpdate2Description?.trim())
    .toBe(expectedUpdate2Description?.trim());

  // Update 3
  expect(actualUpdate3Title?.trim())
    .toBe(expectedUpdate3Title?.trim());

  expect(actualUpdate3Description?.trim())
    .toBe(expectedUpdate3Description?.trim());

  // Police Commissioner
  expect(actualCommissionerHeading?.trim())
    .toBe(expectedCommissionerHeading?.trim());

  expect(actualCommissionerMessage?.trim())
    .toBe(expectedCommissionerMessage?.trim());

  expect(actualCommissionerName?.trim())
    .toBe(expectedCommissionerName?.trim());

  // Additional COP
  expect(actualAdditionalHeading?.trim())
    .toBe(expectedAdditionalHeading?.trim());

  expect(actualAdditionalMessage?.trim())
    .toBe(expectedAdditionalMessage?.trim());

  expect(actualAdditionalName?.trim())
    .toBe(expectedAdditionalName?.trim());

  // Organogram
  expect(actualOrganogram?.trim())
    .toBe(expectedOrganogram?.trim());


  // =====================================================
  // FINAL RESULT
  // =====================================================

  console.log('======================================');
  console.log('CMS VS PUBLISHED WEBSITE');
  console.log('======================================');
  console.log('GCTP: PASS');
  console.log('Update 1: PASS');
  console.log('Update 2: PASS');
  console.log('Update 3: PASS');
  console.log('Police Commissioner: PASS');
  console.log('Additional COP: PASS');
  console.log('Organogram: PASS');
  console.log('======================================');
  console.log('ALL CONTENT MATCHED');
  console.log('TEST CASE PASSED');
  console.log('======================================');

});
