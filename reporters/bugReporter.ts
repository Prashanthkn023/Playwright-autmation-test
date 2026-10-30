import 'dotenv/config';

import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult as PlaywrightTestResult,
  TestStep,
} from '@playwright/test/reporter';
import * as path from 'node:path';
import * as fs from 'node:fs';

import { generateAiTestReport } from '../utils/geminiReportWriter';
import {
  generateExcelReport,
  type TestResult as ReportTestResult,
  type TestStatus,
} from '../utils/excelReportGenerator';

// Change these names if geminiReportWriter.ts reads a different variable.
const AI_KEY_NAMES = ['GEMINI_API_KEY', 'GOOGLE_API_KEY'];
const TIME_ZONE = 'Asia/Kolkata';

interface TestRecord {
  testId: string;
  testCase: string;
  testFile: string;
  module: string;
  browser: string;
  status: TestStatus;
  duration: number;
  error: string;
  screenshot: string;
  video: string;
  trace: string;
  timestamp: string;
  comparisonDifferences: string;
  steps: string[];
}

class BugReporter implements Reporter {
  private allTests: TestRecord[] = [];
  private rootDir = '';
  private startedAt = 0;
  private activeSteps = new Map<string, string[]>();

  onBegin(config: FullConfig): void {
    this.rootDir = config.rootDir;
    this.startedAt = Date.now();
    this.allTests = [];
    this.activeSteps.clear();

    // Clear old reports so only the newest Excel file is emailed.
    const reportDirectory = path.join(this.rootDir, 'bug-reports');
    if (fs.existsSync(reportDirectory)) {
      try {
        fs.rmSync(reportDirectory, { recursive: true, force: true });
      } catch (error) {
        console.warn(
          'Could not clear previous bug reports. Close open Excel reports and try again. ' +
            String(error),
        );
      }
    }
    fs.mkdirSync(reportDirectory, { recursive: true });

    console.log('\n======================================');
    console.log('       QA REPORTER STARTED');
    console.log('======================================');
    if (!AI_KEY_NAMES.some(name => process.env[name])) {
      console.warn(
        `WARNING: AI key not found (${AI_KEY_NAMES.join(' / ')}). ` +
          'The Excel will be created without AI summaries. On Jenkins, bind the key as a secret text credential.',
      );
    }
    console.log('Collecting Playwright results and execution steps...\n');
  }

  onStepEnd(
    test: TestCase,
    result: PlaywrightTestResult,
    step: TestStep,
  ): void {
    // Capture actual Playwright/test.step actions, not a generated step sequence.
    if (step.category === 'fixture' || step.category === 'hook') return;
    const title = step.title?.trim();
    if (!title) return;

    const key = this.stepKey(test, result);
    const steps = this.activeSteps.get(key) ?? [];
    const detail = step.error?.message
      ? `${title} [failed: ${this.firstLine(step.error.message)}]`
      : title;
    if (steps[steps.length - 1] !== detail) steps.push(detail);
    this.activeSteps.set(key, steps);
  }

  onTestEnd(test: TestCase, result: PlaywrightTestResult): void {
    const testFile = test.location.file;
    const testCase = test.title;
    const module = this.getModuleName(testFile);
    const browser = test.parent.project()?.name || 'Unknown';
    const error = this.isFailure(result.status)
      ? this.getErrorMessage(result)
      : '';

    const findAttachment = (names: string[]): string => {
      const attachment = result.attachments.find(item =>
        names.some(name => item.name.toLowerCase().includes(name)),
      );
      return attachment?.path && fs.existsSync(attachment.path)
        ? attachment.path
        : 'Not available';
    };

    const screenshot = findAttachment(['screenshot']);
    const video = findAttachment(['video']);
    const trace = findAttachment(['trace']);
    const comparisonDifferences = this.getComparisonDifferences(result);
    const steps = this.activeSteps.get(this.stepKey(test, result)) ?? [];

    const testId = [test.id, `retry-${result.retry}`, this.allTests.length + 1].join('::');
    this.allTests.push({
      testId,
      testCase,
      testFile,
      module,
      browser,
      status: this.normalizeStatus(result.status),
      duration: result.duration,
      error,
      screenshot,
      video,
      trace,
      // Test start time in IST, e.g. "30/10/2026, 12:16:45 pm" (same as the old report).
      timestamp: this.formatDate(result.startTime),
      comparisonDifferences,
      steps,
    });
    this.activeSteps.delete(this.stepKey(test, result));
  }

