import 'dotenv/config';
import type { TestResult } from './excelReportGenerator';
import type { AiTestSummary } from './geminiReportWriter';

const MODEL = 'openai/gpt-oss-20b';

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryable(errorText: string): boolean {
  return /503|UNAVAILABLE|high demand|temporarily unavailable|timeout|network|429|RESOURCE_EXHAUSTED/i.test(errorText);
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
  const parsed = JSON.parse(cleaned) as AiTestSummary;

  // Validate ID consistency: every ID in the response must belong to this batch
  const allIds = [
    ...parsed.testDetails.map(d => d.testId),
    ...parsed.passedSummaries.map(p => p.testId),
    ...parsed.failedSummaries.map(f => f.testId)
  ];

  for (const id of allIds) {
    if (!chunkIds.has(id)) {
      throw new Error(`AI response included test ID '${id}' which does not belong to this batch.`);
    }
  }

  return parsed;
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
    err: test.error ? test.error.substring(0, 200) : null,
    exp: test.expectedEvidence ? test.expectedEvidence.substring(0, 200) : null,
    act: test.actualEvidence ? test.actualEvidence.substring(0, 200) : null,
    diff: test.comparisonDifferences ? test.comparisonDifferences.substring(0, 200) : null,
  }));

  return `
You are an expert Lead QA Engineer. Analyze these test execution results and generate professional manual QA documentation in JSON format.

CRITICAL INSTRUCTIONS:
1. Explain what functional business capability was tested based on the test title and module.
2. Derive expected results from assertions/evidence (or "Evidence unavailable." if none).
3. Describe actual results based on recorded error/evidence (or "Test passed successfully." if passed).
4. Generate meaningful numbered functional manual testing steps (e.g., "1. Navigate to module", "2. Verify element renders"). DO NOT include internal automation script operations (such as browser launch, context creation, wait for timeout, or press Escape).
5. Use the exact 'id' from input as 'testId' in output. Do not invent functionality or bugs.

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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey });

  const chunks = chunkArray(testResults, 5);
  const allSummaries: AiTestSummary[] = [];

  for (const chunk of chunks) {
    const chunkIds = new Set(chunk.map(t => t.testId));
    let batchSuccess = false;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Processing batch of ${chunk.length} tests with Groq (attempt ${attempt}/2)...`);
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: buildPrompt(chunk) }],
          model: MODEL,
          response_format: { type: 'json_object' },
        }, { timeout: 60000 });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error('Groq returned empty response');

        allSummaries.push(extractJson(responseText, chunkIds));
        batchSuccess = true;
        break;
      } catch (error) {
        const errText = getErrorText(error);
        console.warn(`Batch processing failed: ${errText}`);
        if (!isRetryable(errText) || attempt === 2) {
          console.warn('Batch failed. Using fallback entry.');
          allSummaries.push({
            overallSummary: 'AI generation unavailable: ' + errText,
            testDetails: [],
            passedSummaries: [],
            failedSummaries: []
          });
          batchSuccess = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
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
      finalDetails.push(detail);
    } else {
      finalDetails.push({
        testId: test.testId,
        expectedResult: "Evidence unavailable.",
        actualResult: test.error || "Evidence unavailable.",
        stepsToReproduce: ["Evidence unavailable."]
      });
    }

    if (test.status === 'passed') {
      const summary = aggregated.passedSummaries.find(p => p.testId === test.testId);
      finalPassed.push(summary || { testId: test.testId, summary: "Evidence unavailable." });
    } else if (test.status === 'failed' || test.status === 'timedOut') {
      const fail = aggregated.failedSummaries.find(f => f.testId === test.testId);
      finalFailed.push(fail || {
        testId: test.testId,
        bugTitle: test.title,
        failureSummary: test.error || "Evidence unavailable.",
        severity: "Unassigned",
        priority: "Unassigned"
      });
    }
  }

  return {
    overallSummary: aggregated.overallSummary,
    testDetails: finalDetails,
    passedSummaries: finalPassed,
    failedSummaries: finalFailed
  };
}
