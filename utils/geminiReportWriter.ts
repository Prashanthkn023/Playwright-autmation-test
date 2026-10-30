import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';

export interface AiTestSummary {
  overallSummary: string;
  // One entry for every passed, failed and timed-out test.
  testDetails: Array<{
    testId: string;
    expectedResult: string;
    actualResult: string;
    stepsToReproduce: string[];
  }>;
  passedSummaries: Array<{ testId: string; summary: string }>;
  failedSummaries: Array<{
    testId: string;
    failureSummary: string;
    severity: string;
    priority: string;
    bugTitle: string;
  }>;
}

const AGENT = process.env.GEMINI_AGENT || 'antigravity-preview-09-2026';

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isDailyQuotaExceeded(errorText: string): boolean {
  return /GenerateRequestsPerDayPerModel-FreeTier|generate_content_free_tier_requests|daily.*quota|quota.*per.day/i.test(errorText);
}

function isRetryable(errorText: string): boolean {
  return /503|UNAVAILABLE|high demand|temporarily unavailable/i.test(errorText) ||
    (/429|RESOURCE_EXHAUSTED/i.test(errorText) && !isDailyQuotaExceeded(errorText));
}

function getRetryDelayMs(errorText: string, attempt: number): number {
  const retryMatch = errorText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (retryMatch) return Math.ceil(Number(retryMatch[1]) * 1000) + 1000;
  return attempt === 1 ? 15_000 : 30_000;
}

function extractJson(text: string): AiTestSummary {
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  const parsed = JSON.parse(cleaned) as AiTestSummary;
  if (typeof parsed.overallSummary !== 'string' || !Array.isArray(parsed.testDetails) ||
    !Array.isArray(parsed.passedSummaries) || !Array.isArray(parsed.failedSummaries)) {
    throw new Error('Antigravity response did not match the expected report format.');
  }
  for (const item of parsed.testDetails) {
    if (typeof item.testId !== 'string' || typeof item.expectedResult !== 'string' ||
      typeof item.actualResult !== 'string' || !Array.isArray(item.stepsToReproduce) ||
      !item.stepsToReproduce.every((step: unknown) => typeof step === 'string')) {
      throw new Error('Antigravity returned an invalid test-detail entry.');
    }
  }
  for (const item of parsed.passedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.summary !== 'string') throw new Error('Antigravity returned an invalid passed-test summary.');
  }
  for (const item of parsed.failedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.failureSummary !== 'string' ||
      typeof item.severity !== 'string' || typeof item.priority !== 'string' || typeof item.bugTitle !== 'string') {
      throw new Error('Antigravity returned an invalid failed-test summary.');
    }
  }
  return parsed;
}

function buildPrompt(testResults: TestResult[]): string {
  const input = testResults.map(test => ({
    testId: test.testId,
    title: test.title,
    module: test.module,
    status: test.status,
    durationMs: test.durationMs,
    error: test.error ?? null,
    expectedEvidence: test.expectedEvidence ?? null,
    actualEvidence: test.actualEvidence ?? null,
    comparisonDifferences: test.comparisonDifferences ?? null,
    // These are titles captured from Playwright's step callbacks, not inferred steps.
    recordedExecutionSteps: test.steps ?? [],
  }));

  return `
You are a professional software QA report writer. The report is read by non-technical people, so write in simple, natural English.
Use only the supplied Playwright test data. Return valid JSON only, without Markdown.

Required JSON shape:
{
  "overallSummary": "Concise summary based only on supplied statuses",
  "testDetails": [{
    "testId": "exact supplied testId",
    "expectedResult": "One plain sentence: what should happen",
    "actualResult": "One plain sentence: what happened",
    "stepsToReproduce": ["1. Open the Tamil About Us page.", "2. Go to the Commissioner message.", "3. Check the message shows correctly in Tamil."]
  }],
  "passedSummaries": [{ "testId": "exact supplied testId", "summary": "Very short note, under 12 words" }],
  "failedSummaries": [{
    "testId": "exact supplied testId",
    "failureSummary": "Observed failure in one or two simple sentences",
    "severity": "Unassigned",
    "priority": "Unassigned",
    "bugTitle": "Short factual title, max 12 words"
  }]
}

Rules:
- Preserve testId exactly for internal matching. Never display testId in any text.
- testDetails: one entry for every passed, failed and timedOut test. Do not include skipped or interrupted tests.
- expectedResult: write what should happen, based on the test title and any assertion/expectedEvidence. Example: "The Commissioner message shows correctly in Tamil."
- actualResult for a passed test: one plain sentence saying the expected behaviour was seen. Example: "The Commissioner message was shown correctly in Tamil."
- actualResult for a failed or timedOut test: say plainly what went wrong, using only error, actualEvidence and comparisonDifferences. If they do not say, write exactly "Not available from test evidence.".
- stepsToReproduce: 3 to 5 short numbered steps a person could follow in a browser, each under 15 words.
  If recordedExecutionSteps exist, rewrite them in plain English (for example page.goto becomes "Open the page.", locator.click becomes "Click the button."), keeping the same order and not adding facts.
  If none are recorded, base the steps only on the test title. Do not invent button names, URLs, data values or page names that the title does not mention.
- passedSummaries.summary: a short note such as "Tamil content is fine." or "Content matches.". Include one per passed test.
- failedSummaries: include one per failed or timedOut test. severity and priority must be exactly "Unassigned".
- Do not invent application behaviour, root causes, severity, priority, test counts or percentages.
- Do not recommend fixes or suggest code changes.
- For timeouts, describe only the timeout and what could not be verified; do not claim the application is defective without evidence.
- Avoid technical words such as locator, selector, assertion, timeout error, undefined, null, DOM, stack trace, file paths. Say what a person using the website would see instead.

Playwright results:
${JSON.stringify(input, null, 2)}
`;
}

export async function generateAiTestReport(testResults: TestResult[]): Promise<AiTestSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Locally, add it to the .env file. On Jenkins, bind it as a secret text credential in Build Environment.',
    );
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(testResults);
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Generating QA report with Antigravity (attempt ${attempt}/3)...`);
      const interaction = await ai.interactions.create(
        { agent: AGENT, input: prompt, environment: 'remote' },
        { timeout: 300_000 },
      );
      const responseText = interaction.output_text;
      if (typeof responseText !== 'string' || !responseText.trim()) {
        throw new Error(`Antigravity returned no report text. Status: ${interaction.status}`);
      }
      const report = extractJson(responseText);
      console.log('Antigravity QA report generated successfully.');
      return report;
    } catch (error) {
      lastError = error;
      const message = getErrorText(error);
      if (isDailyQuotaExceeded(message)) {
        throw new Error('Antigravity daily quota exhausted. Check project quota or billing. No further retries were attempted.');
      }
      if (!isRetryable(message) || attempt === 3) break;
      const delayMs = getRetryDelayMs(message, attempt);
      console.warn(`Antigravity attempt ${attempt}/3 failed. Retrying in ${Math.ceil(delayMs / 1000)} seconds.`);
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Antigravity report generation failed: ${getErrorText(lastError)}`);
}