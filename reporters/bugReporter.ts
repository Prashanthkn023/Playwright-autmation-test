import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import ExcelJS from 'exceljs';

declare const require: (moduleName: string) => any;

const path = require('path');
const fs = require('fs');

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

  onBegin(config: FullConfig) {
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

  onTestEnd(test: TestCase, result: TestResult) {

    // Only report failed or timed-out tests
    if (
      result.status !== 'failed' &&
      result.status !== 'timedOut'
    ) {
      return;
    }

    let errorMessage = 'Test failed';

    if (result.error?.message) {
      errorMessage = result.error.message;
    } else if (
      result.errors &&
      result.errors.length > 0
    ) {
      errorMessage = result.errors
        .map(
          error =>
            error.message ||
            error.value ||
            ''
        )
        .join('\n');
    }

    // Get screenshot automatically
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

    // Automatically get module from folder/file name
    const module = this.getModuleName(testFile);

    const bugId =
      `BUG-${String(this.failedTests.length + 1).padStart(3, '0')}`;

    const bugTitle =
      `${test.title} failed`;

    const actualResult =
      this.getActualResult(errorMessage);

    this.failedTests.push({
      bugId,

      bugTitle,

      module,

      testCase: test.title,

      testFile,

      browser:
        test.parent.project()?.name ||
        'Unknown',

      status: result.status,

      error: errorMessage,

      expectedResult:
        'Application should behave as expected without errors.',

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

  private getModuleName(
    testFile: string
  ): string {

    const fileName =
      path.basename(
        testFile,
        path.extname(testFile)
      );

    // Example:
    // TC_003_Complaint.spec.ts
    // → Complaint

    const parts =
      fileName.split('_');

    if (parts.length >= 3) {

      return parts
        .slice(2)
        .join(' ')
        .replace(
          /spec$/i,
          ''
        )
        .trim();
    }

    return 'General';
  }

  private getActualResult(
    errorMessage: string
  ): string {

    if (
      errorMessage
        .toLowerCase()
        .includes('timeout')
    ) {
      return 'Test execution timed out.';
    }

    if (
      errorMessage
        .toLowerCase()
        .includes('locator')
    ) {
      return 'Expected element was not found.';
    }

    if (
      errorMessage
        .toLowerCase()
        .includes('expect')
    ) {
      return 'Actual result did not match the expected result.';
    }

    return 'Test execution failed.';
  }

  async onEnd(result: FullResult) {

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

    worksheet.mergeCells(
      'A1:N1'
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

    this.failedTests.forEach(
      failedTest => {

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
    );

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