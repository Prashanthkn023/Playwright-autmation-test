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

    // Remove previous bug reports
    if (fs.existsSync(bugReportDir)) {
      fs.rmSync(bugReportDir, {
        recursive: true,
        force: true,
      });
    }

    // Create fresh bug report directory
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

  onTestEnd(
    test: TestCase,
    result: TestResult
  ): void {
    // Only process failed or timed out tests
    if (
      result.status !== 'failed' &&
      result.status !== 'timedOut'
    ) {
      return;
    }

    const errorMessage =
      this.getErrorMessage(result);

    // Get screenshot automatically
    let screenshotPath = '';

    for (const attachment of result.attachments) {
      if (
        attachment.name === 'screenshot' &&
        attachment.path
      ) {
        screenshotPath =
          attachment.path;

        break;
      }
    }

    const testFile =
      test.location.file;

    const module =
      this.getModuleName(testFile);

    const bugId =
      `BUG-${String(
        this.failedTests.length + 1
      ).padStart(3, '0')}`;

    const bugTitle =
      `${test.title} failed`;

    // Automatically extract Expected Result
    const expectedResult =
      this.getExpectedResult(
        errorMessage,
        result.status
      );

    // Automatically extract Actual Result
    const actualResult =
      this.getActualResult(
        errorMessage,
        result.status
      );

    // Debug output for Jenkins
    console.log(
      '\n========== BUG REPORT DEBUG =========='
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
      '======================================\n'
    );

    this.failedTests.push({
      bugId,

      bugTitle,

      module,

      testCase: test.title,

      testFile,

      browser:
        test.parent.project()?.name ||
        'Unknown',

      status:
        result.status,

      error:
        errorMessage,

      expectedResult,

      actualResult,

      severity:
        'Medium',

      priority:
        'Medium',

      duration:
        result.duration,

      screenshot:
        screenshotPath ||
        'Screenshot not available',

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
      for (
        const error of result.errors
      ) {
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
    // PLAYWRIGHT EXPECTED VALUE
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
    // MISSING ENVIRONMENT VARIABLE
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
    // TIMEOUT
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
    // PLAYWRIGHT ASSERTIONS
    // ------------------------------------------

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
      /toBeChecked/i.test(errorMessage)
    ) {
      return 'Checkbox should be checked.';
    }

    if (
      /toBeUnchecked/i.test(errorMessage)
    ) {
      return 'Checkbox should be unchecked.';
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

    // ------------------------------------------
    // GENERIC EXPECTED RESULT
    // ------------------------------------------

    return (
      'Test should execute successfully ' +
      'without errors.'
    );
  }

  // ==========================================
  // GET ACTUAL RESULT
  // ==========================================

  private getActualResult(
    errorMessage: string,
    status: string
  ): string {
    // ------------------------------------------
    // RECEIVED VALUE
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
    // ACTUAL VALUE
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
    // ENVIRONMENT VARIABLE ERROR
    //
    // CMS_MODULE_URL is missing in .env
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
    // PLAYWRIGHT ERROR LINES
    //
    // Error: expect(locator).toBeVisible() failed
    // Error: element(s) not found
    //
    // Return the last meaningful Error line
    // ------------------------------------------

    const errorMatches =
      Array.from(
        errorMessage.matchAll(
          /^\s*Error:\s*(.+)$/gim
        )
      );

    const meaningfulErrors =
      errorMatches
        .map(
          match =>
            match[1].trim()
        )
        .filter(
          message =>
            !/expect\(.*\).*failed/i.test(
              message
            )
        );

    if (
      meaningfulErrors.length > 0
    ) {
      return meaningfulErrors[
        meaningfulErrors.length - 1
      ];
    }

    // ------------------------------------------
    // ELEMENT NOT FOUND
    // ------------------------------------------

    if (
      /element\(s\) not found/i.test(
        errorMessage
      )
    ) {
      return 'Element(s) not found.';
    }

    // ------------------------------------------
    // STRICT MODE
    // ------------------------------------------

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

    // ------------------------------------------
    // TIMEOUT
    // ------------------------------------------

    if (
      status === 'timedOut' ||
      /\btimeout\b/i.test(errorMessage) ||
      /\btimed out\b/i.test(errorMessage)
    ) {
      return 'Test execution timed out.';
    }

    // ------------------------------------------
    // BROWSER CLOSED
    // ------------------------------------------

    if (
      /target page, context or browser has been closed/i.test(
        errorMessage
      )
    ) {
      return (
        'Page, browser context, or browser ' +
        'was closed.'
      );
    }

    // ------------------------------------------
    // LOCATOR FAILURE
    // ------------------------------------------

    if (
      /locator/i.test(errorMessage)
    ) {
      return (
        'Expected element was not found ' +
        'or did not reach the required state.'
      );
    }

    // ------------------------------------------
    // GENERIC ASSERTION FAILURE
    // ------------------------------------------

    if (
      /expect/i.test(errorMessage)
    ) {
      return (
        'Actual result did not match ' +
        'the expected result.'
      );
    }

    // ------------------------------------------
    // GENERIC FAILURE
    // ------------------------------------------

    return 'Test execution failed.';
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
    if (
      this.failedTests.length === 0
    ) {
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

    // ==========================================
    // TITLE
    // ==========================================

    worksheet.mergeCells(
      'A1:O1'
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
      { width: 50 },
      { width: 50 },
      { width: 70 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 70 },
      { width: 25 },
    ];

    // ==========================================
    // WRAP TEXT
    // ==========================================

    worksheet.eachRow(
      row => {
        row.eachCell(
          cell => {
            cell.alignment = {
              vertical: 'top',
              wrapText: true,
            };
          }
        );
      }
    );

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
