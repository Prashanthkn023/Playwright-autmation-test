import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';
import type { AiTestSummary } from './geminiReportWriter';

export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped';

export interface TestResult {
  testId: string;
  title: string;
  status: TestStatus;
  durationMs?: number;
  error?: string;
  expectedEvidence?: string;
  actualEvidence?: string;
  comparisonDifferences?: string;
  module?: string;
  browser?: string;
  timestamp?: string;
  steps?: string[];
  screenshot?: string;
  video?: string;
  trace?: string;
}

const COLORS = {
  navy: 'FF1F4E78', white: 'FFFFFFFF', lightGray: 'FFF2F2F2',
  green: 'FFE2F0D9', red: 'FFFCE4D6', yellow: 'FFFFF2CC', dark: 'FF333333',
};
const NOT_SPECIFIED = 'Not specified in test evidence.';
const ACTUAL_NOT_AVAILABLE = 'Not available from test evidence.';

function styleHeader(sheet: ExcelJS.Worksheet, headerRow = 1): void {
  const header = sheet.getRow(headerRow);
  header.font = { bold: true, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 32;
  sheet.views = [{ state: 'frozen', ySplit: headerRow }];
  if (sheet.columnCount > 0 && sheet.rowCount >= headerRow) {
    sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: sheet.columnCount } };
  }
}
function formatBody(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
    if (rowNumber % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }; });
  });
}
function setWidths(sheet: ExcelJS.Worksheet, widths: number[]): void { widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; }); }
function statusLabel(status: TestStatus): string { return status === 'timedOut' ? 'Timed Out' : status.charAt(0).toUpperCase() + status.slice(1); }
function statusColor(status: TestStatus): string { return status === 'passed' ? COLORS.green : status === 'failed' ? COLORS.red : status === 'timedOut' ? COLORS.yellow : COLORS.lightGray; }
function cleanText(value?: string | null): string { return value ? value.replace(/\r\n/g, '\n').replace(/\u001b\[[0-9;]*m/g, '').trim() : ''; }
function cleanTitle(title: string): string { return title.replace(/^(TC[_-]?\d+[:\s_-]*)/i, '').replace(/\s+/g, ' ').trim(); }
function aiFailure(aiReport: AiTestSummary | null, testId: string) { return aiReport?.failedSummaries.find(item => item.testId === testId); }
function aiPassSummary(aiReport: AiTestSummary | null, testId: string): string { return aiReport?.passedSummaries.find(item => item.testId === testId)?.summary ?? 'Summary unavailable; see recorded test evidence.'; }
function normalizeSeverity(value?: string): string { const allowed = ['Critical', 'High', 'Medium', 'Low']; return allowed.find(item => item.toLowerCase() === value?.trim().toLowerCase()) ?? 'Unassigned'; }
function normalizePriority(value?: string): string { const allowed = ['High', 'Medium', 'Low']; return allowed.find(item => item.toLowerCase() === value?.trim().toLowerCase()) ?? 'Unassigned'; }
function expectedResult(test: TestResult, aiExpected?: string): string {
  const ai = cleanText(aiExpected);
  if (ai && ai !== 'Not available' && ai !== ACTUAL_NOT_AVAILABLE) return ai;
  const evidence = cleanText(test.expectedEvidence);
  return evidence || NOT_SPECIFIED;
}
function actualResult(test: TestResult, aiActual?: string): string {
  const ai = cleanText(aiActual);
  if (ai && ai !== 'Not available' && ai !== ACTUAL_NOT_AVAILABLE) return ai;
  const evidence = cleanText(test.actualEvidence || test.error || test.comparisonDifferences);
  return evidence || ACTUAL_NOT_AVAILABLE;
}
function reproductionSteps(test: TestResult, aiSteps?: string[]): string {
  // Prefer real captured steps. AI may simplify these but cannot add steps.
  const recorded = (test.steps ?? []).map(cleanText).filter(Boolean);
  if (recorded.length) return recorded.map((step, index) => `${index + 1}. ${step}`).join('\n');
  const validAi = (aiSteps ?? []).map(cleanText).filter(step => step && step !== 'Steps not specified in test evidence.');
  if (validAi.length) return validAi.map((step, index) => `${index + 1}. ${step}`).join('\n');
  return 'Steps not specified in test evidence.';
}
function technicalError(test: TestResult): string { return cleanText(test.error); }
function pathOrUnavailable(value?: string): string { return value && value !== 'Not available' && fs.existsSync(value) ? value : 'Not available'; }

export async function generateExcelReport(
  testResults: TestResult[],
  aiReport: AiTestSummary | null,
  outputPath = path.resolve(process.cwd(), 'tests', 'bug-reports', `Automation_Bug_Report_${Date.now()}.xlsx`),
  aiError?: string,
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QA Automation';
  workbook.subject = 'Software QA Test Execution and Bug Report';
  workbook.title = 'QA Test Execution Report';
  workbook.created = new Date();

  const passed = testResults.filter(test => test.status === 'passed');
  const failed = testResults.filter(test => test.status === 'failed');
  const timedOut = testResults.filter(test => test.status === 'timedOut');
  const skipped = testResults.filter(test => test.status === 'skipped');
  const defects = [...failed, ...timedOut];
  const generatedAt = new Date().toLocaleString();

  const summary = workbook.addWorksheet('Test Summary');
  summary.addRows([
    ['Metric', 'Result'], ['Report Title', 'QA Test Execution Report'], ['Report Generated', generatedAt],
    ['Total Tests', testResults.length], ['Passed', passed.length], ['Failed', failed.length],
    ['Timed Out', timedOut.length], ['Skipped', skipped.length],
    ['Execution Result', defects.length === 0 ? 'All executed checks passed' : 'One or more checks require review'],
    ['AI Report Status', aiReport ? 'Generated' : 'Unavailable'],
    ['Overall Summary', cleanText(aiReport?.overallSummary) || `AI summary unavailable. ${cleanText(aiError)}`],
  ]);
  styleHeader(summary); formatBody(summary); setWidths(summary, [30, 100]);
  for (let row = 2; row <= summary.rowCount; row++) summary.getCell(row, 1).font = { bold: true };

  const allResults = workbook.addWorksheet('All Test Results');
  allResults.addRow(['No.', 'Test Name', 'Module', 'Browser', 'Execution Date', 'Result', 'Duration (Seconds)', 'Expected Result', 'Actual Result', 'Recorded Steps', 'Notes', 'Screenshot', 'Video', 'Trace']);
  testResults.forEach((test, index) => {
    const ai = aiFailure(aiReport, test.testId);
    const expected = test.status === 'passed' && !test.expectedEvidence ? 'Passed; no separate expected-value evidence captured.' : expectedResult(test, ai?.expectedResult);
    const actual = test.status === 'passed' ? 'Test passed; see recorded test steps.' : actualResult(test, ai?.actualResult);
    const row = allResults.addRow([
      index + 1, cleanTitle(test.title), test.module || 'General', test.browser || 'Unknown', test.timestamp || generatedAt,
      statusLabel(test.status), test.durationMs != null ? Number((test.durationMs / 1000).toFixed(2)) : '',
      expected, actual, reproductionSteps(test, ai?.stepsToReproduce),
      test.status === 'passed' ? aiPassSummary(aiReport, test.testId) : cleanText(ai?.failureSummary) || actual,
      pathOrUnavailable(test.screenshot), pathOrUnavailable(test.video), pathOrUnavailable(test.trace),
    ]);
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor(test.status) } };
    row.getCell(6).font = { bold: true };
  });
  styleHeader(allResults); formatBody(allResults); setWidths(allResults, [8, 38, 24, 16, 24, 16, 20, 48, 55, 60, 55, 45, 45, 45]);

  const bugSheet = workbook.addWorksheet('Bug Report');
  bugSheet.addRow(['Bug ID', 'Issue Type', 'Summary', 'Module', 'Description', 'Steps to Reproduce', 'Expected Result', 'Actual Result', 'Severity', 'Priority', 'Status', 'Reported By', 'Reported Date', 'Technical Error', 'Screenshot', 'Video', 'Trace', 'Comparison Differences']);
  let bugNumber = 1;
  for (const test of defects) {
    const ai = aiFailure(aiReport, test.testId);
    const title = cleanText(ai?.bugTitle) || cleanTitle(test.title) || 'Automated check did not complete successfully';
    const description = cleanText(ai?.failureSummary) || actualResult(test);
    const row = bugSheet.addRow([
      `BUG-${String(bugNumber++).padStart(3, '0')}`, 'Bug', title, test.module || 'General', description,
      reproductionSteps(test, ai?.stepsToReproduce), expectedResult(test, ai?.expectedResult), actualResult(test, ai?.actualResult),
      normalizeSeverity(ai?.severity), normalizePriority(ai?.priority), test.status === 'timedOut' ? 'Needs Review' : 'Open',
      'QA Automation', test.timestamp || generatedAt, technicalError(test), pathOrUnavailable(test.screenshot),
      pathOrUnavailable(test.video), pathOrUnavailable(test.trace), cleanText(test.comparisonDifferences),
    ]);
    row.height = 100;
    row.getCell(1).font = { bold: true };
    row.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: test.status === 'timedOut' ? COLORS.yellow : COLORS.red } };
  }
  styleHeader(bugSheet); formatBody(bugSheet); setWidths(bugSheet, [14, 14, 42, 24, 55, 60, 48, 55, 16, 16, 20, 20, 24, 70, 45, 45, 45, 50]);

  const passedSheet = workbook.addWorksheet('Passed Tests');
  passedSheet.addRow(['No.', 'Test Name', 'Module', 'Browser', 'Result', 'Duration (Seconds)', 'Test Summary', 'Recorded Steps']);
  passed.forEach((test, index) => passedSheet.addRow([
    index + 1, cleanTitle(test.title), test.module || 'General', test.browser || 'Unknown', 'Passed',
    test.durationMs != null ? Number((test.durationMs / 1000).toFixed(2)) : '',
    aiPassSummary(aiReport, test.testId), reproductionSteps(test),
  ]));
  styleHeader(passedSheet); formatBody(passedSheet); setWidths(passedSheet, [8, 42, 24, 16, 16, 20, 65, 60]);

  if (!aiReport) {
    const note = workbook.addWorksheet('AI Generation Status');
    note.addRows([['Status', 'Details'], ['AI Report', 'Unavailable'], ['Generation Details', cleanText(aiError) || 'The AI report could not be generated.'], ['Test Results', 'Playwright execution results and captured evidence are retained in this workbook.']]);
    styleHeader(note); formatBody(note); setWidths(note, [28, 100]);
  }

  workbook.eachSheet(sheet => sheet.eachRow(row => row.eachCell(cell => {
    cell.font = { ...cell.font, name: 'Arial', size: cell.font?.size ?? 10 };
    cell.alignment = { ...cell.alignment, vertical: 'top', wrapText: true };
  })));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
