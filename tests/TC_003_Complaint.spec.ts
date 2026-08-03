import { test } from '../fixtures/baseTest';
import complaintData from '../testdata/complaint.json';

test.setTimeout(60000); // 3 minutes

test('TC_003 Complaint Form Submission', async ({ home, complaint }) => {

    await home.openHomePage();

    await home.openComplaint();

    await complaint.submitComplaint(complaintData);

});