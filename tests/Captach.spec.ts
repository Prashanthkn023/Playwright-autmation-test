import { test, expect } from '../fixtures/baseTest';

test("Validate the feedback form @manual", async ({ home, feedback }) => {
  await home.openHomePage();
  await home.openFeedback();

  await feedback.verifyFeedbackPage();
  await feedback.selectRating(5);
  await feedback.enterFeedback('Feedback form validation using Playwright');
  await feedback.waitForCaptcha();
  await feedback.clickSubmit();
  await feedback.verifySuccess();

  await expect(feedback.successMessage).toBeVisible();
});
