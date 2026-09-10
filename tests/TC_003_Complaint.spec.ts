import { test } from '../fixtures/baseTest';
import { getTestCases } from '../utils/testData';

const complaintCases = getTestCases<{
  scenario: string;
  name: string;
  mobile: string;
  incidentType: string;
  incidentSubType: string;
  location: string;
  message: string;
}>('testdata/complaint-cases.json');

for (const testCase of complaintCases) {
  test(`TC_003 Complaint Page Submission Flow - ${testCase.scenario} @manual`, async ({ home, complaint }) => {
    await home.openHomePage();
    await home.openComplaint();

    await complaint.submitComplaint({
      name: testCase.name,
      mobile: testCase.mobile,
      incidentType: testCase.incidentType,
      incidentSubType: testCase.incidentSubType,
      location: testCase.location,
      message: testCase.message,
    });

    await complaint.validateComplaintApiResponse();
  });
}
