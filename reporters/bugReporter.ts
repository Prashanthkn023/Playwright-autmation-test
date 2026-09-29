import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import ExcelJS from 'exceljs';

import * as path from 'path';
import * as fs from 'fs';

interface TestRecord {
  testCase: string;
  testFile: string;
  module: string;
  browser: string;
  status: string;
  duration: number;
  error: string;
  screenshot: string;
  timestamp: string;
}

interface FailedTest {
  bugId: string;
  bugTitle: string;
  module: string;
  testCase: string;
  testFile: string;
  browser: string;
  status: string;
  error: string;
  expectedResult: string;
  actualResult: string;
  comparisonDifferences: string;
  severity: string;
  priority: string;
  duration: number;
  screenshot: string;
  timestamp: string;
}

class BugReporter implements Reporter {
  private allTests: TestRecord[] = [];
  private failedTests: FailedTest[] = [];
  private rootDir = '';
  private startedAt = 0;

  // ==========================================
  // START REPORTER
  // ==========================================

  onBegin(config: FullConfig): void {
    this.rootDir = config.rootDir;
    this.startedAt = Date.now();
    this.allTests = [];
    this.failedTests = [];

    const bugReportDir = path.join(
      this.rootDir,
      'bug-reports'
    );

    // Remove previous report directory
    if (fs.existsSync(bugReportDir)) {
      try {
        fs.rmSync(bugReportDir, {
          recursive: true,
          force: true,
        });
      } catch (error) {
        console.warn(
          `Could not clear previous bug reports; existing files may be open. ${error}`
        );
      }
    }

    // Create fresh directory
    fs.mkdirSync(bugReportDir, {
      recursive: true,
    });

    console.log(
      '\n======================================'
    );

    console.log(
      ' BUG REPORTER STARTED'
    );

    console.log(
      ' Previous bug reports cleared'
    );

    console.log(
      '======================================\n'
    );
  }

  // ==========================================
  // PROCESS FAILED TEST
  // ==========================================

  onTestEnd(
    test: TestCase,
    result: TestResult
  ): void {
    // Record every test result, including passed and skipped tests.
    const testFile = test.location.file;
    const module = this.getModuleName(testFile);
    const browser = test.parent.project()?.name || 'Unknown';
    const errorMessage =
      result.status === 'failed' || result.status === 'timedOut'
        ? this.getErrorMessage(result)
        : '';

    let screenshotPath = '';
    for (const attachment of result.attachments) {
      if (attachment.name === 'screenshot' && attachment.path) {
        screenshotPath = attachment.path;
        break;
      }
    }

    this.allTests.push({
      testCase: test.title,
      testFile,
      module,
      browser,
      status: result.status,
      duration: result.duration,
      error: errorMessage,
      screenshot: screenshotPath || 'Not available',
      timestamp: new Date().toLocaleString(),
    });

    // The detailed Bug Report sheet contains only failures/timeouts.
    if (
      result.status !== 'failed' &&
      result.status !== 'timedOut'
    ) {
      return;
    }

    const expectedResult =
      this.getExpectedResult(
        errorMessage,
        result.status
      );

    const actualResult =
      this.getActualResult(
        errorMessage,
        result.status
      );

    const comparisonDifferences =
      this.getComparisonDifferences(result);

    const bugId =
      `BUG-${String(
        this.failedTests.length + 1
      ).padStart(3, '0')}`;

    const bugTitle =
      `${test.title} failed`;

    // ==========================================
    // JENKINS DEBUG
    // ==========================================

    console.log(
      '\n========== BUG REPORT DEBUG =========='
    );

    console.log(
      `Bug ID: ${bugId}`
    );

    console.log(
      `Test: ${test.title}`
    );

    console.log(
      `Status: ${result.status}`
    );

    console.log(
      `Expected Result: ${expectedResult}`
    );

    console.log(
      `Actual Result: ${actualResult}`
    );

    console.log(
      `Comparison Differences: ${comparisonDifferences}`
    );

    console.log(
      '======================================\n'
    );

    this.failedTests.push({
      bugId,
      bugTitle,
      module,
      testCase: test.title,
      testFile,

      browser,

      status:
        result.status,

      error:
        errorMessage,

      expectedResult,

      actualResult,

      comparisonDifferences,

      severity:
        'Medium',

      priority:
        'Medium',

      duration:
        result.duration,

      screenshot: screenshotPath || 'Screenshot not available',

      timestamp:
        new Date().toLocaleString(),
    });
  }

