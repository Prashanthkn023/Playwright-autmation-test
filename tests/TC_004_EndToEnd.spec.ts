import { test } from '../Fixtures/baseTest';

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

    await feedback.enterFeedback(
        'Great website, easy to navigate.'
    );

    await feedback.waitForCaptcha();

    await feedback.clickSubmit();

    await feedback.verifySuccess();

    await home.openHomePage();

    await home.openComplaint();

    await complaint.verifyComplaintPage();

    await complaint.enterName('Prashanth');

    await complaint.enterMobile('7619103887');

    await complaint.selectIncident('WEATHER', 'FLOOD');

    await complaint.uploadPNG();

    await complaint.selectLocation('Chennai Central');

    await complaint.enterComplaint(
        'Automation Testing using Playwright'
    );

    await complaint.waitForCaptcha();

    await complaint.clickSubmit();

    await complaint.verifyToastMessage();

    await complaint.verifyOTPField();

    await complaint.clickVerifySubmit();

    await complaint.verifyComplaintSuccess();

});