import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';

export interface AiTestSummary {
  overallSummary: string;

  passedSummaries: Array<{
    testId: string;
    summary: string;
  }>;

  failedSummaries: Array<{
    testId: string;
    failureSummary: string;
    expectedResult: string;
    actualResult: string;
    stepsToReproduce: string[];
    severity: string;
    priority: string;
    bugTitle: string;
  }>;
}

const AGENT =
  process.env.GEMINI_AGENT ||
  'antigravity-preview-09-2026';

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isDailyQuotaExceeded(errorText: string): boolean {
  return (
    /GenerateRequestsPerDayPerModel-FreeTier/i.test(errorText) ||
    /generate_content_free_tier_requests/i.test(errorText) ||
    /daily.*quota|quota.*per.day/i.test(errorText)
  );
}

function isRetryable(errorText: string): boolean {
  return (
    /503|UNAVAILABLE|high demand|temporarily unavailable/i.test(
      errorText,
    ) ||
    (
      /429|RESOURCE_EXHAUSTED/i.test(errorText) &&
      !isDailyQuotaExceeded(errorText)
    )
  );
}

function getRetryDelayMs(
  errorText: string,
  attempt: number,
): number {
  const retryMatch = errorText.match(
    /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i,
  );

  if (retryMatch) {
    return Math.ceil(Number(retryMatch[1]) * 1000) + 1000;
  }

  return attempt === 1 ? 15_000 : 30_000;
}

function extractJson(text: string): AiTestSummary {
  let cleaned = text.trim();

  // Remove Markdown code fences if the agent includes them.
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // If the agent adds text around the JSON, extract the object.
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  const parsed = JSON.parse(cleaned) as AiTestSummary;

  if (
    typeof parsed.overallSummary !== 'string' ||
    !Array.isArray(parsed.passedSummaries) ||
    !Array.isArray(parsed.failedSummaries)
  ) {
    throw new Error(
      'Antigravity response did not match the expected report format.',
    );
  }

  return parsed;
}

export async function generateAiTestReport(
  testResults: TestResult[],
): Promise<AiTestSummary> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY was not loaded from .env.',
    );
  }

  // Dynamic import supports a CommonJS TypeScript project.
  const { GoogleGenAI } = await import('@google/genai');

  const ai = new GoogleGenAI({ apiKey });

  // Send the actual Playwright results.
  // Do not include passwords, OTPs, tokens, or other secrets.
  const input = testResults.map(test => ({
    testId: test.testId,
    title: test.title,
    status: test.status,
    durationMs: test.durationMs,
    error: test.error ?? null,
    expectedEvidence: test.expectedEvidence ?? null,
    actualEvidence: test.actualEvidence ?? null,
  }));

  const prompt = `
You are a professional software QA report writer.

Create a clear, human-readable QA report using only
the supplied Playwright results.

Write in SIMPLE ENGLISH that a non-technical person
can understand.

Return valid JSON only, using this exact structure:

{
  "overallSummary": "A short summary of the test execution",
  "passedSummaries": [
    {
      "testId": "exact testId",
      "summary": "What the test checked successfully"
    }
  ],
  "failedSummaries": [
    {
      "testId": "exact testId",
      "failureSummary": "A simple explanation of what went wrong",
      "expectedResult": "What should have happened",
      "actualResult": "What actually happened",
      "stepsToReproduce": ["Step 1", "Step 2"],
      "severity": "Unassigned",
      "priority": "Unassigned",
      "bugTitle": "A short bug title in simple English"
    }
  ]
}

SIMPLE ENGLISH RULES:

1. Use short, clear, natural English.
2. Avoid technical terms and programming expressions
   in the user-facing report.
3. Do not include raw error codes, stack traces,
   locator expressions, or programming code.
4. Explain technical failures in everyday language.

Examples:

Technical:
"net::ERR_CONNECTION_TIMED_OUT"

Simple:
"The website did not open because the connection
took too long."

Technical:
"Locator was not found within 30000ms."

Simple:
"The link was not found within 30 seconds."

Technical:
"Target page, context, or browser was closed."

Simple:
"The page closed before the test could finish."

BUG TITLE RULES:

Use short, factual titles such as:
- "Website did not open"
- "TNRTO link was not found"
- "Helpline section could not be checked"
- "Feedback form could not be opened"
- "Page closed before the check was completed"

Do not use vague titles such as "Test failed".

EXPECTED AND ACTUAL RESULTS:

- Explain what should happen and what actually happened.
- Use only the supplied test title and evidence.
- If expected behavior is not supported by the evidence,
  write exactly:
  "Not specified in test evidence."
- Do not claim that a feature is broken merely because
  the test could not access it.
- Do not invent the root cause of a failure.

REPRODUCTION STEPS:

- Use only actions supported by the supplied evidence.
- Do not invent steps.
- If steps cannot be determined, return:
  ["Steps not specified in test evidence."]

SEVERITY AND PRIORITY:

- Do not guess severity or priority.
- Use "Unassigned" unless the evidence explicitly
  provides a value.

TEST RESULT RULES:

- Preserve every testId exactly as provided.
- Include one passedSummaries entry for each passed test.
- Include one failedSummaries entry for each failed
  or timed-out test.
- Do not classify skipped tests as passed or failed.
- Do not change test statuses or counts.
- Do not invent test results.
- Do not provide fixes, solutions, or recommendations.
- Do not invent the cause of an interrupted test run.
- Return JSON only, without Markdown or explanations.

Playwright results:
${JSON.stringify(input)}
`;

  let lastError: unknown;

  // One Antigravity interaction for the complete test run.
  // Do not retry when the daily quota has been exhausted.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Generating QA report with Antigravity (attempt ${attempt}/3)...`,
      );

      const interaction = await ai.interactions.create(
        {
          agent: AGENT,
          input: prompt,
          environment: 'remote',
        },
        {
          timeout: 300_000,
        },
      );

      const responseText = interaction.output_text;

      if (
        typeof responseText !== 'string' ||
        responseText.trim().length === 0
      ) {
        throw new Error(
          `Antigravity returned no report text. Status: ${interaction.status}`,
        );
      }

      const report = extractJson(responseText);

      console.log(
        'Antigravity QA report generated successfully.',
      );

      return report;
    } catch (error) {
      lastError = error;

      const message = getErrorText(error);

      if (isDailyQuotaExceeded(message)) {
        throw new Error(
          'Antigravity daily quota exhausted. ' +
          'Check the project quota or billing settings. ' +
          'No further retries were attempted.',
        );
      }

      if (!isRetryable(message) || attempt === 3) {
        break;
      }

      const delayMs = getRetryDelayMs(message, attempt);

      console.warn(
        `Antigravity attempt ${attempt}/3 failed. ` +
        `Retrying in ${Math.ceil(delayMs / 1000)} seconds.`,
      );

      await new Promise<void>(resolve => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw new Error(
    `Antigravity report generation failed: ${getErrorText(lastError)}`,
  );
}