  // ==========================================
  // GET COMPLETE ERROR MESSAGE
  // ==========================================

  private getErrorMessage(
    result: TestResult
  ): string {
    const errors: string[] = [];

    if (result.error?.message) {
      errors.push(
        result.error.message
      );
    }

    if (
      result.errors &&
      result.errors.length > 0
    ) {
      for (const error of result.errors) {
        const message =
          error.message ||
          error.value ||
          '';

        if (
          message &&
          !errors.includes(message)
        ) {
          errors.push(message);
        }
      }
    }

    if (errors.length === 0) {
      return 'Test failed';
    }

    return errors.join('\n');
  }

  // ==========================================
  // GET EXPECTED RESULT
  // ==========================================

  private getExpectedResult(
    errorMessage: string,
    status: string
  ): string {
    // ------------------------------------------
    // 1. PLAYWRIGHT EXPLICIT EXPECTED VALUE
    //
    // Expected: visible
    // Expected: "Success"
    // ------------------------------------------

    const expectedMatch =
      errorMessage.match(
        /^\s*Expected:\s*(.+)$/im
      );

    if (expectedMatch?.[1]) {
      return expectedMatch[1].trim();
    }

    // ------------------------------------------
    // 2. ENVIRONMENT VARIABLE
    //
    // CMS_MODULE_URL is missing in .env
    // ------------------------------------------

    const envMatch =
      errorMessage.match(
        /([A-Z][A-Z0-9_]+)\s+is missing in\s+\.env/i
      );

    if (envMatch?.[1]) {
      return (
        `${envMatch[1]} should be configured ` +
        'in the .env file.'
      );
    }

    // ------------------------------------------
    // 3. GET EXPECTATION FROM CALL LOG
    // ------------------------------------------

    const callLog =
      this.getCallLog(errorMessage);

    if (callLog) {
      const expectedFromCallLog =
        this.getExpectedFromCallLog(
          callLog
        );

      if (expectedFromCallLog) {
        return expectedFromCallLog;
      }
    }

    // ------------------------------------------
    // 4. PLAYWRIGHT ASSERTIONS
    // ------------------------------------------

    if (/toBeVisible/i.test(errorMessage)) {
      return 'Element should be visible.';
    }

    if (/toBeHidden/i.test(errorMessage)) {
      return 'Element should be hidden.';
    }

    if (/toBeEnabled/i.test(errorMessage)) {
      return 'Element should be enabled.';
    }

    if (/toBeDisabled/i.test(errorMessage)) {
      return 'Element should be disabled.';
    }

    if (/toBeChecked/i.test(errorMessage)) {
      return 'Checkbox should be checked.';
    }

    if (/toBeUnchecked/i.test(errorMessage)) {
      return 'Checkbox should be unchecked.';
    }

    if (/toHaveText/i.test(errorMessage)) {
      return (
        'Element text should match ' +
        'the expected value.'
      );
    }

    if (/toContainText/i.test(errorMessage)) {
      return (
        'Element should contain ' +
        'the expected text.'
      );
    }

    if (/toHaveValue/i.test(errorMessage)) {
      return (
        'Element value should match ' +
        'the expected value.'
      );
    }

    if (/toHaveURL/i.test(errorMessage)) {
      return (
        'Page URL should match ' +
        'the expected URL.'
      );
    }

    if (/toHaveTitle/i.test(errorMessage)) {
      return (
        'Page title should match ' +
        'the expected title.'
      );
    }

    // ------------------------------------------
    // 5. TIMEOUT
    // ------------------------------------------

    if (
      status === 'timedOut' ||
      /\btimeout\b/i.test(errorMessage) ||
      /\btimed out\b/i.test(errorMessage)
    ) {
      return (
        'Test should complete successfully ' +
        'within the configured timeout.'
      );
    }

    // ------------------------------------------
    // DEFAULT
    // ------------------------------------------

    return (
      'Test should execute successfully ' +
      'without errors.'
    );
  }

  // ==========================================
  // GENERATE EXPECTED RESULT FROM CALL LOG
  // ==========================================

