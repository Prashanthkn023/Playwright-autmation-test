
import { expect, test, type APIResponse, type Page } from '@playwright/test';

type ApiSource =
  | 'Published website API'
  | 'CMS-backed website API'
  | 'ICCC API'
  | 'Geospatial API';

type WebsiteEndpoint = {
  id: string;
  url: string;
  source: ApiSource;
  description: string;
  headers?: Record<string, string>;
};

type ModuleMapping = {
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
  endpoint: WebsiteEndpoint;
  measurements: RequestMeasurement[];
  averageMs: number;
  medianMs: number;
  minimumMs: number;
  maximumMs: number;
};

const RESPONSE_TIME_THRESHOLD_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;
const REQUESTS_PER_ENDPOINT = 5;
// The geospatial proxy intermittently returns short bursts of 404s while the feature layer is available.
const NOT_FOUND_RETRIES = 4;

const websiteEndpoints: WebsiteEndpoint[] = [
  {
    id: 'home-page-content',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/home-page',
    source: 'Published website API',
    description: 'Homepage content, sliders, important links, traffic updates, helpline, FAQ and footer.',
  },
  {
    id: 'shared-layout-content',
    url: 'https://gctp.in/api/fusion-cms-web-backend/home-page',
    source: 'CMS-backed website API',
    description: 'Shared CMS layout and content data.',
  },
  {
    id: 'about-us-content',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/about-us',
    source: 'Published website API',
    description: 'About Us and commissioner content.',
  },
  {
    id: 'city-profile-content',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/city-profile',
    source: 'Published website API',
    description: 'City Profile content.',
  },
  {
    id: 'media-content',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/media',
    source: 'Published website API',
    description: 'Media page content.',
  },
  {
    id: 'news-content',
    url: 'https://gctp.in/api/fusion-public-facing-web-backend/news-and-updates',
    source: 'Published website API',
    description: 'News and Updates content.',
  },
  {
    id: 'contact-us-content',
    url: 'https://gctp.in/api/fusion-cms-web-backend/contact-us?approvalStatus=all',
    source: 'CMS-backed website API',
    description: 'Contact Us content.',
  },
  {
    id: 'organogram-content',
    url: 'https://gctp.in/api/fusion-cms-web-backend/organogram?approvalStatus=all',
    source: 'CMS-backed website API',
    description: 'Organogram content.',
  },
  {
    id: 'city-map-tourist-spots',
    url: 'https://gctp.in/api/fusion-iccc-service/tourist-spot',
    source: 'ICCC API',
    description: 'City Map tourist spot data.',
  },
  {
    id: 'complaint-incident-subtypes',
    url: 'https://gctp.in/api/fusion-iccc-service/incident-sub-types?cms=true',
    source: 'ICCC API',
    description: 'Complaint incident subtype data.',
  },
];

