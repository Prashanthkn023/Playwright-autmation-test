import { test } from '@playwright/test';

type ApiResult = {
  method: string;
  url: string;
  status: number;
};

function isSuccessfulStatus(status: number) {
  return (status >= 200 && status < 300) || status === 304;
}

function isTargetApi(url: string, resourceType: string) {
  return (
    (resourceType === 'xhr' || resourceType === 'fetch') &&
    url.includes('/api/fusion-public-facing')
  );
}

test('Validate media page APIs', async ({ page }) => {
  const responses: ApiResult[] = [];

  page.on('response', (response) => {
    if (!isTargetApi(response.url(), response.request().resourceType())) {
      return;
    }

    responses.push({
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
    });
  });

  await page.goto('https://gctp.in/chennai-media', {
    waitUntil: 'domcontentloaded',
  });

  try {
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  } catch {
    console.log('Network did not become idle within 30 seconds; validating captured APIs.');
  }

  const uniqueResponses = Array.from(
    new Map(
      responses.map((response) => [
        `${response.method} ${response.url}`,
        response,
      ])
    ).values()
  );

  if (uniqueResponses.length === 0) {
    throw new Error('No target APIs were captured from https://gctp.in/chennai-media');
  }

  const failedResponses = uniqueResponses.filter(
    (response) => !isSuccessfulStatus(response.status)
  );

  for (const response of uniqueResponses) {
    const result = isSuccessfulStatus(response.status) ? 'PASS' : 'FAIL';
    console.log(`${result} | ${response.status} | ${response.method} ${response.url}`);
  }

  if (failedResponses.length > 0) {
    const failures = failedResponses
      .map((response) => `${response.status} ${response.method} ${response.url}`)
      .join('\n');

    throw new Error(`API validation failed for ${failedResponses.length} endpoint(s):\n${failures}`);
  }
});