  private getExpectedFromCallLog(
    callLog: string
  ): string {
    const normalizedCallLog =
      callLog
        .replace(/\s+/g, ' ')
        .trim();

    // ------------------------------------------
    // PROCESSING API RESPONSE
    // ------------------------------------------

    if (
      /processing api response/i.test(
        normalizedCallLog
      )
    ) {
      return (
        'API response should be processed ' +
        'successfully.'
      );
    }

    // ------------------------------------------
    // WAITING FOR API RESPONSE
    // ------------------------------------------

    if (
      /waiting for response/i.test(
        normalizedCallLog
      )
    ) {
      return (
        'Expected API response should be ' +
        'received successfully.'
      );
    }

    // ------------------------------------------
    // WAITING FOR NAVIGATION
    // ------------------------------------------

    if (
      /waiting for navigation/i.test(
        normalizedCallLog
      )
    ) {
      return (
        'Page navigation should complete ' +
        'successfully.'
      );
    }

    // ------------------------------------------
    // WAITING FOR URL
    // ------------------------------------------

    if (
      /waiting for url/i.test(
        normalizedCallLog
      )
    ) {
      return (
        'Page should navigate to the ' +
        'expected URL successfully.'
      );
    }

    // ------------------------------------------
    // WAITING FOR ELEMENT / LOCATOR
    // ------------------------------------------

    const waitingMatch =
      normalizedCallLog.match(
        /waiting for\s+(.+)/i
      );

    if (waitingMatch?.[1]) {
      const target =
        waitingMatch[1]
          .trim()
          .replace(/^-\s*/g, '');

      return (
        `${target} should be available ` +
        'and accessible successfully.'
      );
    }

    // ------------------------------------------
    // API REQUEST
    // ------------------------------------------

    if (
      /api request/i.test(
        normalizedCallLog
      )
    ) {
      return (
        'API request should complete ' +
        'successfully.'
      );
    }

    return '';
  }

  // ==========================================
  // GET ACTUAL RESULT
  // ==========================================

  private getActualResult(
    errorMessage: string,
    status: string
  ): string {
    // ------------------------------------------
    // 1. RECEIVED VALUE
    //
    // Received: "Error"
    // ------------------------------------------

    const receivedMatch =
      errorMessage.match(
        /^\s*Received:\s*(.+)$/im
      );

    if (receivedMatch?.[1]) {
      return receivedMatch[1].trim();
    }

    // ------------------------------------------
    // 2. ACTUAL VALUE
    //
    // Actual: "Error"
    // ------------------------------------------

    const actualMatch =
      errorMessage.match(
        /^\s*Actual:\s*(.+)$/im
      );

    if (actualMatch?.[1]) {
      return actualMatch[1].trim();
    }

    // ------------------------------------------
    // 3. ENV VARIABLE ERROR
    // ------------------------------------------

    const envMatch =
      errorMessage.match(
        /([A-Z][A-Z0-9_]+)\s+is missing in\s+\.env/i
      );

    if (envMatch?.[1]) {
      return (
        `${envMatch[1]} is missing in .env`
      );
    }

    // ------------------------------------------
    // 4. EXTRACT MAIN ERROR
    // ------------------------------------------

    const mainError =
      this.getMainErrorMessage(
        errorMessage
      );

    if (mainError) {
      return mainError;
    }

    // ------------------------------------------
    // 5. TIMEOUT
    // ------------------------------------------

    if (
      status === 'timedOut' ||
      /\btimeout\b/i.test(errorMessage) ||
      /\btimed out\b/i.test(errorMessage)
    ) {
      return (
        'Test execution timed out.'
      );
    }

    return 'Test execution failed.';
  }

  private getComparisonDifferences(
    result: TestResult
  ): string {
    const attachment = result.attachments.find(
      item => item.name === 'comparison-differences'
    );

    if (!attachment) {
      return 'Not provided.';
    }

    if (attachment.body) {
      return attachment.body.toString('utf8');
    }

    if (attachment.path && fs.existsSync(attachment.path)) {
      return fs.readFileSync(attachment.path, 'utf8');
    }

    return 'Not provided.';
  }

  // ==========================================
  // GET MAIN ERROR MESSAGE
  // ==========================================

