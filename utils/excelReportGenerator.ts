import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';

import type { AiTestSummary } from './geminiReportWriter';

export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped';

export interface TestResult {
  // Internal matching reference only.
  // Never display this in the Excel report.
  testId: string;

  title: string;
  status: TestStatus;
  durationMs?: number;

  // Technical error is displayed only in its dedicated column.
  error?: string;

  expectedEvidence?: string;
  actualEvidence?: string;

  // Optional execution metadata.
  module?: string;
  browser?: string;
  timestamp?: string;
}

const COLORS = {
  navy: 'FF1F4E78',
  blue: 'FF4472C4',
  lightBlue: 'FFD9EAF7',
  lightGray: 'FFF2F2F2',
  white: 'FFFFFFFF',
  green: 'FFE2F0D9',
  red: 'FFFCE4D6',
  yellow: 'FFFFF2CC',
  dark: 'FF333333',
};

function styleTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle?: string,
): void {
  sheet.mergeCells('A1:F1');

  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = {
    bold: true,
    size: 18,
    color: { argb: COLORS.white },
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.navy },
  };
  titleCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };

  sheet.getRow(1).height = 36;

  if (subtitle) {
    sheet.mergeCells('A2:F2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = subtitle;
    subtitleCell.font = {
      italic: true,
      size: 10,
      color: { argb: COLORS.dark },
    };
    subtitleCell.alignment = {
      vertical: 'middle',
      wrapText: true,
    };
    sheet.getRow(2).height = 24;
  }
}

function styleHeader(
  sheet: ExcelJS.Worksheet,
  headerRow = 1,
): void {
  const header = sheet.getRow(headerRow);

  header.font = {
    bold: true,
    color: { argb: COLORS.white },
  };

  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.navy },
  };

  header.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  };

  header.height = 32;

  sheet.views = [
    {
      state: 'frozen',
      ySplit: headerRow,
    },
  ];

  sheet.autoFilter = {
    from: {
      row: headerRow,
      column: 1,
    },
    to: {
      row: headerRow,
      column: sheet.columnCount,
    },
  };
}

function formatBody(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.alignment = {
      vertical: 'top',
      wrapText: true,
    };

    if (rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.lightGray },
        };
      });
    }
  });
}

