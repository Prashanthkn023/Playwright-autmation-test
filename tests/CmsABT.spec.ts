import { test, expect } from '@playwright/test';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const cmsurl = process.env.CMS_BASE_URL || 'https://cms.gctp.in/';
const baseurl = 'https://gctp.in/chennai-home';
const cmsUsername = process.env.CMS_USERNAME;
const cmsPassword = process.env.CMS_PASSWORD;

const getVisibleImageLoadFailures = async (page: import('@playwright/test').Page) => {
  return page.locator('img:visible').evaluateAll((images) =>
    Promise.all(images.map((image) => new Promise<void>((resolve) => {
      const imageElement = image as HTMLImageElement;

      if (imageElement.complete) {
        resolve();
        return;
      }

      const finish = () => {
        imageElement.removeEventListener('load', finish);
        imageElement.removeEventListener('error', finish);
        resolve();
      };

      imageElement.addEventListener('load', finish, { once: true });
      imageElement.addEventListener('error', finish, { once: true });
      setTimeout(finish, 10000);
    }))).then(() => images
      .filter((image) => {
        const imageElement = image as HTMLImageElement;
        const excludedAlt = [
          'Nature',
          'Play Store',
          'Facebook',
          'Instagram',
          'Twitter',
          'Youtube',
          'Group Icon',
          'Tamilnadu Police Citizen Portal',
          'Parivahan',
          'TN Govt Web',
          'TNRTO',
        ];

        return !excludedAlt.includes(imageElement.alt);
      })
      .filter((image) => {
        const imageElement = image as HTMLImageElement;
        return !imageElement.complete || imageElement.naturalWidth === 0;
      })
      .map((image) => {
        const imageElement = image as HTMLImageElement;
        return `${imageElement.alt || 'no alt'} (${imageElement.currentSrc || imageElement.src || 'no src'})`;
      })
    )
  );
};

type AboutUsContent = {
  label: string;
  value: string;
};

const normalizeContent = (value: string | null) =>
  value?.trim() || '';

const getContentDifferences = (
  expected: AboutUsContent[],
  actual: AboutUsContent[]
) => {
  const differences: string[] = [];

  for (let index = 0; index < Math.max(expected.length, actual.length); index++) {
    const expectedItem = expected[index];
    const actualItem = actual[index];

    if (!expectedItem || !actualItem) {
      differences.push(
        `Row ${index + 1} order/content: CMS=${JSON.stringify(expectedItem ?? null)}; GCTP=${JSON.stringify(actualItem ?? null)}`
      );
      continue;
    }

    if (expectedItem.label !== actualItem.label) {
      differences.push(
        `Row ${index + 1} order: CMS="${expectedItem.label}"; GCTP="${actualItem.label}"`
      );
    }

    if (expectedItem.value !== actualItem.value) {
      differences.push(
        `${expectedItem.label}: CMS="${expectedItem.value}"; GCTP="${actualItem.value}"`
      );
    }
  }

  return differences.length > 0
    ? differences.join('\n')
    : 'No content differences found.';
};

