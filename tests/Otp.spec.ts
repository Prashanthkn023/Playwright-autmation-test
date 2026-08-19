import { test, request } from '@playwright/test';

test('Citizen login with OTP', async () => {
  const api = await request.newContext();

  const response = await api.post(
    'https://gctp.in/api/fusion-configuration-service/citizen/login',
    {
      headers: { 'Content-Type': 'application/json' },
      data: {
        f_citizen_mobile_number: '8861983424',
        otp: '123456',   // <-- replace with actual OTP
        f_complaint: true
      }
    }
  );

  console.log('Status:', response.status());

  const json = await response.json();
  console.log('Full Response:', json);

  // Extract cookie if returned
  const setCookie = response.headers()['set-cookie'];
  const cookieValue = setCookie?.match(/TSe131d7fc027=([^;]+)/)?.[1];
  console.log('Cookie Value:', cookieValue);
});
