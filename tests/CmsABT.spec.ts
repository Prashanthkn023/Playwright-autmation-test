import { test, expect } from '@playwright/test';

// Define the application URL
const baseurl = 'https://gctp.in/chennai-home';

// Test case to validate the About Us section
test('validate the cms home page About Us', async ({ page }) => {
  try {
    // Open the website
    await page.goto(baseurl);

    // Click the About Us button
    await page.getByRole('button', { name: 'About Us' }).click();

    // Verify that the GCTP navigation menu is visible
    await expect(page.getByRole('navigation').getByText('GCTP')).toBeVisible();

    // Click the GCTP navigation menu
    await page.getByRole('navigation').getByText('GCTP').click();

    // Verify the page title
    await expect(page.getByText('Greater Chennai Traffic Police').nth(1)).toBeVisible();

    // Verify the page description
    await expect(page.getByText('In 1659, when Chennai (then')).toBeVisible();

    // Print the result after the GCTP section is validated
    console.log('GCTP section passed.');

    // Open the Updates section
    await page.getByRole('heading', { name: 'Updates' }).click();

    // Verify the first image
    await expect(page.locator('.home-hero-card-imgGTGC > img').first()).toBeVisible();

    // Verify the first update title
    await expect(page.getByText('Traffic Police: A Century of')).toBeVisible();

    // Click the first Read More link
    await page.getByText('Read More').first().click();

    // Verify the first update description
    await expect(page.locator('.home-hero-traffic-card-des > div').first()).toBeVisible();

    // Verify the second image
    await expect(page.locator('div:nth-child(2) > .home-hero-card-imgGTGC > img')).toBeVisible();

    // Verify the second update title
    await expect(page.getByText('First traffic police station')).toBeVisible();

    // Click the second Read More link
    await page.getByText('Read More').first().click();

    // Verify the second update description
    await expect(page.getByText('The 1929 "Functional Division')).toBeVisible();

    // Verify the third image
    await expect(page.locator('div:nth-child(3) > .home-hero-card-imgGTGC > img')).toBeVisible();

    // Verify the third update title
    await expect(page.getByText('Establishment of the Chennai')).toBeVisible();

    // Click the third Read More link
    await page.getByText('Read More').click();

    // Verify the third update description
    await expect(page.getByText('This photograph dates to 1929')).toBeVisible();

    // Verify the GCTP image
    await expect(page.locator('.GCTPImg')).toBeVisible();

    // Print the result after the Updates section is validated
    console.log('Updates section passed.');

    // Open the Message from Police Commissioner section
    await page.getByRole('navigation').getByText('Message from Police Commissioner').click();

    // Verify the heading
    await expect(page.getByText('Message From Commissioner Of')).toBeVisible();

    // Verify the message content
    await expect(page.getByText('Dear Citizens of Chennai Road')).toBeVisible();

    // Verify the Commissioner's name
    await expect(page.getByText('Thiru Dr. A. Amalraj, IPS,')).toBeVisible();

    // Print the result after the Message from Police section is validated
    console.log('Message from Police section passed.');

    // Open the Message from Additional COP section
    await page.getByRole('navigation').getByText('Message from Additional COP').click();

    // Verify the heading
    await expect(page.getByText('Message From Additional Commissioner Of Police-Traffic')).toBeVisible();

    // Verify the message content
    await expect(page.getByText('Dear Citizens of Chennai,')).toBeVisible();

    // Verify the Additional Commissioner's name
    await expect(page.getByText('Dr.B. Shamoondeswari , IPS')).toBeVisible();

    // Print the result after the Additional COP section is validated
    console.log('Additional COP section passed.');

    // Open the Organogram section
    await page.getByRole('navigation').getByText('Organogram').click();

    // Verify the organizational hierarchy
    await expect(
      page.getByText(
        'Commissioner of PoliceAdditional Commissioner of Police, TrafficJoint'
      )
    ).toBeVisible();

    // Print the result after the Organogram section is validated
    console.log('Organogram section passed.');

    // Print the final result
    console.log('All test cases passed.');
  } catch (error) {
    // Print the failure message
    console.log('Test case failed.');

    // Print the error details
    console.error(error);

    // Fail the test
    throw error;
  }
});