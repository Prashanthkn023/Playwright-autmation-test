import { expect, test } from '@playwright/test';

type ApiSource =
  | 'CMS API'
  | 'Published website API'
  | 'ICCC API'
  | 'Geospatial API';

type VerifiedEndpoint = {
  id: string;
  url: string;
  source: ApiSource;
  description: string;
  headers?: Record<string, string>;
};

type ModuleEndpointMapping = {
  module: string;
  endpointIds: string[];
  note?: string;
};

type RequestMeasurement = {
  attempt: number;
  elapsedMs: number;
  status: number | null;
  outcome: string;
};

type EndpointReport = {
  endpoint: VerifiedEndpoint;
  measurements: RequestMeasurement[];
  averageMs: number;
  medianMs: number;
  minimumMs: number;
  maximumMs: number;
};

const RESPONSE_TIME_THRESHOLD_MS = 2_000;
const REQUEST_TIMEOUT_MS = 30_000;
const REQUESTS_PER_ENDPOINT = 5;

const verifiedEndpoints: VerifiedEndpoint[] = [
  {
    id: 'cms-home-page',
    url: 'https://cms.gctp.in/api/fusion-cms-web-backend/home-page?approvalStatus=all',
    source: 'CMS API',
    description: 'CMS Home Page API with approval filter, confirmed in tests/validate.spec.ts',
  },
  {
    id: 'published-home-page',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/home-page',
    source: 'Published website API',
    description: 'Published Home Page API; live response includes links, sliders, traffic updates, helpline, privacy, and FAQ sections',
  },
  {
    id: 'published-cms-home-page',
    url: 'https://gctp.in/api/fusion-cms-web-backend/home-page',
    source: 'CMS API',
    description: 'CMS Home Page data requested by published routes; observed in live browser network capture',
  },
  {
    id: 'published-about-us',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/about-us',
    source: 'Published website API',
    description: 'About Us and commissioner content; observed in live browser network capture',
  },
  {
    id: 'published-city-profile',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/city-profile',
    source: 'Published website API',
    description: 'City Profile content; observed in live browser network capture',
  },
  {
    id: 'published-media',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/media',
    source: 'Published website API',
    description: 'Published Media content; observed in live browser network capture',
  },
  {
    id: 'published-news-updates',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/news-and-updates',
    source: 'Published website API',
    description: 'Published News Updates content; observed in live browser network capture',
  },
  {
    id: 'published-contact-us',
    url: 'https://gctp.in/api/fusion-cms-web-backend/contact-us?approvalStatus=all',
    source: 'CMS API',
    description: 'Contact Us content; observed in live browser network capture',
  },
  {
    id: 'published-organogram',
    url: 'https://gctp.in/api/fusion-cms-web-backend/organogram?approvalStatus=all',
    source: 'CMS API',
    description: 'Organogram content; observed in live browser network capture',
  },
  {
    id: 'city-map-tourist-spots',
    url: 'https://gctp.in/api/fusion-iccc-service/tourist-spot',
    source: 'ICCC API',
    description: 'City Map tourist spot data; observed in live browser network capture',
  },
  {
    id: 'complaint-incident-sub-types',
    url: 'https://gctp.in/api/fusion-iccc-service/incident-sub-types?cms=true',
    source: 'ICCC API',
    description: 'Complaint form incident subtypes; observed in live browser network capture',
  },
];

const moduleEndpointMappings: ModuleEndpointMapping[] = [
  { module: 'Home Page', endpointIds: ['cms-home-page', 'published-home-page'] },
  { module: 'Home Page Sliders', endpointIds: ['published-home-page'] },
  { module: 'About Us', endpointIds: ['published-about-us', 'published-home-page'] },
  { module: 'GCTP (About Us)', endpointIds: ['published-about-us', 'published-home-page'] },
  { module: 'Message from Police Commissioner', endpointIds: ['published-about-us', 'published-home-page'] },
  { module: 'Message from Additional COP', endpointIds: ['published-about-us', 'published-home-page'] },
  { module: 'Organogram', endpointIds: ['published-organogram', 'published-home-page'] },
  { module: 'Media', endpointIds: ['published-media', 'published-home-page'] },
  { module: 'News Updates', endpointIds: ['published-news-updates', 'published-home-page'] },
  { module: 'City Profile', endpointIds: ['published-city-profile', 'published-cms-home-page'] },
  {
    module: 'City Map',
    endpointIds: ['city-map-tourist-spots'],
    note: 'The station-boundary endpoint is excluded because it returns HTTP 404.',
  },
  { module: 'Important Links', endpointIds: ['published-home-page'] },
  { module: 'Helpline', endpointIds: ['published-home-page'] },
  { module: 'Traffic Updates', endpointIds: ['published-home-page'] },
  { module: 'Empanelment', endpointIds: ['published-home-page'] },
  { module: 'FAQ', endpointIds: ['published-home-page', 'published-cms-home-page'] },
  { module: 'Footer Links', endpointIds: ['published-home-page', 'published-cms-home-page'] },
  { module: 'Tamil Content', endpointIds: ['published-home-page', 'published-about-us', 'published-city-profile'] },
  { module: 'Contact Us', endpointIds: ['published-contact-us', 'published-home-page'] },
  {
    module: 'Feedback',
    endpointIds: ['published-cms-home-page'],
    note: 'Page load uses shared layout data; feedback submission is not exercised to avoid creating real feedback.',
  },
  { module: 'Complaints', endpointIds: ['complaint-incident-sub-types', 'published-cms-home-page'] },
  { module: 'Site Map', endpointIds: ['published-cms-home-page'] },
  { module: 'Privacy Policy', endpointIds: ['published-home-page'] },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isJsonContentType(contentType: string): boolean {
  return /^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType);
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function measureEndpoint(
  page: import('@playwright/test').Page,
  endpoint: VerifiedEndpoint
): Promise<EndpointReport> {
  const measurements: RequestMeasurement[] = [];

  for (let attempt = 1; attempt <= REQUESTS_PER_ENDPOINT; attempt++) {
    const startedAt = performance.now();
    let status: number | null = null;
    let outcome = 'Request did not complete';

    try {
      const response = await page.request.get(endpoint.url, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Accept: 'application/json',
          ...endpoint.headers,
        },
      });

      status = response.status();
      const contentType = response.headers()['content-type'] ?? '';
      const body = await response.text();

      if (!response.ok()) {
        outcome = `HTTP error ${status}`;
      } else if (!isJsonContentType(contentType)) {
        outcome = `Invalid content type: ${contentType || '(missing)'}`;
      } else {
        try {
          JSON.parse(body);
          outcome = 'PASS';
        } catch (error) {
          outcome = `Invalid JSON: ${getErrorMessage(error)}`;
        }
      }
    } catch (error) {
      outcome = `Request error: ${getErrorMessage(error)}`;
    }

    measurements.push({
      attempt,
      elapsedMs: performance.now() - startedAt,
      status,
      outcome,
    });
  }

  const elapsedTimes = measurements.map((measurement) => measurement.elapsedMs);

  return {
    endpoint,
    measurements,
    averageMs:
      elapsedTimes.reduce((total, elapsedMs) => total + elapsedMs, 0) /
      elapsedTimes.length,
    medianMs: calculateMedian(elapsedTimes),
    minimumMs: Math.min(...elapsedTimes),
    maximumMs: Math.max(...elapsedTimes),
  };
}

