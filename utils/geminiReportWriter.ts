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

  // Extract the JSON object if extra text surrounds it.
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

  // Validate individual records before passing them to ExcelJS.
  for (const item of parsed.passedSummaries) {
    if (
      typeof item.testId !== 'string' ||
      typeof item.summary !== 'string'
    ) {
      throw new Error(
        'Antigravity returned an invalid passed-test summary.',
      );
    }
  }

  for (const item of parsed.failedSummaries) {
    if (
      typeof item.testId !== 'string' ||
      typeof item.failureSummary !== 'string' ||
      typeof item.expectedResult !== 'string' ||
      typeof item.actualResult !== 'string' ||
      !Array.isArray(item.stepsToReproduce) ||
      !item.stepsToReproduce.every(
        (step: unknown) => typeof step === 'string',
      ) ||
      typeof item.severity !== 'string' ||
      typeof item.priority !== 'string' ||
      typeof item.bugTitle !== 'string'
    ) {
      throw new Error(
        'Antigravity returned an invalid failed-test summary.',
      );
    }
  }

  return parsed;
}

function buildPrompt(testResults: TestResult[]): string {
  const input = testResults.map(test => ({
    testId: test.testId,
    title: test.title,
    status: test.status,
    durationMs: test.durationMs,
    error: test.error ?? null,
    expectedEvidence: test.expectedEvidence ?? null,
    actualEvidence: test.actualEvidence ?? null,
  }));

  return `
You are an experienced Software QA Engineer writing a
professional software testing report.

Create a clear QA report using only the supplied
Playwright test results and evidence.

Write in SIMPLE, NATURAL, PROFESSIONAL ENGLISH that a
non-technical person can understand.

Return valid JSON only. Do not include Markdown,
code fences, or explanations outside the JSON.

REQUIRED JSON STRUCTURE:

{
  "overallSummary": "A short summary of the test execution",
  "passedSummaries": [
    {
      "testId": "exact supplied testId",
      "summary": "What the test checked successfully"
    }
  ],
  "failedSummaries": [
    {
      "testId": "exact supplied testId",
      "failureSummary": "A simple explanation of the observed failure",
      "expectedResult": "What should have happened",
      "actualResult": "What actually happened",
      "stepsToReproduce": [
        "A step supported by the supplied evidence"
      ],
      "severity": "Unassigned",
      "priority": "Unassigned",
      "bugTitle": "A short, factual bug title"
    }
  ]
}

GENERAL REPORTING RULES:

1. Use short, clear, natural English.
2. Preserve every supplied testId exactly.
3. Use testId only as an internal matching reference.
4. Never include test IDs in summaries, bug titles,
   descriptions, or reproduction steps.
5. Never include file paths in user-facing text.
6. Do not invent test results, application behavior,
   expected results, actual results, or reproduction steps.
7. Do not invent the root cause of a failure.
8. Do not provide fixes, solutions, recommendations,
   or application code changes.
9. Do not change the supplied test status.
10. Do not invent test counts.
11. Include one passedSummaries entry for every passed test.
12. Include one failedSummaries entry for every failed
    or timed-out test.
13. Do not classify skipped tests as passed or failed.
14. Do not classify an interrupted test as a confirmed
    application bug unless the evidence establishes one.
15. Do not claim a feature is broken merely because the
    test could not access it.

HUMAN-READABLE LANGUAGE:

Avoid raw technical details such as:
- Stack traces
- Source file paths
- Locator expressions
- Programming code
- Raw error codes
- Internal test runner messages

Explain an error in everyday language only when the
supplied evidence supports that explanation.

Examples:

Technical:
"net::ERR_CONNECTION_TIMED_OUT"

Human-readable:
"The website did not open because the connection
took too long."

Technical:
"Locator was not found within 30000ms."

Human-readable:
"The expected page element was not found within
the allowed time."

Technical:
"Target page, context, or browser was closed."

Human-readable:
"The page closed before the check could finish."

Do not use these examples as facts about a test unless
the corresponding evidence is present.

OVERALL SUMMARY:

- Describe the test execution at a high level.
- Use the supplied results only.
- Do not invent counts or percentages.
- Do not describe an unverified root cause.
- Keep the summary concise.

PASSED TEST SUMMARIES:

- Explain what the test checked successfully.
- Use the test title and available evidence.
- Do not claim additional functionality was verified.
- Do not include technical error details.
- Do not include test IDs or file paths.

FAILED TEST SUMMARIES:

- Describe the observed failure in simple English.
- Explain what could not be verified when appropriate.
- Do not assume the application itself is defective.
- Do not invent the root cause.
- Do not include raw stack traces or file paths.
- Keep the description concise and factual.

BUG TITLES:

Use short, factual, human-readable titles.

Examples:
- "Website did not open"
- "TNRTO link was not found"
- "Helpline section could not be checked"
- "Feedback form could not be opened"
- "Page closed before the check was completed"

Avoid vague titles such as:
- "Test failed"
- "Issue found"
- "Automation error"

Do not use an example unless it matches the supplied
test evidence.

EXPECTED AND ACTUAL RESULTS:

- Use only the supplied test title and evidence.
- Expected behavior must be supported by the evidence.
- Actual behavior must be supported by the evidence.
- If expected behavior is not supported, write exactly:
  "Not specified in test evidence."
- If actual behavior is not supported, write exactly:
  "Not available from test evidence."
- Do not present an assumption as an observed result.

REPRODUCTION STEPS:

- Include only actions supported by the supplied evidence.
- Do not invent navigation steps or user actions.
- Do not turn a test title into a complete sequence of
  steps unless the sequence is supported by evidence.
- If steps cannot be determined, return:
  ["Steps not specified in test evidence."]

SEVERITY AND PRIORITY:

- Do not guess severity or priority.
- Use "Unassigned" unless the supplied evidence
  explicitly provides a value.
- Severity must be one of:
  Critical, High, Medium, Low, Unassigned.
- Priority must be one of:
  High, Medium, Low, Unassigned.

TECHNICAL ERRORS:

- Technical errors are stored separately by the Excel
  report generator.
- Do not copy stack traces, raw error messages, or
  programming expressions into user-facing summaries.
- Explain the failure in simple English only when
  supported by the supplied evidence.

COMPLETENESS:

- Return one passedSummaries item per passed test.
- Return one failedSummaries item per failed or timedOut test.
- Preserve each corresponding testId exactly.
- Do not include skipped tests in either array.
- Do not omit a failed or timed-out test.
- Do not add tests that are absent from the input.

PLAYWRIGHT RESULTS:

${JSON.stringify(input, null, 2)}
`;
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

  const prompt = buildPrompt(testResults);

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