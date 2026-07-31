import { test as base } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { ComplaintPage } from '../pages/ComplaintPage';
import { ImageValidationPage } from '../pages/ImageValidationPage';

type PageObjects = {

    home: HomePage;

    feedback: FeedbackPage;

    complaint: ComplaintPage;

    image: ImageValidationPage;

};

export const test = base.extend<PageObjects>({

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

    }

});

export { expect } from '@playwright/test';