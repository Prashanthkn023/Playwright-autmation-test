import 'dotenv/config';

import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult as PlaywrightTestResult,
} from '@playwright/test/reporter';

import * as path from 'node:path';
import * as fs from 'node:fs';

import { generateAiTestReport } from '../utils/geminiReportWriter';

import {
  generateExcelReport,
  type TestResult as ReportTestResult,
  type TestStatus,
} from '../utils/excelReportGenerator';

interface TestRecord {
  // Internal matching reference. Not displayed in Excel.
  testId: string;

  testCase: string;
  testFile: string;
  module: string;
  browser: string;
  status: TestStatus;
  duration: number;
  error: string;
  screenshot: string;
  timestamp: string;
  comparisonDifferences: string;
}

class BugReporter implements Reporter {
  private allTests: TestRecord[] = [];
  private rootDir = '';
  private startedAt = 0;

  onBegin(config: FullConfig): void {
    this.rootDir = config.rootDir;
    this.startedAt = Date.now();
    this.allTests = [];

    const reportDirectory = path.join(
      this.rootDir,
      'bug-reports',
    );

    // Clear previous Excel reports.
    if (fs.existsSync(reportDirectory)) {
      try {
        fs.rmSync(reportDirectory, {
          recursive: true,
          force: true,
        });
      } catch (error) {
        console.warn(
          'Could not clear previous bug reports. ' +
            'Close any open Excel reports and try again. ' +
            String(error),
        );
      }
    }

    fs.mkdirSync(reportDirectory, {
      recursive: true,
    });

    console.log('\n======================================');
    console.log('       QA REPORTER STARTED');
    console.log('======================================');
    console.log('Previous reports cleared.');
    console.log('Collecting Playwright test results...\n');
  }

  onTestEnd(
    test: TestCase,
    result: PlaywrightTestResult,
  ): void {
    const testFile = test.location.file;
    const testCase = test.title;

    const module = this.getModuleName(testFile);
    const browser = test.parent.project()?.name || 'Chromium';

    const error = this.isFailure(result.status)
      ? this.getErrorMessage(result)
      : '';

    const screenshot = result.attachments.find(
      attachment =>
        attachment.name === 'screenshot' &&
        Boolean(attachment.path),
    )?.path;

    const comparisonDifferences =
      this.getComparisonDifferences(result);

    // Keep this only for matching AI summaries to Playwright tests.
    const testId = [
      testFile,
      testCase,
      this.allTests.length + 1,
    ].join('::');

    this.allTests.push({
      testId,
      testCase,
      testFile,
      module,
      browser,
      status: this.normalizeStatus(result.status),
      duration: result.duration,
      error,
      screenshot: screenshot || 'Not available',
      timestamp: new Date().toLocaleString(),
      comparisonDifferences,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const reportDirectory = path.join(
      this.rootDir,
      'bug-reports',
    );

    fs.mkdirSync(reportDirectory, {
      recursive: true,
    });

    const outputPath = path.join(
      reportDirectory,
      `Automation_Bug_Report_${this.getTimestamp()}.xlsx`,
    );

    const reportResults: ReportTestResult[] =
      this.allTests.map(test => ({
        testId: test.testId,
        title: test.testCase,
        status: test.status,
        durationMs: test.duration,

        error: test.error || undefined,

        expectedEvidence:
          test.comparisonDifferences !== 'Not provided.'
            ? test.comparisonDifferences
            : undefined,

        actualEvidence: test.error || undefined,

        module: test.module,
        browser: test.browser,
        timestamp: test.timestamp,
      }));

    let aiReport = null;
    let aiError: string | undefined;

    console.log('\n======================================');
    console.log('       GENERATING QA REPORT');
    console.log('======================================');

    try {
      console.log('Generating AI summaries...');

      aiReport = await generateAiTestReport(reportResults);

      console.log('AI summaries generated successfully.');
    } catch (error) {
      aiError =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        'AI report generation failed. ' +
          'The Excel report will still be generated.',
      );
    }

    let reportPath: string;

    try {
      reportPath = await generateExcelReport(
        reportResults,
        aiReport,
        outputPath,
        aiError,
      );
    } catch (error) {
      console.error(
        'Excel report generation failed:',
        error,
      );

      throw error;
    }

    this.printFinalSummary(result, reportPath, Boolean(aiReport));
  }

  private printFinalSummary(
    result: FullResult,
    reportPath: string,
    aiGenerated: boolean,
  ): void {
    const total = this.allTests.length;

    const passed = this.countStatus('passed');
    const failed = this.countStatus('failed');
    const timedOut = this.countStatus('timedOut');
    const skipped = this.countStatus('skipped');

    const executionTimeMinutes = (
      (Date.now() - this.startedAt) /
      60000
    ).toFixed(2);

    console.log('\n======================================');
    console.log('       QA EXECUTION SUMMARY');
    console.log('======================================');

    console.log(`Total Tests       : ${total}`);
    console.log(`Passed            : ${passed}`);
    console.log(`Failed            : ${failed}`);
    console.log(`Timed Out         : ${timedOut}`);
    console.log(`Skipped           : ${skipped}`);

    console.log(
      `Execution Time    : ${executionTimeMinutes} minutes`,
    );

    console.log(`Playwright Result : ${result.status}`);
    console.log(
      `AI Report         : ${aiGenerated ? 'Generated' : 'Unavailable'}`,
    );

    console.log('\nExcel Report:');
    console.log(reportPath);

    console.log('======================================\n');
  }

  private countStatus(status: TestStatus): number {
    return this.allTests.filter(
      test => test.status === status,
    ).length;
  }

  private isFailure(status: string): boolean {
    return (
      status === 'failed' ||
      status === 'timedOut' ||
      status === 'interrupted'
    );
  }

  private normalizeStatus(status: string): TestStatus {
    if (status === 'passed') {
      return 'passed';
    }

    if (status === 'skipped') {
      return 'skipped';
    }

    if (status === 'timedOut') {
      return 'timedOut';
    }

    return 'failed';
  }

  private getErrorMessage(
    result: PlaywrightTestResult,
  ): string {
    const errors: string[] = [];

    if (result.error?.message) {
      errors.push(result.error.message);
    }

    for (const error of result.errors ?? []) {
      const message = error.message || error.value || '';

      if (message && !errors.includes(message)) {
        errors.push(message);
      }
    }

    return errors.length
      ? errors.join('\n')
      : 'Test failed; no error details were recorded.';
  }

  private getComparisonDifferences(
    result: PlaywrightTestResult,
  ): string {
    const attachment = result.attachments.find(
      item => item.name === 'comparison-differences',
    );

    if (!attachment) {
      return 'Not provided.';
    }

    if (attachment.body) {
      return attachment.body.toString('utf8');
    }

    if (
      attachment.path &&
      fs.existsSync(attachment.path)
    ) {
      try {
        return fs.readFileSync(
          attachment.path,
          'utf8',
        );
      } catch {
        return 'Not provided.';
      }
    }

    return 'Not provided.';
  }

  private getModuleName(testFile: string): string {
    const fileName = path.basename(
      testFile,
      path.extname(testFile),
    );

    // Example:
    // TC_003_Complaint.spec.ts -> Complaint
    // CmsABT.spec.ts -> CmsABT
    const withoutPrefix = fileName.replace(
      /^TC[_-]?\d+[_-]?/i,
      '',
    );

    const withoutSuffix = withoutPrefix
      .replace(/\.spec$/i, '')
      .replace(/spec$/i, '');

    const readable = withoutSuffix
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    return readable || 'General';
  }

  private getTimestamp(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}

export default BugReporter;