test('API performance: five sequential requests for every verified endpoint', async ({
  page,
}, testInfo) => {
  const endpointsById = new Map(
    verifiedEndpoints.map((endpoint) => [endpoint.id, endpoint])
  );

  for (const mapping of moduleEndpointMappings) {
    const endpointDescriptions = mapping.endpointIds
      .map((endpointId) => endpointsById.get(endpointId))
      .filter((endpoint): endpoint is VerifiedEndpoint => endpoint !== undefined)
      .map((endpoint) => `${endpoint.source}: ${endpoint.url}`);

    console.log(
      `[MODULE] ${mapping.module} | ${
        endpointDescriptions.length > 0
          ? `${endpointDescriptions.join(' ; ')}${
              mapping.note ? ` | ${mapping.note}` : ''
            }`
          : `NOT MAPPED — no verified module-content API endpoint in project code${
              mapping.note ? ` | ${mapping.note}` : ''
            }`
      }`
    );
  }

  const reports: EndpointReport[] = [];

  for (const endpoint of verifiedEndpoints) {
    const report = await measureEndpoint(page, endpoint);
    reports.push(report);

    console.log(
      `\n[API PERFORMANCE] ${endpoint.id} | ${endpoint.source} | ${endpoint.url}`
    );

    for (const measurement of report.measurements) {
      console.log(
        `  Request ${measurement.attempt}/${REQUESTS_PER_ENDPOINT} | ` +
          `status=${measurement.status ?? 'NETWORK/TIMEOUT ERROR'} | ` +
          `elapsed=${measurement.elapsedMs.toFixed(2)}ms | ${measurement.outcome}`
      );
    }

    console.log(
      `  average=${report.averageMs.toFixed(2)}ms | ` +
        `median=${report.medianMs.toFixed(2)}ms | ` +
        `min=${report.minimumMs.toFixed(2)}ms | ` +
        `max=${report.maximumMs.toFixed(2)}ms | ` +
        `threshold=${RESPONSE_TIME_THRESHOLD_MS}ms`
    );
  }

  await testInfo.attach('api-performance-report.json', {
    body: JSON.stringify(
      {
        thresholdMs: RESPONSE_TIME_THRESHOLD_MS,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
        requestsPerEndpoint: REQUESTS_PER_ENDPOINT,
        moduleMappings: moduleEndpointMappings.map((mapping) => ({
          ...mapping,
          status: mapping.endpointIds.length > 0 ? 'MAPPED' : 'NOT MAPPED',
        })),
        endpoints: reports,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });

  const failedRequests = reports.flatMap((report) =>
    report.measurements
      .filter((measurement) => measurement.outcome !== 'PASS')
      .map(
        (measurement) =>
          `${report.endpoint.id} request ${measurement.attempt}: ${measurement.outcome}`
      )
  );

  expect(
    failedRequests,
    'Every verified API endpoint must return a successful JSON response for all five requests'
  ).toEqual([]);

  const slowEndpoints = reports
    .filter((report) => report.averageMs > RESPONSE_TIME_THRESHOLD_MS)
    .map(
      (report) =>
        `${report.endpoint.id}: average ${report.averageMs.toFixed(2)}ms`
    );

  expect(
    slowEndpoints,
    `Endpoint average response time must not exceed ${RESPONSE_TIME_THRESHOLD_MS}ms`
  ).toEqual([]);
});
