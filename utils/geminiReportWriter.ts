import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';

export interface AiTestSummary {
  overallSummary: string;
  passedSummaries: Array<{ testId: string; summary: string }>;
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
  if (typeof parsed.overallSummary !== 'string' || !Array.isArray(parsed.passedSummaries) || !Array.isArray(parsed.failedSummaries)) {
    throw new Error('Antigravity response did not match the expected report format.');
  }
  for (const item of parsed.passedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.summary !== 'string') throw new Error('Antigravity returned an invalid passed-test summary.');
  }
  for (const item of parsed.failedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.failureSummary !== 'string' ||
      typeof item.expectedResult !== 'string' || typeof item.actualResult !== 'string' ||
      !Array.isArray(item.stepsToReproduce) || !item.stepsToReproduce.every((step: unknown) => typeof step === 'string') ||
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
You are a professional software QA report writer. Write in simple, natural English.
Use only the supplied Playwright test data. Return valid JSON only, without Markdown.

Required JSON shape:
{
  "overallSummary": "Concise summary based only on supplied statuses",
  "passedSummaries": [{ "testId": "exact supplied testId", "summary": "What was verified, limited to the evidence" }],
  "failedSummaries": [{
    "testId": "exact supplied testId",
    "failureSummary": "Observed failure in simple English",
    "expectedResult": "Expected behavior supported by assertion/evidence, otherwise Not specified in test evidence.",
    "actualResult": "Observed result supported by evidence, otherwise Not available from test evidence.",
    "stepsToReproduce": ["Only steps present in recordedExecutionSteps"],
    "severity": "Unassigned",
    "priority": "Unassigned",
    "bugTitle": "Short factual title grounded in evidence"
  }]
}

Strict rules:
- Preserve testId exactly for internal matching. Never display testId in summaries or steps.
- Include one passed summary per passed test, and one failure summary per failed/timedOut test.
- Do not include skipped or interrupted tests in either summary array.
- Do not invent application behavior, expected results, actual results, steps, severity, priority, or root causes.
- Expected result must be supported by an explicit assertion or expectedEvidence. If not, write exactly "Not specified in test evidence.".
- Actual result must be supported by error/actualEvidence/comparisonDifferences. If not, write exactly "Not available from test evidence.".
- Steps must come only from recordedExecutionSteps. Do not turn a test title into a sequence. If no recorded steps exist, return ["Steps not specified in test evidence."].
- Do not treat file paths, screenshot/video/trace names, or raw stack traces as user-facing facts.
- Do not recommend fixes or suggest code changes.
- Severity and priority must remain "Unassigned" unless explicitly supplied (they are not supplied here).
- For timeouts, describe only the timeout and what could not be verified; do not assert the application is defective without evidence.
- Do not invent test counts or percentages.

Playwright results:
${JSON.stringify(input, null, 2)}
`;
}

export async function generateAiTestReport(testResults: TestResult[]): Promise<AiTestSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY was not loaded from .env.');

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
