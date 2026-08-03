import { test } from '../fixtures/baseTest';

import feedbackData from '../testdata/feedback.json';

test('TC_002 Feedback Form Submission', async ({ home, feedback }) => {

    await home.openHomePage();

    await home.openFeedback();

    await feedback.verifyFeedbackPage();

    await feedback.selectRating(feedbackData.rating);

    await feedback.enterFeedback(feedbackData.message);

    await feedback.waitForCaptcha();

    await feedback.clickSubmit();

    await feedback.verifySuccess();

});