function setColumnWidths(
  sheet: ExcelJS.Worksheet,
  widths: number[],
): void {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function statusLabel(status: TestStatus): string {
  switch (status) {
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'timedOut':
      return 'Timed Out';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Not Available';
  }
}

function statusColor(status: TestStatus): string {
  switch (status) {
    case 'passed':
      return COLORS.green;
    case 'failed':
      return COLORS.red;
    case 'timedOut':
      return COLORS.yellow;
    default:
      return COLORS.lightGray;
  }
}

function cleanText(value?: string | null): string {
  if (!value) return '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .trim();
}

function cleanTitle(title: string): string {
  return title
    .replace(/^(TC[_-]?\d+[:\s_-]*)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanStatus(status: TestStatus): string {
  if (status === 'timedOut') {
    return 'The check did not finish within the allowed time.';
  }

  if (status === 'failed') {
    return 'The check did not complete successfully.';
  }

  if (status === 'skipped') {
    return 'The check was not executed.';
  }

  return 'The check completed successfully.';
}

function getAiFailure(
  aiReport: AiTestSummary | null,
  testId: string,
) {
  return aiReport?.failedSummaries.find(
    item => item.testId === testId,
  );
}

function getAiPassSummary(
  aiReport: AiTestSummary | null,
  testId: string,
): string {
  return (
    aiReport?.passedSummaries.find(
      item => item.testId === testId,
    )?.summary ?? 'A human-readable summary was not available.'
  );
}

function normalizeSeverity(value?: string): string {
  const allowed = ['Critical', 'High', 'Medium', 'Low'];

  const match = allowed.find(
    item => item.toLowerCase() === value?.trim().toLowerCase(),
  );

  return match ?? 'Unassigned';
}

function normalizePriority(value?: string): string {
  const allowed = ['High', 'Medium', 'Low'];

  const match = allowed.find(
    item => item.toLowerCase() === value?.trim().toLowerCase(),
  );

  return match ?? 'Unassigned';
}

function getExpectedResult(
  aiExpected?: string,
  evidence?: string,
): string {
  const value = cleanText(aiExpected);

  if (
    value &&
    value !== 'Not specified in test evidence.' &&
    value !== 'Not available'
  ) {
    return value;
  }

  const evidenceText = cleanText(evidence);

  return evidenceText || 'Not specified in test evidence.';
}

function getActualResult(
  aiActual?: string,
  test?: TestResult,
): string {
  const value = cleanText(aiActual);

  if (value && value !== 'Not available') {
    return value;
  }

  if (test?.status === 'timedOut') {
    return 'The check did not finish within the allowed time.';
  }

  if (test?.status === 'failed') {
    return 'The check did not complete successfully.';
  }

  return 'Not available.';
}

function getTechnicalError(test: TestResult): string {
  return cleanText(test.error);
}

function getReproductionSteps(
  steps?: string[],
): string {
  if (!steps?.length) {
    return 'Steps not specified in test evidence.';
  }

  const validSteps = steps
    .map(step => cleanText(step))
    .filter(Boolean)
    .filter(
      step =>
        step !== 'Steps not specified in test evidence.',
    );

  if (!validSteps.length) {
    return 'Steps not specified in test evidence.';
  }

  return validSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
}

function getBugStatus(test: TestResult): string {
  return test.status === 'timedOut'
    ? 'Needs Review'
    : 'Open';
}

export async function generateExcelReport(
  testResults: TestResult[],
  aiReport: AiTestSummary | null,
  outputPath = path.resolve(
    process.cwd(),
    'tests',
    'bug-reports',
    `Automation_Bug_Report_${Date.now()}.xlsx`,
  ),
  aiError?: string,
): Promise<string> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'QA Automation';
  workbook.subject = 'Software QA Test Execution and Bug Report';
  workbook.title = 'QA Test Execution Report';
  workbook.created = new Date();

  const passed = testResults.filter(
    test => test.status === 'passed',
  );

  const failed = testResults.filter(
    test => test.status === 'failed',
  );

  const timedOut = testResults.filter(
    test => test.status === 'timedOut',
  );

  const skipped = testResults.filter(
    test => test.status === 'skipped',
  );

  const defects = [...failed, ...timedOut];

  const generatedAt = new Date().toLocaleString();

  /*
   * SHEET 1: TEST SUMMARY
   */
  const summary = workbook.addWorksheet('Test Summary');

  summary.addRows([
    ['Metric', 'Result'],
    ['Report Title', 'QA Test Execution Report'],
    ['Report Generated', generatedAt],
    ['Total Tests', testResults.length],
    ['Passed', passed.length],
    ['Failed', failed.length],
    ['Timed Out', timedOut.length],
    ['Skipped', skipped.length],
    [
      'Execution Result',
      defects.length === 0
        ? 'All executed checks passed'
        : 'One or more checks require review',
    ],
    [
      'AI Report Status',
      aiReport ? 'Generated' : 'Unavailable',
    ],
    [
      'Overall Summary',
      cleanText(aiReport?.overallSummary) ||
        'The automated summary was not available.',
    ],
  ]);

  styleHeader(summary);
  formatBody(summary);

  setColumnWidths(summary, [30, 100]);

  summary.getRow(1).height = 30;

  for (let row = 2; row <= summary.rowCount; row++) {
    summary.getCell(row, 1).font = { bold: true };
  }

  /*
   * SHEET 2: ALL TEST RESULTS
   *
   * No file paths.
   * No internal Playwright test IDs.
   */
  const allResults = workbook.addWorksheet('All Test Results');

  allResults.addRow([
    'No.',
    'Test Name',
    'Module',
    'Browser',
    'Execution Date',
    'Result',
    'Duration (Seconds)',
    'Expected Result',
    'Actual Result',
    'Notes',
  ]);

  testResults.forEach((test, index) => {
    const aiFailure = getAiFailure(aiReport, test.testId);

    const expected = getExpectedResult(
      aiFailure?.expectedResult,
      test.expectedEvidence,
    );

    let actual: string;

    if (test.status === 'passed') {
      actual = 'The check completed successfully.';
    } else {
      actual = getActualResult(
        aiFailure?.actualResult,
        test,
      );
    }

    allResults.addRow([
      index + 1,
      cleanTitle(test.title),
      test.module || 'General',
      test.browser || 'Chromium',
      test.timestamp || generatedAt,
      statusLabel(test.status),
      test.durationMs != null
        ? Number((test.durationMs / 1000).toFixed(2))
        : '',
      expected,
      actual,
      test.status === 'passed'
        ? getAiPassSummary(aiReport, test.testId)
        : cleanText(aiFailure?.failureSummary) ||
          humanStatus(test.status),
    ]);

    const row = allResults.lastRow;

    if (row) {
      row.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor(test.status) },
      };

      row.getCell(6).font = { bold: true };
    }
  });

  styleHeader(allResults);
  formatBody(allResults);

  setColumnWidths(allResults, [
    8, 38, 24, 16, 24, 16, 20, 48, 48, 55,
  ]);

  /*
   * SHEET 3: BUG REPORT
   *
   * Jira-style layout.
   * Technical error is separate from the human description.
   */
  const bugSheet = workbook.addWorksheet('Bug Report');

  bugSheet.addRow([
    'Bug ID',
    'Issue Type',
    'Summary',
    'Module',
    'Description',
    'Steps to Reproduce',
    'Expected Result',
    'Actual Result',
    'Severity',
    'Priority',
    'Status',
    'Reported By',
    'Reported Date',
    'Technical Error',
  ]);

  let bugNumber = 1;

  for (const test of defects) {
    const ai = getAiFailure(aiReport, test.testId);

    const bugTitle =
      cleanText(ai?.bugTitle) ||
      cleanTitle(test.title) ||
      'Automated check did not complete successfully';

    const description =
      cleanText(ai?.failureSummary) ||
      humanStatus(test.status);

    const expectedResult = getExpectedResult(
      ai?.expectedResult,
      test.expectedEvidence,
    );

    const actualResult = getActualResult(
      ai?.actualResult,
      test,
    );

    const row = bugSheet.addRow([
      `BUG-${String(bugNumber++).padStart(3, '0')}`,
      'Bug',
      bugTitle,
      test.module || 'General',
      description,
      getReproductionSteps(ai?.stepsToReproduce),
      expectedResult,
      actualResult,
      normalizeSeverity(ai?.severity),
      normalizePriority(ai?.priority),
      getBugStatus(test),
      'QA Automation',
      test.timestamp || generatedAt,
      getTechnicalError(test),
    ]);

    row.height = 90;

    row.getCell(1).font = { bold: true };

    row.getCell(11).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb:
          test.status === 'timedOut'
            ? COLORS.yellow
            : COLORS.red,
      },
    };
  }

  styleHeader(bugSheet);
  formatBody(bugSheet);

  setColumnWidths(bugSheet, [
    14, 14, 42, 24, 55, 55, 48,
    48, 16, 16, 20, 20, 24, 70,
  ]);

  /*
   * SHEET 4: PASSED TESTS
   */
  const passedSheet = workbook.addWorksheet('Passed Tests');

  passedSheet.addRow([
    'No.',
    'Test Name',
    'Module',
    'Browser',
    'Result',
    'Duration (Seconds)',
    'Test Summary',
  ]);

  passed.forEach((test, index) => {
    passedSheet.addRow([
      index + 1,
      cleanTitle(test.title),
      test.module || 'General',
      test.browser || 'Chromium',
      'Passed',
      test.durationMs != null
        ? Number((test.durationMs / 1000).toFixed(2))
        : '',
      getAiPassSummary(aiReport, test.testId),
    ]);
  });

  styleHeader(passedSheet);
  formatBody(passedSheet);

  setColumnWidths(passedSheet, [
    8, 42, 24, 16, 16, 20, 65,
  ]);

  /*
   * SHEET 5: AI GENERATION STATUS
   *
   * Added only if AI report generation failed.
   */
  if (!aiReport) {
    const note = workbook.addWorksheet('AI Generation Status');

    note.addRows([
      ['Status', 'Details'],
      ['AI Report', 'Unavailable'],
      [
        'Generation Details',
        cleanText(aiError) ||
          'The AI report could not be generated.',
      ],
      [
        'Test Results',
        'Playwright execution results are retained in this workbook.',
      ],
    ]);

    styleHeader(note);
    formatBody(note);

    setColumnWidths(note, [28, 100]);
  }

  /*
   * Workbook-wide formatting
   */
  workbook.eachSheet(sheet => {
    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.font = {
          ...cell.font,
          name: 'Arial',
          size: cell.font?.size ?? 10,
        };

        cell.alignment = {
          ...cell.alignment,
          vertical: 'top',
          wrapText: true,
        };
      });
    });
  });

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });

  await workbook.xlsx.writeFile(outputPath);

  return outputPath;
}