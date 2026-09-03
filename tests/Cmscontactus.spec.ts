import { expect, test } from '@playwright/test';
import { CmsContactUsPage } from '../pages/CmsContactUsPage';

test('verify the cms contact_us page', async ({ page }) => {
    const contactUsPage = new CmsContactUsPage(page);

    await contactUsPage.openHomePage();
    await contactUsPage.openContactUs();
    await expect(contactUsPage.contactDetailsHeading).toBeVisible();
    await expect(contactUsPage.serialNumberHeader).toBeVisible();
    await expect(contactUsPage.officerNameHeader).toBeVisible();
    await expect(contactUsPage.rankHeader).toBeVisible();
    await expect(contactUsPage.officePhoneNumbersHeader).toBeVisible();

    for (const cell of contactUsPage.officerCells) {
        await expect(cell).toBeVisible();
    }

});
