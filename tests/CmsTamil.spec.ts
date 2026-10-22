import { test, expect } from '../fixtures/baseTest';

test.describe('Tamil Content Validation', () => {
    test.beforeEach(async ({ cmsTamil, page }) => {
        await cmsTamil.navigateToTamil();
    });

    test('Tamil – Helpline', async ({ cmsTamil }) => {
        await cmsTamil.verifyHelplineTamil();
    });

    test('Tamil – Traffic Updates', async ({ cmsTamil }) => {
        await cmsTamil.verifyTrafficUpdatesTamil();
    });

    test('Tamil – Important Links', async ({ cmsTamil }) => {
        await cmsTamil.verifyImportantLinksTamil();
    });

    test('Tamil – Footer Links', async ({ cmsTamil }) => {
        await cmsTamil.verifyFooterLinksTamil();
    });

    // Placeholder tests for other sections as per requirement
    test('Tamil – Empanelment', async ({ cmsTamil }) => {
        await cmsTamil.verifyEmpanelmentTamil();
    });

    test('Tamil – Home Page Sliders', async ({ cmsTamil }) => {
        await cmsTamil.verifyHomePageSlidersTamil();
    });

    test('Tamil – FAQ', async ({ cmsTamil }) => {
        await cmsTamil.verifyFAQTamil();
    });
});