  private getMainErrorMessage(
    errorMessage: string
  ): string {
    const lines =
      errorMessage
        .split(/\r?\n/)
        .map(
          line => line.trim()
        )
        .filter(Boolean);

    // ------------------------------------------
    // STANDARD ERROR TYPES
    // ------------------------------------------

    const errorLine =
      lines.find(
        line =>
          /^(Error|TimeoutError|TypeError|ReferenceError|SyntaxError|RangeError):/i.test(
            line
          )
      );

    if (errorLine) {
      return errorLine;
    }

    // ------------------------------------------
    // PLAYWRIGHT ELEMENT ERROR
    // ------------------------------------------

    const elementError =
      lines.find(
        line =>
          /element\(s\) not found/i.test(
            line
          )
      );

    if (elementError) {
      return elementError;
    }

    // ------------------------------------------
    // GENERIC ERROR
    // ------------------------------------------

    const genericError =
      lines.find(
        line =>
          !/^Call log:/i.test(line) &&
          !/^-\s*/i.test(line) &&
          !/^at\s+/i.test(line)
      );

    return genericError || '';
  }

  // ==========================================
  // GET CALL LOG
  // ==========================================

  private getCallLog(
    errorMessage: string
  ): string {
    const callLogMatch =
      errorMessage.match(
        /Call log:\s*([\s\S]*?)(?=\n\s*at\s+|$)/i
      );

    if (!callLogMatch?.[1]) {
      return '';
    }

    return callLogMatch[1]
      .trim()
      .split(/\r?\n/)
      .map(
        line => line.trim()
      )
      .filter(Boolean)
      .join('\n');
  }

  // ==========================================
  // GET MODULE NAME
  // ==========================================

  private getModuleName(
    testFile: string
  ): string {
    const fileName =
      path.basename(
        testFile,
        path.extname(testFile)
      );

    const parts =
      fileName.split('_');

    if (parts.length >= 3) {
      return parts
        .slice(2)
        .join(' ')
        .replace(
          /\.spec$/i,
          ''
        )
        .replace(
          /spec$/i,
          ''
        )
        .trim();
    }

    return 'General';
  }

  // ==========================================
  // GENERATE EXCEL REPORT
  // ==========================================

