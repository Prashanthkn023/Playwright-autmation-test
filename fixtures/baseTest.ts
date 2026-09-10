import { test as base } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { ComplaintPage } from '../pages/ComplaintPage';
import { ImageValidationPage } from '../pages/ImageValidationPage';
import { CmsPage } from '../pages/CmsPage';
import { closeAwarenessPopup } from '../utils/closeAwarenessPopup';

type PageObjects = {

    home: HomePage;

    feedback: FeedbackPage;

    complaint: ComplaintPage;

    image: ImageValidationPage;

    cms: CmsPage;

};

type SharedFixtures = {
    awarenessPopupHandler: void;
};

export const test = base.extend<PageObjects & SharedFixtures>({

    awarenessPopupHandler: [async ({ page }, use) => {
        const handlePageLoad = async () => {
            await closeAwarenessPopup(page);
        };

        page.on('load', handlePageLoad);
        await use();
        page.off('load', handlePageLoad);
    }, { auto: true }],

    home: async ({ page }, use) => {

        await use(new HomePage(page));

    },

    feedback: async ({ page }, use) => {

        await use(new FeedbackPage(page));

    },

    complaint: async ({ page }, use) => {

        await use(new ComplaintPage(page));

    },

    image: async ({ page }, use) => {

        await use(new ImageValidationPage(page));

    },

    cms: async ({ page }, use) => {

        await use(new CmsPage(page));

    }

});

export { expect } from '@playwright/test';