const moduleMappings: ModuleMapping[] = [
  { module: 'Home Page', endpointIds: ['home-page-content'] },
  { module: 'Home Page Sliders', endpointIds: ['home-page-content'] },
  { module: 'About Us', endpointIds: ['about-us-content', 'home-page-content'] },
  { module: 'GCTP', endpointIds: ['about-us-content', 'home-page-content'] },
  {
    module: 'Message from Police Commissioner',
    endpointIds: ['about-us-content', 'home-page-content'],
  },
  {
    module: 'Message from Additional COP',
    endpointIds: ['about-us-content', 'home-page-content'],
  },
  {
    module: 'Organogram',
    endpointIds: ['organogram-content', 'home-page-content'],
  },
  { module: 'Media', endpointIds: ['media-content', 'home-page-content'] },
  { module: 'News Updates', endpointIds: ['news-content', 'home-page-content'] },
  {
    module: 'City Profile',
    endpointIds: ['city-profile-content', 'shared-layout-content'],
  },
  {
    module: 'City Map',
    endpointIds: ['city-map-tourist-spots'],
    note: 'The station-boundary endpoint is excluded because it returns HTTP 404.',
  },
  { module: 'Important Links', endpointIds: ['home-page-content'] },
  { module: 'Helpline', endpointIds: ['home-page-content'] },
  { module: 'Traffic Updates', endpointIds: ['home-page-content'] },
  { module: 'Empanelment', endpointIds: ['home-page-content'] },
  {
    module: 'FAQ',
    endpointIds: ['home-page-content', 'shared-layout-content'],
  },
  {
    module: 'Footer Links',
    endpointIds: ['home-page-content', 'shared-layout-content'],
  },
  {
    module: 'Tamil Content',
    endpointIds: [
      'home-page-content',
      'about-us-content',
      'city-profile-content',
    ],
  },
  {
    module: 'Contact Us',
    endpointIds: ['contact-us-content', 'home-page-content'],
  },
  {
    module: 'Feedback',
    endpointIds: ['shared-layout-content'],
    note: 'Only API reads are tested; feedback is not submitted.',
  },
  {
    module: 'Complaints',
    endpointIds: ['complaint-incident-subtypes', 'shared-layout-content'],
    note: 'Only API reads are tested; no complaint is submitted.',
  },
  { module: 'Site Map', endpointIds: ['shared-layout-content'] },
  { module: 'Privacy Policy', endpointIds: ['home-page-content'] },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isJsonContentType(contentType: string): boolean {
  return /^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(
    contentType.trim()
  );
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function measureEndpoint(
  page: Page,
  endpoint: WebsiteEndpoint
): Promise<EndpointReport> {
  const measurements: RequestMeasurement[] = [];

  for (let attempt = 1; attempt <= REQUESTS_PER_ENDPOINT; attempt++) {
    const startedAt = performance.now();

    let status: number | null = null;
    let outcome = 'Request did not complete';

    try {
      let response: APIResponse | undefined;

      for (let retry = 0; retry <= NOT_FOUND_RETRIES; retry++) {
        response = await page.request.get(endpoint.url, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            Accept: 'application/json',
            ...endpoint.headers,
          },
        });

        status = response.status();
        if (status !== 404 || retry === NOT_FOUND_RETRIES) {
          break;
        }

        await page.waitForTimeout(100);
      }

      if (!response) {
        throw new Error(`No response received from ${endpoint.url}.`);
      }

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

  const times = measurements.map((item) => item.elapsedMs);

  return {
    endpoint,
    measurements,
    averageMs: times.reduce((sum, time) => sum + time, 0) / times.length,
    medianMs: calculateMedian(times),
    minimumMs: Math.min(...times),
    maximumMs: Math.max(...times),
  };
}

test('GCTP website API performance: verified module endpoints', async (
  { page },
  testInfo
) => {
  const endpointsById = new Map(
    websiteEndpoints.map((endpoint) => [endpoint.id, endpoint])
  );

  // Validate and print module-to-endpoint mappings.
  console.log('\n========== MODULE API MAPPING ==========\n');

  for (const mapping of moduleMappings) {
    const mappedEndpoints = mapping.endpointIds.map((id) => {
      const endpoint = endpointsById.get(id);

      if (!endpoint) {
        throw new Error(
          `Module "${mapping.module}" references unknown endpoint "${id}".`
        );
      }

      return endpoint;
    });

    console.log(
      `[MODULE] ${mapping.module} | ` +
        mappedEndpoints.map((endpoint) => endpoint.id).join(', ') +
        (mapping.note ? ` | ${mapping.note}` : '')
    );
  }

  const reports: EndpointReport[] = [];

  // Measure each endpoint five times.
  for (const endpoint of websiteEndpoints) {
    reports.push(await measureEndpoint(page, endpoint));
  }

  type MeasuredRequest = {
    endpoint: WebsiteEndpoint;
    measurement: RequestMeasurement;
  };

  const allMeasurements: MeasuredRequest[] = reports.flatMap((report) =>
    report.measurements.map((measurement) => ({
      endpoint: report.endpoint,
      measurement,
    }))
  );

  // Print the requested console format.
  console.log('\n========== API PERFORMANCE REPORT ==========\n');

  for (const { endpoint, measurement } of allMeasurements) {
    const isHttpError =
      measurement.status === null || measurement.status >= 400;

    const isSlow =
      measurement.elapsedMs > RESPONSE_TIME_THRESHOLD_MS;

    let result: string;

    if (isHttpError) {
      result = 'HTTP ERROR';
    } else if (isSlow) {
      result = 'SLOW';
    } else if (measurement.outcome !== 'PASS') {
      result = 'INVALID RESPONSE';
    } else {
      result = 'PASS';
    }

    console.log(
      `Status: ${measurement.status ?? 'N/A'} | ` +
        `Method: GET | ` +
        `Response Time: ${measurement.elapsedMs.toFixed(0)} ms | ` +
        `Result: ${result} | ` +
        `API: ${endpoint.id}`
    );
  }

  const totalApis = allMeasurements.length;

  const slowApis = allMeasurements.filter(
    ({ measurement }) =>
      measurement.elapsedMs > RESPONSE_TIME_THRESHOLD_MS
  );

  const httpErrorApis = allMeasurements.filter(
    ({ measurement }) =>
      measurement.status === null || measurement.status >= 400
  );

  const averageResponseTime =
    totalApis > 0
      ? allMeasurements.reduce(
          (sum, item) => sum + item.measurement.elapsedMs,
          0
        ) / totalApis
      : 0;

  console.log('\n========== SUMMARY ==========\n');
  console.log(`Total APIs: ${totalApis}`);
  console.log(`Slow APIs: ${slowApis.length}`);
  console.log(`HTTP Error APIs: ${httpErrorApis.length}`);
  console.log(
    `Average Response Time: ${averageResponseTime.toFixed(2)} ms`
  );

  // Save detailed results as a Playwright attachment.
  await testInfo.attach('gctp-website-api-performance-report.json', {
    body: JSON.stringify(
      {
        baseUrl: 'https://gctp.in',
        thresholdMs: RESPONSE_TIME_THRESHOLD_MS,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
        requestsPerEndpoint: REQUESTS_PER_ENDPOINT,
        totalRequests: totalApis,
        slowRequests: slowApis.length,
        httpErrorRequests: httpErrorApis.length,
        averageResponseTimeMs: averageResponseTime,
        moduleMappings,
        endpoints: reports,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });

  // A request fails the test if it is slow or does not return valid JSON.
  const failedMeasurements = allMeasurements.filter(
    ({ measurement }) =>
      measurement.outcome !== 'PASS' ||
      measurement.elapsedMs > RESPONSE_TIME_THRESHOLD_MS
  );

  expect(
    failedMeasurements.map(({ endpoint, measurement }) => ({
      endpoint: endpoint.id,
      attempt: measurement.attempt,
      status: measurement.status,
      elapsedMs: Number(measurement.elapsedMs.toFixed(2)),
      outcome:
        measurement.elapsedMs > RESPONSE_TIME_THRESHOLD_MS
          ? `SLOW: ${measurement.outcome}`
          : measurement.outcome,
    })),
    'One or more API requests failed validation or exceeded the response-time threshold.'
  ).toEqual([]);
});
