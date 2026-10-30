import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';
import type { AiTestSummary } from './geminiReportWriter';

const MODEL = 'openai/gpt-oss-20b';

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isDailyQuotaExceeded(errorText: string): boolean {
  return /quota|rate limit|429/i.test(errorText);
}

function isRetryable(errorText: string): boolean {
  return /503|UNAVAILABLE|high demand|temporarily unavailable|timeout|network/i.test(errorText) ||
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
    throw new Error('Groq response did not match the expected report format.');
  }
  for (const item of parsed.testDetails) {
    if (typeof item.testId !== 'string' || typeof item.expectedResult !== 'string' ||
      typeof item.actualResult !== 'string' || !Array.isArray(item.stepsToReproduce) ||
      !item.stepsToReproduce.every((step: unknown) => typeof step === 'string')) {
      throw new Error('Groq returned an invalid test-detail entry.');
    }
  }
  for (const item of parsed.passedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.summary !== 'string') throw new Error('Groq returned an invalid passed-test summary.');
  }
  for (const item of parsed.failedSummaries) {
    if (typeof item.testId !== 'string' || typeof item.failureSummary !== 'string' ||
      typeof item.severity !== 'string' || typeof item.priority !== 'string' || typeof item.bugTitle !== 'string') {
      throw new Error('Groq returned an invalid failed-test summary.');
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
    recordedExecutionSteps: test.steps ?? [],
  }));

  return `
You are an expert software QA engineer writing a formal test execution report for stakeholders and developers.
The report is read by non-technical people, so write in simple, natural, and professional English.

Use ONLY the supplied Playwright test data. If evidence is missing, state "Evidence unavailable." instead of guessing. Return valid JSON only.

Required JSON shape:
{
  "overallSummary": "Professional summary of the test run, mentioning high-level outcomes and key areas tested.",
  "testDetails": [{
    "testId": "exact supplied testId",
    "expectedResult": "Clear, plain English sentence describing the expected functionality based on the test case requirements.",
    "actualResult": "Clear, plain English sentence describing the actual outcome, referencing behavior, text, or visual components observed.",
    "stepsToReproduce": ["1. Open the website.", "2. Navigate to the module.", "3. Perform actions.", "4. Verify the result."]
  }],
  "passedSummaries": [{ "testId": "exact supplied testId", "summary": "Meaningful summary of the verified functionality (e.g., 'Verified home page slider images load correctly with navigation arrows.')" }],
  "failedSummaries": [{
    "testId": "exact supplied testId",
    "failureSummary": "Clear, professional description of the bug, emphasizing user impact.",
    "severity": "Unassigned",
    "priority": "Unassigned",
    "bugTitle": "Factual, descriptive bug title."
  }]
}

Rules:
- Preserve testId exactly for internal matching.
- testDetails: Include all passed, failed, and timedOut tests.
- stepsToReproduce: Rewrite recorded execution steps into simple, numbered, human-readable manual testing steps. Do not invent steps.
- For passed tests, generate a meaningful summary explaining what was verified.
- For failed tests, provide developer-friendly context including the error message (but keep it simple).
- Do not use technical jargon (e.g., locator, selector, DOM). Describe user-visible behavior.
- Do not invent bugs or assume causes. Report only the evidence.

Playwright results:
${JSON.stringify(input, null, 2)}
`;
}

export async function generateAiTestReport(testResults: TestResult[]): Promise<AiTestSummary> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Locally, add it to the .env file. On Jenkins, bind it as a secret text credential in Build Environment.',
    );
  }

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey });
  const prompt = buildPrompt(testResults);
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`Generating QA report with Groq (attempt ${attempt}/2)...`);
      const startTime = Date.now();
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        response_format: { type: 'json_object' },
      }, {
        timeout: 60000, // 60 seconds timeout
      });
      const durationMs = Date.now() - startTime;
      const responseText = completion.choices[0]?.message?.content;
      if (typeof responseText !== 'string' || !responseText.trim()) {
        throw new Error('Groq returned no report text.');
      }
      const report = extractJson(responseText);
      const usage = completion.usage;
      console.log(`Groq QA report generated successfully in ${durationMs}ms. Tokens used: ${usage?.total_tokens ?? 'unknown'} (Prompt: ${usage?.prompt_tokens ?? 'unknown'}, Completion: ${usage?.completion_tokens ?? 'unknown'}).`);
      return report;
    } catch (error) {
      lastError = error;
      const message = getErrorText(error);
      if (isDailyQuotaExceeded(message)) {
        throw new Error('Groq daily quota or rate limit exhausted. Check project quota or billing. No further retries were attempted.');
      }
      if (!isRetryable(message) || attempt === 2) break;
      const delayMs = getRetryDelayMs(message, attempt);
      console.warn(`Groq attempt ${attempt}/2 failed. Retrying in ${Math.ceil(delayMs / 1000)} seconds.`);
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Groq report generation failed: ${getErrorText(lastError)}`);
}
