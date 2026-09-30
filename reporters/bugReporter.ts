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

    // Keep reports in the project's existing bug-reports directory.
    const reportDirectory = path.join(this.rootDir, 'bug-reports');

    if (fs.existsSync(reportDirectory)) {
      try {
        fs.rmSync(reportDirectory, { recursive: true, force: true });
      } catch (error) {
        console.warn(
          `Could not clear previous bug reports; existing files may be open. ${String(error)}`,
        );
      }
    }

    fs.mkdirSync(reportDirectory, { recursive: true });

    console.log('\n======================================');
    console.log(' GEMINI QA REPORTER STARTED');
    console.log(' Previous bug reports cleared');
    console.log('======================================\n');
  }

  onTestEnd(test: TestCase, result: PlaywrightTestResult): void {
    const testFile = test.location.file;
    const testCase = test.title;
    const module = this.getModuleName(testFile);
    const browser = test.parent.project()?.name || 'Unknown';
    const error =
      result.status === 'failed' ||
      result.status === 'timedOut' ||
      result.status === 'interrupted'
        ? this.getErrorMessage(result)
        : '';

    const screenshot = result.attachments.find(
      attachment => attachment.name === 'screenshot' && attachment.path,
    )?.path;

    const comparisonDifferences = this.getComparisonDifferences(result);

    // Use a stable, unique ID so Gemini's response can be matched to a test.
    const testId = `${testFile}::${testCase}::${this.allTests.length + 1}`;

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
    const reportDirectory = path.join(this.rootDir, 'bug-reports');
    const outputPath = path.join(
      reportDirectory,
      `Automation_Bug_Report_${Date.now()}.xlsx`,
    );

    const reportResults: ReportTestResult[] = this.allTests.map(test => ({
      testId: test.testId,
      title: test.testCase,
      status: test.status,
      durationMs: test.duration,
      error: test.error || undefined,
      expectedEvidence: test.comparisonDifferences !== 'Not provided.'
        ? test.comparisonDifferences
        : undefined,
      actualEvidence: test.error || undefined,
    }));

    let aiReport = null;
    let aiError: string | undefined;

    console.log('\nGenerating Gemini test summary and descriptions...');

    try {
      // One batched Gemini request for the complete run, rather than one request
      // per failed test. This reduces quota usage and keeps the report consistent.
      aiReport = await generateAiTestReport(reportResults);
      console.log('Gemini report content generated successfully.');
    } catch (error) {
      aiError = error instanceof Error ? error.message : String(error);
      console.error(`Gemini report generation failed: ${aiError}`);
    }

    const reportPath = await generateExcelReport(
      reportResults,
      aiReport,
      outputPath,
      aiError,
    );

    const total = this.allTests.length;
    const passed = this.allTests.filter(test => test.status === 'passed').length;
    const failed = this.allTests.filter(test => test.status === 'failed').length;
    const timedOut = this.allTests.filter(test => test.status === 'timedOut').length;
    const skipped = this.allTests.filter(test => test.status === 'skipped').length;
    const executionTimeMinutes = ((Date.now() - this.startedAt) / 60000).toFixed(2);

    console.log('\n======================================');
    console.log(' PLAYWRIGHT EXCEL REPORT GENERATED');
    console.log('======================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Timed Out: ${timedOut}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Execution Time: ${executionTimeMinutes} minutes`);
    console.log(`Playwright Result: ${result.status}`);
    console.log(`Gemini: ${aiReport ? 'Generated' : 'Unavailable'}`);
    console.log(`Report: ${reportPath}`);
    console.log('======================================\n');
  }

  private normalizeStatus(status: string): TestStatus {
    if (status === 'passed') return 'passed';
    if (status === 'skipped') return 'skipped';
    if (status === 'timedOut') return 'timedOut';

    // Playwright's "interrupted" status is recorded as failed in this report.
    return 'failed';
  }

  private getErrorMessage(result: PlaywrightTestResult): string {
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

    return errors.length ? errors.join('\n') : 'Test failed; no error details were recorded.';
  }

  private getComparisonDifferences(result: PlaywrightTestResult): string {
    const attachment = result.attachments.find(
      item => item.name === 'comparison-differences',
    );

    if (!attachment) return 'Not provided.';

    if (attachment.body) {
      return attachment.body.toString('utf8');
    }

    if (attachment.path && fs.existsSync(attachment.path)) {
      return fs.readFileSync(attachment.path, 'utf8');
    }

    return 'Not provided.';
  }

  private getModuleName(testFile: string): string {
    const fileName = path.basename(testFile, path.extname(testFile));
    const parts = fileName.split('_');

    if (parts.length >= 3) {
      return parts.slice(2).join(' ').replace(/\.spec$/i, '').replace(/spec$/i, '').trim();
    }

    return 'General';
  }
}

export default BugReporter;
