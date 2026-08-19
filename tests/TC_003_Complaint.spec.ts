import { test } from '../fixtures/baseTest';

test('TC_003 Complaint Page Submission Flow', async ({ home, complaint }) => {
  await home.openHomePage();
  await home.openComplaint();

  await complaint.submitComplaint({
    name: 'Prashanth',
    mobile: '8861983424',
    incidentType: 'COMPLAINT',
    incidentSubType: 'GRIEVANCE',
    location: 'Chennai Central',
    message: 'Automation Testing using Playwright'
  });
});
