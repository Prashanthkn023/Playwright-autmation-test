import { expect, test } from '@playwright/test';
import { CmsContactUsPage } from '../pages/CmsContactUsPage';
import { CMS_PASSWORD, CMS_USERNAME } from '../utils/cmsLogin';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

const cmsUrl = process.env.CMS_BASE_URL || 'https://cms.gctp.in/';

type ContactRecord = {
    name: string;
    designation: string;
    phone: string;
};

const getComparisonDifferences = (
    expected: ContactRecord[],
    actual: ContactRecord[]
) => {
    const differences: string[] = [];
    const maximumRows = Math.max(expected.length, actual.length);

    for (let index = 0; index < maximumRows; index++) {
        const expectedRecord = expected[index];
        const actualRecord = actual[index];

        if (!expectedRecord || !actualRecord) {
            differences.push(
                `Row ${index + 1}: CMS=${JSON.stringify(expectedRecord ?? null)}; GCTP=${JSON.stringify(actualRecord ?? null)}`
            );
            continue;
        }

        if (expectedRecord.phone !== actualRecord.phone) {
            differences.push(
                `Row ${index + 1} order/content: CMS phone=${expectedRecord.phone}; GCTP phone=${actualRecord.phone}`
            );
        }

        for (const field of ['name', 'designation'] as const) {
            if (expectedRecord[field] !== actualRecord[field]) {
                differences.push(
                    `Row ${index + 1} ${field}: CMS="${expectedRecord[field]}"; GCTP="${actualRecord[field]}"`
                );
            }
        }
    }

    return differences.length > 0
        ? differences.join('\n')
        : 'No content differences found.';
};

test('verify CMS Contact Us page', async ({ page }) => {
    const contactUsPage = new CmsContactUsPage(page);

    await contactUsPage.loginToCms(cmsUrl, CMS_USERNAME, CMS_PASSWORD);
    await contactUsPage.openCmsContactUs();

    const expectedContactDetails = await contactUsPage.getContactRecords('cms');

    await contactUsPage.openHomePage();
    await contactUsPage.openContactUs();

    await expect(page.locator('table').first()).toBeVisible();

    const actualContactDetails = await contactUsPage.getContactRecords('public');
    const comparisonDifferences = getComparisonDifferences(
        expectedContactDetails,
        actualContactDetails
    );

    console.log('CMS expected Contact Us content:', JSON.stringify(expectedContactDetails, null, 2));
    console.log('GCTP actual Contact Us content:', JSON.stringify(actualContactDetails, null, 2));
    console.log('Contact Us comparison differences:', comparisonDifferences);

    await test.info().attach('comparison-differences', {
        body: comparisonDifferences,
        contentType: 'text/plain',
    });

    expect(actualContactDetails).toEqual(expectedContactDetails);
});
