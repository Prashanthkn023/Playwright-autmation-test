import { request } from '@playwright/test';
import fs from 'fs';

async function fetchAndLog() {
  const context = await request.newContext();

  const cmsApi = 'https://gctp.in/api/fusion-cms-web-backend/contact-us?approvalStatus=all';
  const publicApi = 'https://gctp.in/api/fusion-public-facing-web-backend/contact-us';

  const cmsResponse = await context.get(cmsApi);
  const cmsBody = await cmsResponse.json();
  fs.writeFileSync('../artifacts/api-responses/cms-full.json', JSON.stringify(cmsBody, null, 2));

  const publicResponse = await context.get(publicApi);
  const publicBody = await publicResponse.json();
  fs.writeFileSync('../artifacts/api-responses/public-full.json', JSON.stringify(publicBody, null, 2));

  const apiResponse = {
    cms: cmsBody,
    public: publicBody
  };
  fs.writeFileSync('../artifacts/api-responses/api-response.json', JSON.stringify(apiResponse, null, 2));

  console.log('CMS records count:', cmsBody.payload?.length);
  console.log('Public records count:', publicBody.payload?.length);
  if (cmsBody.payload?.[0]) {
    console.log('CMS sample record keys:', Object.keys(cmsBody.payload[0]));
    console.log('CMS sample record:', cmsBody.payload[0]);
  }
  if (publicBody.payload?.[0]) {
    console.log('Public sample record keys:', Object.keys(publicBody.payload[0]));
    console.log('Public sample record:', publicBody.payload[0]);
  }
}

fetchAndLog();
