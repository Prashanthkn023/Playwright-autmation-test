import { test } from '../fixtures/baseTest';
import { getTestCases } from '../utils/testData';

const feedbackCases = getTestCases<{ scenario: string; rating: number; message: string }>(
  'testdata/feedback-cases.json'
);

for (const testCase of feedbackCases) {
  test(`TC_002 Feedback Form Submission - ${testCase.scenario} @manual`, async ({ home, feedback }) => {
    await home.openHomePage();
    await home.openFeedback();

    await feedback.verifyFeedbackPage();
    await feedback.selectRating(testCase.rating);
    await feedback.enterFeedback(testCase.message);
    await feedback.waitForCaptcha();
    await feedback.clickSubmit();
    await feedback.verifySuccess();
  });
}
