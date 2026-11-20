import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';
import type { AiTestSummary } from './geminiReportWriter';

const MODEL = 'openai/gpt-oss-20b';

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryable(errorText: string): boolean {
  return /503|UNAVAILABLE|high demand|temporarily unavailable|timeout|network|429|RESOURCE_EXHAUSTED|json_validate_failed/i.test(errorText);
}

function inferExpectedResult(title: string, module: string): string {
  const text = `${title} ${module}`.toLowerCase();
  if (/helpline/i.test(text)) {
    return 'The Helpline section should display the configured emergency contact numbers correctly.';
  }
  if (/tamil|content|text|faq|link|footer/i.test(text)) {
    return 'The content and text elements should display correct regional language text and formatting.';
  }
  if (/api|performance|endpoint/i.test(text)) {
    return 'The API endpoint should return status 200 with a valid JSON response within performance thresholds.';
  }
  if (/login|auth|session|forgot|password|negative|corner/i.test(text)) {
    return 'The authentication or form interaction should validate correctly and maintain expected state without errors.';
  }
  return `The feature or validation step for '${title}' in module '${module || 'General'}' should execute and verify successfully without unexpected failures.`;
}

function extractJson(text: string, chunkIds: Set<string>): AiTestSummary {
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI JSON response: ${getErrorText(e)}. Response text: ${cleaned.substring(0, 100)}`);
  }

  const testDetails = (Array.isArray(parsed.testDetails) ? parsed.testDetails : [])
    .filter((d: any) => d.testId && chunkIds.has(d.testId));
  const passedSummaries = (Array.isArray(parsed.passedSummaries) ? parsed.passedSummaries : [])
    .filter((p: any) => p.testId && chunkIds.has(p.testId));
  const failedSummaries = (Array.isArray(parsed.failedSummaries) ? parsed.failedSummaries : [])
    .filter((f: any) => f.testId && chunkIds.has(f.testId));

  return {
    overallSummary: typeof parsed.overallSummary === 'string' ? parsed.overallSummary : 'Batch processed successfully.',
    testDetails,
    passedSummaries,
    failedSummaries,
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

function buildPrompt(testResults: TestResult[]): string {
  const input = testResults.map(test => ({
    id: test.testId,
    title: test.title,
    mod: test.module,
    stat: test.status,
    err: test.error ? test.error.substring(0, 150) : null,
  }));

  return `
Analyze these test execution results and generate JSON format QA documentation.

Required JSON shape:
{
  "overallSummary": "Summary of this batch",
  "testDetails": [{"testId": "id", "expectedResult": "exp", "actualResult": "act", "stepsToReproduce": ["1. ..."]}],
  "passedSummaries": [{"testId": "id", "summary": "sum"}],
  "failedSummaries": [{"testId": "id", "failureSummary": "sum", "severity": "Unassigned", "priority": "Unassigned", "bugTitle": "title"}]
}

Playwright results:
${JSON.stringify(input)}
`;
}

export async function generateAiTestReport(testResults: TestResult[]): Promise<AiTestSummary> {
  if (!Array.isArray(testResults) || testResults.length === 0) {
    return { overallSummary: 'No tests to process.', testDetails: [], passedSummaries: [], failedSummaries: [] };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey });

  const chunks = chunkArray(testResults, 2);
  const allSummaries: AiTestSummary[] = [];

  for (const chunk of chunks) {
    const chunkIds = new Set(chunk.map(t => t.testId));

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Processing batch of ${chunk.length} tests with Groq (attempt ${attempt}/2)...`);
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: buildPrompt(chunk) }],
          model: MODEL,
          response_format: { type: 'json_object' },
        }, { timeout: 45000 });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error('Groq returned empty response');

        allSummaries.push(extractJson(responseText, chunkIds));
        break;
      } catch (error) {
        const errText = getErrorText(error);
        console.warn(`Batch processing failed: ${errText}`);
        if (!isRetryable(errText) || attempt === 2) {
          console.warn('Batch failed. Using robust fallback entries for chunk.');
          allSummaries.push({
            overallSummary: 'AI generation unavailable: ' + errText,
            testDetails: [],
            passedSummaries: [],
            failedSummaries: []
          });
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  const aggregated: AiTestSummary = allSummaries.reduce((acc, curr) => ({
    overallSummary: acc.overallSummary ? acc.overallSummary + ' ' + curr.overallSummary : curr.overallSummary,
    testDetails: [...acc.testDetails, ...curr.testDetails],
    passedSummaries: [...acc.passedSummaries, ...curr.passedSummaries],
    failedSummaries: [...acc.failedSummaries, ...curr.failedSummaries],
  }), { overallSummary: '', testDetails: [], passedSummaries: [], failedSummaries: [] });

  const finalDetails: typeof aggregated.testDetails = [];
  const finalPassed: typeof aggregated.passedSummaries = [];
  const finalFailed: typeof aggregated.failedSummaries = [];

  const seenIds = new Set<string>();

  for (const test of testResults) {
    if (seenIds.has(test.testId)) continue;
    seenIds.add(test.testId);

    const detail = aggregated.testDetails.find(d => d.testId === test.testId);
    if (detail) {
      if (!detail.expectedResult || /expected behavior verified successfully/i.test(detail.expectedResult)) {
        detail.expectedResult = inferExpectedResult(test.title, test.module || '');
      }
      finalDetails.push(detail);
    } else {
      // Robust fallback preserving original test IDs, titles, statuses, and actual error messages
      finalDetails.push({
        testId: test.testId,
        expectedResult: inferExpectedResult(test.title, test.module || ''),
        actualResult: test.status === 'skipped' ? 'Test was skipped.' : (test.error || `Test completed with status: ${test.status}`),
        stepsToReproduce: test.steps && test.steps.length > 0 ? test.steps : ["1. Open application", `2. Execute test step for: ${test.title}`]
      });
    }

    // Strict Test Classification (Passed -> passedSummaries only, Failed/TimedOut -> failedSummaries only, Skipped -> neither passed nor failed)
    if (test.status === 'passed') {
      const summary = aggregated.passedSummaries.find(p => p.testId === test.testId);
      finalPassed.push(summary || { testId: test.testId, summary: `Successfully verified: ${test.title}` });
    } else if (test.status === 'failed' || test.status === 'timedOut') {
      const fail = aggregated.failedSummaries.find(f => f.testId === test.testId);
      finalFailed.push(fail || {
        testId: test.testId,
        bugTitle: test.title,
        failureSummary: test.error || `Test execution resulted in status: ${test.status}`,
        severity: "Medium",
        priority: "Medium"
      });
    } else if (test.status === 'skipped') {
      // Skipped tests are recorded in testDetails with explicit status, but never classified as passed or failed.
    }
  }

  return {
    overallSummary: aggregated.overallSummary || `Processed ${testResults.length} test results successfully.`,
    testDetails: finalDetails,
    passedSummaries: finalPassed,
    failedSummaries: finalFailed
  };
}