test('verify CMS About Us content with published website', async ({ page }) => {

  // =====================================================
  // CMS CONTENT → EXPECTED
  // =====================================================

  if (!cmsUsername || !cmsPassword) {
    throw new Error(
      'CMS_USERNAME and CMS_PASSWORD must be configured in .env before this test can run.'
    );
  }

  // Login
  const username = page.locator(
    'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]'
  );
  const password = page.locator('input[type="password"]');

  let loginFormLoaded = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(cmsurl, { waitUntil: 'domcontentloaded' });

    loginFormLoaded = await expect(username)
      .toBeVisible({ timeout: 30000 })
      .then(() => true)
      .catch(() => false);

    if (loginFormLoaded) {
      break;
    }
  }

  expect(
    loginFormLoaded,
    'CMS login form should load after retrying the CMS portal'
  ).toBe(true);

  await username.fill(cmsUsername);
  await expect(password).toBeVisible();
  await password.fill(cmsPassword);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(
    page.getByRole('navigation').getByText('About Us', { exact: true })
  ).toBeVisible({ timeout: 30000 });

  // About Us
  await page.goto(
    `${cmsurl.replace(/\/$/, '')}/chennai-gctp`,
    { waitUntil: 'domcontentloaded' }
  );

  const expectedImageLoadFailures: string[] = [];
  expectedImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

  const expectedGctpHeading =
    await page
      .getByText('Greater Chennai Traffic Police', { exact: true })
      .last()
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

  await page.getByRole('navigation').getByText('About Us', { exact: true }).click();

  // Message from Police Commissioner
  await page
    .getByRole('link', { name: 'Message from Police' })
    .click();

  expectedImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

  const expectedCommissionerHeading =
    await page
      .getByText('Message From Commissioner Of')
      .textContent();

  const expectedCommissionerMessage =
    await page
      .getByText('Dear Citizens of Chennai Road')
      .textContent();

  // Message from Additional COP
  await page
    .getByRole('link', { name: 'Message from Additional COP' })
    .click();

  expectedImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

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

  // Organogram
  await page
    .getByRole('link', { name: 'Organogram' })
    .click();

  expectedImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

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
  await closeAwarenessPopup(page);

  const actualImageLoadFailures: string[] = [];

  // About Us
  await page.getByRole('button', { name: 'About Us' }).click();

  // GCTP
  await page
    .getByRole('navigation')
    .getByText('GCTP')
    .click();
  await page.mouse.move(0, 0);
  actualImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

  // GCTP heading only
  // This avoids the footer/host content
  const actualGctpHeading =
    await page
      .getByText('Greater Chennai Traffic Police', { exact: true })
      .last()
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

  actualImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

  const actualCommissionerHeading =
    await page
      .getByText('Message From Commissioner Of')
      .textContent();

  const actualCommissionerMessage =
    await page
      .getByText('Dear Citizens of Chennai Road')
      .textContent();

  // Message from Additional COP
  await page
    .getByRole('button', { name: 'About Us' })
    .hover();

  await page
    .getByRole('navigation')
    .getByText('Message from Additional COP')
    .click();

  actualImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

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

  // Organogram
  await page
    .getByRole('button', { name: 'About Us' })
    .hover();

  await page
    .getByRole('navigation')
    .getByText('Organogram')
    .click();

  actualImageLoadFailures.push(...await getVisibleImageLoadFailures(page));

  const actualOrganogram =
    await page
      .getByText(
        'Commissioner of PoliceAdditional Commissioner of Police, TrafficJoint'
      )
      .textContent();


  const expectedContent: AboutUsContent[] = [
    { label: 'GCTP heading', value: normalizeContent(expectedGctpHeading) },
    { label: 'GCTP description', value: normalizeContent(expectedGctpDescription) },
    { label: 'Update 1 title', value: normalizeContent(expectedUpdate1Title) },
    { label: 'Update 1 description', value: normalizeContent(expectedUpdate1Description) },
    { label: 'Update 2 title', value: normalizeContent(expectedUpdate2Title) },
    { label: 'Update 2 description', value: normalizeContent(expectedUpdate2Description) },
    { label: 'Update 3 title', value: normalizeContent(expectedUpdate3Title) },
    { label: 'Update 3 description', value: normalizeContent(expectedUpdate3Description) },
    { label: 'Police Commissioner heading', value: normalizeContent(expectedCommissionerHeading) },
    { label: 'Police Commissioner message', value: normalizeContent(expectedCommissionerMessage) },
    { label: 'Additional COP heading', value: normalizeContent(expectedAdditionalHeading) },
    { label: 'Additional COP message', value: normalizeContent(expectedAdditionalMessage) },
    { label: 'Organogram', value: normalizeContent(expectedOrganogram) },
  ];

  const actualContent: AboutUsContent[] = [
    { label: 'GCTP heading', value: normalizeContent(actualGctpHeading) },
    { label: 'GCTP description', value: normalizeContent(actualGctpDescription) },
    { label: 'Update 1 title', value: normalizeContent(actualUpdate1Title) },
    { label: 'Update 1 description', value: normalizeContent(actualUpdate1Description) },
    { label: 'Update 2 title', value: normalizeContent(actualUpdate2Title) },
    { label: 'Update 2 description', value: normalizeContent(actualUpdate2Description) },
    { label: 'Update 3 title', value: normalizeContent(actualUpdate3Title) },
    { label: 'Update 3 description', value: normalizeContent(actualUpdate3Description) },
    { label: 'Police Commissioner heading', value: normalizeContent(actualCommissionerHeading) },
    { label: 'Police Commissioner message', value: normalizeContent(actualCommissionerMessage) },
    { label: 'Additional COP heading', value: normalizeContent(actualAdditionalHeading) },
    { label: 'Additional COP message', value: normalizeContent(actualAdditionalMessage) },
    { label: 'Organogram', value: normalizeContent(actualOrganogram) },
  ];

  const comparisonDifferences = getContentDifferences(
    expectedContent,
    actualContent
  );

  const imageLoadDifferences = [
    ...expectedImageLoadFailures.map((image) => `CMS image did not load: ${image}`),
    ...actualImageLoadFailures.map((image) => `GCTP image did not load: ${image}`),
  ];

  const allDifferences = [
    comparisonDifferences === 'No content differences found.' ? '' : comparisonDifferences,
    ...imageLoadDifferences,
  ].filter(Boolean).join('\n') || 'No content or image differences found.';

  console.log('CMS expected About Us content:', JSON.stringify(expectedContent, null, 2));
  console.log('GCTP actual About Us content:', JSON.stringify(actualContent, null, 2));
  console.log('About Us comparison differences:', allDifferences);

  await test.info().attach('comparison-differences', {
    body: allDifferences,
    contentType: 'text/plain',
  });

  expect(actualContent).toEqual(expectedContent);
  expect(expectedImageLoadFailures, 'CMS images should load successfully').toHaveLength(0);
  expect(actualImageLoadFailures, 'GCTP images should load successfully').toHaveLength(0);


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
