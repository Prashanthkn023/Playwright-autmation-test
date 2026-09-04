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
  severity: string;
  priority: string;
  duration: number;
  screenshot: string;
  timestamp: string;
}

class BugReporter implements Reporter {
  private failedTests: FailedTest[] = [];
  private rootDir = '';

  onBegin(config: FullConfig): void {
    this.rootDir = config.rootDir;

    const bugReportDir = path.join(
      this.rootDir,
      'bug-reports'
    );

    if (fs.existsSync(bugReportDir)) {
      fs.rmSync(bugReportDir, {
        recursive: true,
        force: true,
      });
    }

    fs.mkdirSync(bugReportDir, {
      recursive: true,
    });
  }

  onTestEnd(
    test: TestCase,
    result: TestResult
  ): void {
    if (
      result.status !== 'failed' &&
      result.status !== 'timedOut'
    ) {
      return;
    }

    const errorMessage =
      this.getErrorMessage(result);

    let screenshotPath = '';

    for (const attachment of result.attachments) {
      if (
        attachment.name === 'screenshot' &&
        attachment.path
      ) {
        screenshotPath = attachment.path;
        break;
      }
    }

    const testFile = test.location.file;

    const module =
      this.getModuleName(testFile);

    const bugId =
      `BUG-${String(
        this.failedTests.length + 1
      ).padStart(3, '0')}`;

    const bugTitle =
      `${test.title} failed`;

    const expectedResult =
      this.getExpectedResult(errorMessage);

    const actualResult =
      this.getActualResult(errorMessage);

    this.failedTests.push({
      bugId,
      bugTitle,
      module,
      testCase: test.title,
      testFile,

      browser:
        test.parent.project()?.name ??
        'Unknown',

      status: result.status,

      error: errorMessage,

      expectedResult,

      actualResult,

      severity: 'Medium',

      priority: 'Medium',

      duration: result.duration,

      screenshot:
        screenshotPath ||
        'Screenshot not available',

      timestamp:
        new Date().toLocaleString(),
    });
  }

  // ==========================================
  // GET PLAYWRIGHT ERROR MESSAGE
  // ==========================================

  private getErrorMessage(
    result: TestResult
  ): string {
    if (result.error?.message) {
      return result.error.message;
    }

    if (
      result.errors &&
      result.errors.length > 0
    ) {
      return result.errors
        .map(
          error =>
            error.message ||
            error.value ||
            ''
        )
        .filter(Boolean)
        .join('\n');
    }

    return 'Test failed';
  }

  // ==========================================
  // GET EXPECTED RESULT
  // ==========================================

  private getExpectedResult(
    errorMessage: string
  ): string {
    // Example:
    // Expected: visible
    const expectedMatch =
      errorMessage.match(
        /^\s*Expected:\s*(.+)$/im
      );

    if (expectedMatch?.[1]) {
      return expectedMatch[1].trim();
    }

    // Playwright assertion fallback

    if (
      /toBeVisible/i.test(errorMessage)
    ) {
      return 'Element should be visible.';
    }

    if (
      /toBeHidden/i.test(errorMessage)
    ) {
      return 'Element should be hidden.';
    }

    if (
      /toBeEnabled/i.test(errorMessage)
    ) {
      return 'Element should be enabled.';
    }

    if (
      /toBeDisabled/i.test(errorMessage)
    ) {
      return 'Element should be disabled.';
    }

    if (
      /toHaveText/i.test(errorMessage)
    ) {
      return (
        'Element text should match ' +
        'the expected value.'
      );
    }

    if (
      /toContainText/i.test(errorMessage)
    ) {
      return (
        'Element should contain ' +
        'the expected text.'
      );
    }

    if (
      /toHaveValue/i.test(errorMessage)
    ) {
      return (
        'Element value should match ' +
        'the expected value.'
      );
    }

    if (
      /toHaveURL/i.test(errorMessage)
    ) {
      return (
        'Page URL should match ' +
        'the expected URL.'
      );
    }

    if (
      /toHaveTitle/i.test(errorMessage)
    ) {
      return (
        'Page title should match ' +
        'the expected title.'
      );
    }

    return (
      'Application should behave as expected ' +
      'without errors.'
    );
  }

  // ==========================================
  // GET ACTUAL RESULT
  // ==========================================

