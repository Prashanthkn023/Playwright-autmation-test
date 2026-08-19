import { test } from '../fixtures/baseTest';

test('TC_004 End To End Flow', async ({
    home,
    image,
    feedback,
    complaint
}) => {

    await home.openHomePage();

    await image.validateHomePageImages();

    await home.openFeedback();

    await feedback.verifyFeedbackPage();
    await feedback.selectRating(4);
    await feedback.enterFeedback('Great website, easy to navigate.');
    await feedback.waitForCaptcha();
    await feedback.clickSubmit();
    await feedback.verifySuccess();

    await home.openComplaint();

    await complaint.submitComplaint({
        name: 'Prashanth',
        mobile: '8861983424',
        incidentType: 'COMPLAINTS',
        incidentSubType: 'GRIEVANCE',
        location: 'Chennai Central',
        message: 'Automation Testing using Playwright'
    });
});