  async onEnd(
    result: FullResult
  ): Promise<void> {
    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      'Playwright Automation';

    workbook.created =
      new Date();

    const totalTests = this.allTests.length;
    const passedTests = this.allTests.filter(
      test => test.status === 'passed'
    ).length;
    const failedTests = this.allTests.filter(
      test => test.status === 'failed'
    ).length;
    const timedOutTests = this.allTests.filter(
      test => test.status === 'timedOut'
    ).length;
    const skippedTests = this.allTests.filter(
      test => test.status === 'skipped'
    ).length;
    const executionTimeMs = Date.now() - this.startedAt;

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['PLAYWRIGHT TEST SUMMARY']);
    summarySheet.mergeCells('A1:B1');
    summarySheet.getCell('A1').font = { bold: true, size: 16 };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };
    summarySheet.addRow(['Metric', 'Count / Value']);
    summarySheet.addRows([
      ['Total Tests', totalTests],
      ['Passed', passedTests],
      ['Failed', failedTests],
      ['Timed Out', timedOutTests],
      ['Skipped', skippedTests],
      ['Execution Time (minutes)', Number((executionTimeMs / 60000).toFixed(2))],
      ['Overall Result', result.status],
    ]);
    summarySheet.getRow(2).font = { bold: true };
    summarySheet.columns = [{ width: 30 }, { width: 28 }];

    // All test results sheet
    const allResultsSheet = workbook.addWorksheet('All Test Results');
    allResultsSheet.addRow([
      'Test Case',
      'Module',
      'Test File',
      'Browser / Project',
      'Status',
      'Duration (ms)',
      'Error / Failure Reason',
      'Screenshot',
      'Date & Time',
    ]);
    allResultsSheet.getRow(1).font = { bold: true };
    allResultsSheet.addRows(
      this.allTests.map(test => [
        test.testCase,
        test.module,
        test.testFile,
        test.browser,
        test.status,
        test.duration,
        test.error,
        test.screenshot,
        test.timestamp,
      ])
    );
    allResultsSheet.columns = [
      { width: 45 },
      { width: 25 },
      { width: 55 },
      { width: 20 },
      { width: 16 },
      { width: 16 },
      { width: 80 },
      { width: 70 },
      { width: 25 },
    ];

    const worksheet =
      workbook.addWorksheet(
        'Bug Report'
      );

    // ==========================================
    // TITLE
    // ==========================================

    worksheet.mergeCells(
      'A1:P1'
    );

    const titleCell =
      worksheet.getCell('A1');

    titleCell.value =
      'AUTOMATION BUG REPORT';

    titleCell.font = {
      bold: true,
      size: 16,
    };

    titleCell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    worksheet.getRow(1).height =
      30;

    // ==========================================
    // HEADERS
    // ==========================================

    worksheet.addRow([
      'Bug ID',
      'Bug Title',
      'Module',
      'Test Case',
      'Test File',
      'Browser',
      'Status',
      'Expected Result',
      'Actual Result',
      'Comparison Differences',
      'Error / Failure Reason',
      'Severity',
      'Priority',
      'Duration (ms)',
      'Screenshot',
      'Date & Time',
    ]);

    const headerRow =
      worksheet.getRow(2);

    headerRow.font = {
      bold: true,
    };

    headerRow.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ==========================================
    // ADD FAILED TESTS
    // ==========================================

    for (
      const failedTest of
      this.failedTests
    ) {
      worksheet.addRow([
        failedTest.bugId,
        failedTest.bugTitle,
        failedTest.module,
        failedTest.testCase,
        failedTest.testFile,
        failedTest.browser,
        failedTest.status,
        failedTest.expectedResult,
        failedTest.actualResult,
        failedTest.comparisonDifferences,
        failedTest.error,
        failedTest.severity,
        failedTest.priority,
        failedTest.duration,
        failedTest.screenshot,
        failedTest.timestamp,
      ]);
    }

    // ==========================================
    // COLUMN WIDTHS
    // ==========================================

    worksheet.columns = [
      { width: 12 },
      { width: 40 },
      { width: 25 },
      { width: 45 },
      { width: 55 },
      { width: 15 },
      { width: 15 },
      { width: 55 },
      { width: 55 },
      { width: 80 },
      { width: 80 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 70 },
      { width: 25 },
    ];

    // ==========================================
    // WRAP TEXT
    // ==========================================

    for (const sheet of [summarySheet, allResultsSheet, worksheet]) {
      sheet.eachRow(row => {
        row.eachCell(cell => {
          cell.alignment = {
            vertical: 'top',
            wrapText: true,
          };
        });
      });
    }

    // Make test statuses easy to scan in Excel.
    allResultsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const statusCell = row.getCell(5);
      const status = String(statusCell.value || '').toLowerCase();
      if (status === 'passed') {
        statusCell.font = { color: { argb: 'FF008000' }, bold: true };
      } else if (status === 'failed' || status === 'timedout') {
        statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      } else if (status === 'skipped') {
        statusCell.font = { color: { argb: 'FF808080' }, bold: true };
      }
    });

    // ==========================================
    // SAVE REPORT
    // ==========================================

    const reportDirectory =
      path.join(
        this.rootDir,
        'bug-reports'
      );

    if (
      !fs.existsSync(
        reportDirectory
      )
    ) {
      fs.mkdirSync(
        reportDirectory,
        {
          recursive: true,
        }
      );
    }

    let reportPath =
      path.join(
        reportDirectory,
        'Automation_Bug_Report.xlsx'
      );

    try {
      await workbook.xlsx.writeFile(reportPath);
    } catch {
      reportPath = path.join(
        reportDirectory,
        `Automation_Bug_Report_${Date.now()}.xlsx`
      );
      await workbook.xlsx.writeFile(reportPath);
    }

    console.log(
      '\n======================================'
    );

    console.log(
      ' PLAYWRIGHT EXCEL REPORT GENERATED'
    );

    console.log(
      '======================================'
    );

    console.log(
      `Total Tests: ${this.allTests.length}\nPassed: ${passedTests}\nFailed: ${failedTests}\nTimed Out: ${timedOutTests}\nSkipped: ${skippedTests}`
    );

    console.log(
      `Report: ${reportPath}`
    );

    console.log(
      '======================================\n'
    );
  }
}

export default BugReporter;