  async onEnd(result: FullResult): Promise<void> {
    const reportDirectory = path.join(this.rootDir, 'bug-reports');
    fs.mkdirSync(reportDirectory, { recursive: true });
    const outputPath = path.join(
      reportDirectory,
      `Automation_Bug_Report_${this.getTimestamp()}.xlsx`,
    );

    const reportResults: ReportTestResult[] = this.allTests.map(test => ({
      testId: test.testId,
      title: test.testCase,
      status: test.status,
      durationMs: test.duration,
      error: test.error || undefined,
      // Only pass an expected value when the captured assertion explicitly provides one.
      expectedEvidence: this.extractExpectedEvidence(test.error, test.comparisonDifferences),
      actualEvidence: [test.error, test.comparisonDifferences !== 'Not provided.' ? test.comparisonDifferences : '']
        .filter(Boolean)
        .join('\n'),
      module: test.module,
      browser: test.browser,
      timestamp: test.timestamp,
      steps: test.steps,
      screenshot: test.screenshot,
      video: test.video,
      trace: test.trace,
      comparisonDifferences: test.comparisonDifferences,
    }));

    let aiReport = null;
    let aiError: string | undefined;
    console.log('\n======================================');
    console.log('       GENERATING QA REPORT');
    console.log('======================================');

    try {
      console.log('Generating AI summaries from captured evidence...');
      aiReport = await generateAiTestReport(reportResults);
      console.log('AI summaries generated successfully.');
    } catch (error) {
      aiError = error instanceof Error ? error.message : String(error);
      // Show the real reason (wrong key, no internet, quota...) in the Jenkins console.
      console.error('AI report generation failed: ' + aiError);
      console.error('Excel will retain the recorded Playwright evidence.');
    }

    try {
      const reportPath = await generateExcelReport(reportResults, aiReport, outputPath, aiError);
      this.printFinalSummary(result, reportPath, Boolean(aiReport));
    } catch (error) {
      console.error('Excel report generation failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private stepKey(test: TestCase, result: PlaywrightTestResult): string {
    return `${test.id}::${result.retry}`;
  }

  private extractExpectedEvidence(error: string, differences: string): string | undefined {
    const text = [error, differences !== 'Not provided.' ? differences : ''].filter(Boolean).join('\n');
    if (!text) return undefined;
    const lines = text.split(/\r?\n/);
    const expectedLines: string[] = [];
    let capturing = false;
    for (const line of lines) {
      if (/^\s*Expected\s*:/i.test(line) || /^\s*Expected value/i.test(line)) {
        capturing = true;
        expectedLines.push(line.trim());
        continue;
      }
      if (/^\s*(Received|Actual)\s*:/i.test(line)) capturing = false;
      if (capturing && line.trim()) expectedLines.push(line.trim());
    }
    return expectedLines.length ? expectedLines.join('\n') : undefined;
  }

  private printFinalSummary(result: FullResult, reportPath: string, aiGenerated: boolean): void {
    const total = this.allTests.length;
    const passed = this.countStatus('passed');
    const failed = this.countStatus('failed');
    const timedOut = this.countStatus('timedOut');
    const skipped = this.countStatus('skipped');
    const executionTimeMinutes = ((Date.now() - this.startedAt) / 60000).toFixed(2);

    console.log('\n======================================');
    console.log('       QA EXECUTION SUMMARY');
    console.log('======================================');
    console.log(`Total Tests       : ${total}`);
    console.log(`Passed            : ${passed}`);
    console.log(`Failed            : ${failed}`);
    console.log(`Timed Out         : ${timedOut}`);
    console.log(`Skipped           : ${skipped}`);
    console.log(`Execution Time    : ${executionTimeMinutes} minutes`);
    console.log(`Playwright Result : ${result.status}`);
    console.log(`AI Report         : ${aiGenerated ? 'Generated' : 'Unavailable'}`);
    console.log('\nExcel Report:');
    console.log(reportPath);
    console.log('======================================\n');
  }

  private countStatus(status: TestStatus): number {
    return this.allTests.filter(test => test.status === status).length;
  }

  private isFailure(status: string): boolean {
    return status === 'failed' || status === 'timedOut' || status === 'interrupted';
  }

  private normalizeStatus(status: string): TestStatus {
    if (status === 'passed') return 'passed';
    if (status === 'skipped') return 'skipped';
    if (status === 'timedOut') return 'timedOut';
    return 'failed';
  }

  private getErrorMessage(result: PlaywrightTestResult): string {
    const errors: string[] = [];
    if (result.error?.message) errors.push(result.error.message);
    for (const error of result.errors ?? []) {
      const message = error.message || error.value || '';
      if (message && !errors.includes(message)) errors.push(message);
    }
    return errors.length ? errors.join('\n') : 'Test failed; no error details were recorded.';
  }

  private getComparisonDifferences(result: PlaywrightTestResult): string {
    const attachment = result.attachments.find(item => item.name === 'comparison-differences');
    if (!attachment) return 'Not provided.';
    if (attachment.body) return attachment.body.toString('utf8');
    if (attachment.path && fs.existsSync(attachment.path)) {
      try { return fs.readFileSync(attachment.path, 'utf8'); } catch { return 'Not provided.'; }
    }
    return 'Not provided.';
  }

  private getModuleName(testFile: string): string {
    const fileName = path.basename(testFile, path.extname(testFile));
    const withoutPrefix = fileName.replace(/^TC[_-]?\d+[_-]?/i, '');
    const readable = withoutPrefix
      .replace(/\.spec$/i, '')
      .replace(/spec$/i, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();
    return readable || 'General';
  }

  private firstLine(value: string): string {
    return value.split(/\r?\n/)[0].trim();
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('en-IN', { timeZone: TIME_ZONE });
  }

  // File name timestamp in IST (same on your laptop and on Jenkins): 20261030_121645
  private getTimestamp(): string {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
  }
}

export default BugReporter;