  private getActualResult(
    errorMessage: string
  ): string {
    // Example:
    // Received: "Error"

    const receivedMatch =
      errorMessage.match(
        /^\s*Received:\s*(.+)$/im
      );

    if (receivedMatch?.[1]) {
      return receivedMatch[1].trim();
    }

    // Example:
    // Actual: "Error"

    const actualMatch =
      errorMessage.match(
        /^\s*Actual:\s*(.+)$/im
      );

    if (actualMatch?.[1]) {
      return actualMatch[1].trim();
    }

    // Get all Error lines.
    // Example:
    //
    // Error: expect(locator).toBeVisible() failed
    // Error: element(s) not found

    const errorMatches = Array.from(
      errorMessage.matchAll(
        /^\s*Error:\s*(.+)$/gim
      )
    );

    const meaningfulErrors =
      errorMatches
        .map(match =>
          match[1].trim()
        )
        .filter(
          message =>
            !/expect\(.*\).*failed/i.test(
              message
            )
        );

    if (meaningfulErrors.length > 0) {
      return meaningfulErrors[
        meaningfulErrors.length - 1
      ];
    }

    // Common Playwright errors

    if (
      /element\(s\) not found/i.test(
        errorMessage
      )
    ) {
      return 'Element(s) not found.';
    }

    if (
      /strict mode violation/i.test(
        errorMessage
      )
    ) {
      return (
        'Multiple elements matched ' +
        'the locator.'
      );
    }

    if (
      /timeout/i.test(errorMessage)
    ) {
      return 'Test execution timed out.';
    }

    if (
      /locator/i.test(errorMessage)
    ) {
      return (
        'Expected element was not found ' +
        'or did not reach the required state.'
      );
    }

    if (
      /expect/i.test(errorMessage)
    ) {
      return (
        'Actual result did not match ' +
        'the expected result.'
      );
    }

    return 'Test execution failed.';
  }

  // ==========================================
  // GET MODULE NAME
  // ==========================================

  private getModuleName(
    testFile: string
  ): string {
    const fileName = path.basename(
      testFile,
      path.extname(testFile)
    );

    const parts =
      fileName.split('_');

    if (parts.length >= 3) {
      return parts
        .slice(2)
        .join(' ')
        .replace(/\.spec$/i, '')
        .replace(/spec$/i, '')
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
    if (this.failedTests.length === 0) {
      console.log(
        '\nNo failed tests. Bug report was not generated.'
      );

      return;
    }

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      'Playwright Automation';

    workbook.created =
      new Date();

    const worksheet =
      workbook.addWorksheet(
        'Bug Report'
      );

    // ==============================
    // TITLE
    // ==============================

    worksheet.mergeCells('A1:O1');

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

    worksheet.getRow(1).height = 30;

    // ==============================
    // HEADERS
    // ==============================

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

    // ==============================
    // FAILED TESTS
    // ==============================

    for (
      const failedTest of this.failedTests
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
        failedTest.error,
        failedTest.severity,
        failedTest.priority,
        failedTest.duration,
        failedTest.screenshot,
        failedTest.timestamp,
      ]);
    }

    // ==============================
    // COLUMN WIDTHS
    // ==============================

    worksheet.columns = [
      { width: 12 },
      { width: 40 },
      { width: 25 },
      { width: 45 },
      { width: 55 },
      { width: 15 },
      { width: 15 },
      { width: 45 },
      { width: 45 },
      { width: 70 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 70 },
      { width: 25 },
    ];

    // ==============================
    // WRAP TEXT
    // ==============================

    worksheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = {
          vertical: 'top',
          wrapText: true,
        };
      });
    });

    // ==============================
    // SAVE REPORT
    // ==============================

    const reportDirectory =
      path.join(
        this.rootDir,
        'bug-reports'
      );

    if (!fs.existsSync(reportDirectory)) {
      fs.mkdirSync(
        reportDirectory,
        {
          recursive: true,
        }
      );
    }

    const reportPath =
      path.join(
        reportDirectory,
        'Automation_Bug_Report.xlsx'
      );

    await workbook.xlsx.writeFile(
      reportPath
    );

    console.log(
      '\n======================================'
    );

    console.log(
      ' AUTOMATION BUG REPORT GENERATED'
    );

    console.log(
      '======================================'
    );

    console.log(
      `Failed Tests: ${this.failedTests.length}`
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