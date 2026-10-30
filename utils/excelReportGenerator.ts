import ExcelJS from 'exceljs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AiTestSummary } from './geminiReportWriter';

// ---------- shared types (imported by bugReporter.ts and geminiReportWriter.ts) ----------
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

// Same test after defaults are filled in (used inside this file only).
type FullTest = Omit<TestResult, 'durationMs' | 'module' | 'browser' | 'timestamp' | 'screenshot' | 'video' | 'trace'> & {
  durationMs: number; module: string; browser: string; timestamp: string;
  screenshot: string; video: string; trace: string;
};

export interface ApiPerformanceRow {
  api: string;
  calls: number[]; // response times in ms (5 calls per API)
  httpErrors: number;
}

export interface ApiPerformanceSheet {
  sheetName: string;
  title: string;
  rows: ApiPerformanceRow[];
}

// ---------- settings ----------
const REPORTED_BY = 'QA Automation';
const TIME_ZONE = 'Asia/Kolkata';
const SLOW_MS = 2000;
const AMBER_MS = 250;
const NOT_SPECIFIED = 'Not specified in test evidence.';

type Label = 'Passed' | 'Failed' | 'Timed Out' | 'Skipped';
const LABEL: Record<TestStatus, Label> = {
  passed: 'Passed', failed: 'Failed', timedOut: 'Timed Out', skipped: 'Skipped',
};

interface Row {
  no: number;
  t: FullTest;
  label: Label;
  expected: string;
  actual: string;
  steps: string;
  notes: string;
  bugTitle: string;
  description: string;
  severity: string;
  priority: string;
}

// ---------- text helpers ----------
const clean = (s: string) => (s ?? '').replace(/\u001b\[[0-9;]*m/g, '').trim();
const now = () => new Date().toLocaleString('en-IN', { timeZone: TIME_ZONE });

function cleanTitle(title: string): string {
  return title.replace(/^(TC[_-]?\d+[:\s_-]*)/i, '').replace(/\s+/g, ' ').trim();
}
function pathOrUnavailable(value?: string): string {
  return value && value !== 'Not available' && fs.existsSync(value) ? value : 'Not available';
}
function normalizeSeverity(value?: string): string {
  return ['Critical', 'High', 'Medium', 'Low'].find(x => x.toLowerCase() === value?.trim().toLowerCase()) ?? 'Unassigned';
}
function normalizePriority(value?: string): string {
  return ['High', 'Medium', 'Low'].find(x => x.toLowerCase() === value?.trim().toLowerCase()) ?? 'Unassigned';
}
function normalize(t: TestResult, generated: string): FullTest {
  return {
    ...t,
    title: cleanTitle(t.title),
    durationMs: t.durationMs ?? 0,
    module: t.module || 'General',
    browser: t.browser || 'Unknown',
    timestamp: t.timestamp || generated,
    screenshot: pathOrUnavailable(t.screenshot),
    video: pathOrUnavailable(t.video),
    trace: pathOrUnavailable(t.trace),
  };
}

function numberSteps(steps: string[] | undefined): string {
  const list = (steps ?? []).map(s => String(s).replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
  if (!list.length) return 'Steps not specified in test evidence.';
  return list.map((s, i) => `${i + 1}. ${s}`).join('\n');
}

function issueType(t: FullTest): string {
  const text = `${t.title} ${t.module}`;
  if (/performance|response time|slow/i.test(text)) return 'Performance';
  if (/api|json|endpoint/i.test(text)) return 'API';
  if (/image|map|layout|slider|banner|navigation|button|ui/i.test(text)) return 'UI';
  if (/content|tamil|text|faq|link|helpline|footer/i.test(text)) return 'Content';
  return 'Functional';
}

function buildRows(results: TestResult[], ai: AiTestSummary | null, generated: string): Row[] {
  const details = new Map((ai?.testDetails ?? []).map(d => [d.testId, d]));
  const passed = new Map((ai?.passedSummaries ?? []).map(d => [d.testId, d]));
  const failed = new Map((ai?.failedSummaries ?? []).map(d => [d.testId, d]));

  return results.map((raw, i) => {
    const t = normalize(raw, generated);
    const d = details.get(t.testId);
    const isFail = t.status === 'failed' || t.status === 'timedOut';
    const firstError = clean(t.error ?? '').split('\n')[0].slice(0, 200);

    const expected = d?.expectedResult || (t.status === 'skipped' ? `"${t.title}" should run.` : NOT_SPECIFIED);
    const actual = d?.actualResult ||
      (t.status === 'passed' ? 'The test passed.' :
        t.status === 'skipped' ? 'The test was skipped and did not run.' :
          firstError || 'Not available from test evidence.');
    const steps = d?.stepsToReproduce?.length ? numberSteps(d.stepsToReproduce) : numberSteps(t.steps);

    const p = passed.get(t.testId);
    const f = failed.get(t.testId);
    const notes = isFail ? (f?.failureSummary || actual)
      : t.status === 'skipped' ? 'Test was skipped.'
        : (p?.summary || 'No issue found.');

    return {
      no: i + 1, t, label: LABEL[t.status], expected, actual, steps, notes,
      bugTitle: f?.bugTitle || t.title,
      description: f?.failureSummary || actual,
      severity: normalizeSeverity(f?.severity),
      priority: normalizePriority(f?.priority),
    };
  });
}

// ---------- styling (same as the original report) ----------
const FONT = { name: 'Arial', size: 10 };
const solid = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const HEAD_FILL = solid('FF1F4E78');
const ZEBRA = solid('FFF2F2F2');
const RESULT_FILL: Record<Label, string> = {
  Passed: 'FFE2F0D9', Failed: 'FFF8CBAD', 'Timed Out': 'FFFFE699', Skipped: 'FFFFF2CC',
};
const THIN = { style: 'thin' as const, color: { argb: 'FFBFBFBF' } };
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function header(ws: ExcelJS.Worksheet, rowNo: number, labels: string[], widths?: number[]) {
  const row = ws.getRow(rowNo);
  labels.forEach((l, i) => {
    const c = row.getCell(i + 1);
    c.value = l;
    c.font = { ...FONT, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = HEAD_FILL;
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    if (widths) ws.getColumn(i + 1).width = widths[i];
  });
  row.height = 27.75;
}

function estLines(text: string, width: number): number {
  const per = Math.max(1, Math.floor(width * 1.2));
  return String(text ?? '').split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / per)), 0);
}

function dataRow(
  ws: ExcelJS.Worksheet, rowNo: number, values: Array<string | number>, center: number[],
  widths: number[], shaded: boolean, opts: { boldCol?: number; resultCol?: number; label?: Label } = {},
) {
  const row = ws.getRow(rowNo);
  let lines = 1;
  values.forEach((v, i) => {
    const c = row.getCell(i + 1);
    c.value = v;
    c.font = { ...FONT, bold: opts.boldCol === i + 1 };
    c.alignment = { horizontal: center.includes(i + 1) ? 'center' : 'left', vertical: 'top', wrapText: true };
    if (shaded) c.fill = ZEBRA;
    if (opts.resultCol === i + 1 && opts.label) c.fill = solid(RESULT_FILL[opts.label]);
    if (typeof v === 'string') lines = Math.max(lines, estLines(v, widths[i]));
  });
  row.height = Math.min(300, Math.max(18.75, 12 * lines + 6.75));
}

// ---------- API performance sheets ----------
function perfNote(rows: ApiPerformanceRow[]): string {
  const all = rows.flatMap(r => r.calls.map((ms, i) => ({ api: r.api, call: i + 1, ms })));
  const errors = rows.reduce((n, r) => n + r.httpErrors, 0);
  const slow = all.filter(x => x.ms >= SLOW_MS);
  const under100 = all.filter(x => x.ms < 100).length / (all.length || 1);
  const amber = all.filter(x => x.ms >= AMBER_MS).sort((a, b) => b.ms - a.ms);
  const top = [...all].sort((a, b) => b.ms - a.ms)[0];
  const parts: string[] = [];
  parts.push(errors === 0 && slow.length === 0
    ? 'No page data gave an error and nothing was slow.'
    : `${errors} call(s) gave an HTTP error and ${slow.length} call(s) took ${SLOW_MS} ms or more.`);
  if (slow.length === 0) parts.push(`Every call finished well inside the ${SLOW_MS} ms limit.`);
  if (amber.length === 0 && top) parts.push(`The slowest was ${top.api} on call ${top.call} (${Math.round(top.ms)} ms).`);
  if (under100 > 0.5) parts.push('Most calls took under 100 ms.');
  if (amber.length > 0) {
    const list = amber.slice(0, 2).map(x => `${x.api} on call ${x.call} (${Math.round(x.ms)} ms)`);
    parts.push(`${amber.length === 1 ? 'One single call was' : 'Two single calls were'} slower: ${list.join(' and ')}.`);
    parts.push(`Amber = ${AMBER_MS} ms or more.`);
  }
  return 'Note: ' + parts.join(' ');
}

function perfSheet(wb: ExcelJS.Workbook, sheet: ApiPerformanceSheet) {
  const data = sheet.rows;
  const ws = wb.addWorksheet(sheet.sheetName);
  ws.getCell('A1').value = sheet.title;
  ws.getCell('A1').font = { name: 'Arial', size: 12, bold: true };
  ws.getRow(1).height = 15;
  header(ws, 3, ['API', 'Call 1 (ms)', 'Call 2 (ms)', 'Call 3 (ms)', 'Call 4 (ms)', 'Call 5 (ms)',
    'Avg (ms)', 'Max (ms)', 'HTTP Errors', 'Result']);
  ws.getColumn(1).width = 30;
  for (let c = 2; c <= 9; c++) ws.getColumn(c).width = 11;
  ws.getColumn(10).width = 14;

  const first = 4;
  const last = 3 + data.length;
  data.forEach((d, i) => {
    const r = first + i;
    const row = ws.getRow(r);
    row.height = 15;
    const avg = d.calls.reduce((a, b) => a + b, 0) / (d.calls.length || 1);
    const max = d.calls.length ? Math.max(...d.calls) : 0;
    const vals: ExcelJS.CellValue[] = [
      d.api, ...[0, 1, 2, 3, 4].map(k => (d.calls[k] ?? null) as ExcelJS.CellValue),
      { formula: `AVERAGE(B${r}:F${r})`, result: avg },
      { formula: `MAX(B${r}:F${r})`, result: max },
      d.httpErrors,
      {
        formula: `IF(I${r}>0,"HTTP ERROR",IF(H${r}>=${SLOW_MS},"SLOW","PASS"))`,
        result: d.httpErrors > 0 ? 'HTTP ERROR' : max >= SLOW_MS ? 'SLOW' : 'PASS',
      },
    ];
    vals.forEach((v, k) => {
      const c = row.getCell(k + 1);
      c.value = v;
      c.font = FONT;
      c.border = BOX;
      c.alignment = { horizontal: k === 0 ? 'left' : 'center', vertical: 'middle' };
      if (k >= 1 && k <= 5 && typeof v === 'number' && v >= AMBER_MS) c.fill = solid('FFFFF3CD');
    });
  });

  const all = data.flatMap(d => d.calls);
  const s = last + 2;
  const stats: Array<[string, ExcelJS.CellValue]> = [
    ['Total APIs', { formula: `COUNTA(A${first}:A${last})`, result: data.length }],
    ['Total requests', { formula: `COUNT(B${first}:F${last})`, result: all.length }],
    ['HTTP error requests', { formula: `SUM(I${first}:I${last})`, result: data.reduce((n, d) => n + d.httpErrors, 0) }],
    ['Average response time (ms)', { formula: `AVERAGE(B${first}:F${last})`, result: all.reduce((a, b) => a + b, 0) / (all.length || 1) }],
    ['Slowest response (ms)', { formula: `MAX(B${first}:F${last})`, result: all.length ? Math.max(...all) : 0 }],
  ];
  stats.forEach(([label, val], i) => {
    const a = ws.getCell(s + i, 1);
    const b = ws.getCell(s + i, 2);
    a.value = label; a.font = { ...FONT, bold: true }; a.border = BOX;
    b.value = val; b.font = FONT; b.border = BOX; b.alignment = { horizontal: 'center' };
  });

  const noteRow = s + stats.length + 1;
  ws.mergeCells(`A${noteRow}:J${noteRow}`);
  const n = ws.getCell(`A${noteRow}`);
  n.value = perfNote(data);
  n.font = { name: 'Arial', size: 9, italic: true };
  n.alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(noteRow).height = 37.5;
}

// ---------- main entry ----------
export async function generateExcelReport(
  results: TestResult[],
  aiReport: AiTestSummary | null,
  outputPath = path.resolve(process.cwd(), 'tests', 'bug-reports', `Automation_Bug_Report_${Date.now()}.xlsx`),
  aiError?: string,
  apiSheets: ApiPerformanceSheet[] = [],
): Promise<string> {
  if (aiError) console.warn('Excel is being built without AI text: ' + aiError);

  const generated = now();
  const rows = buildRows(results, aiReport, generated);
  const count = (l: Label) => rows.filter(r => r.label === l).length;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QA Automation';
  wb.title = 'QA Test Execution Report';
  wb.created = new Date();

  // 1. Test Summary
  {
    const ws = wb.addWorksheet('Test Summary');
    header(ws, 1, ['Metric', 'Result'], [18, 26]);
    const data: Array<[string, string | number]> = [
      ['Report Title', 'QA Test Execution Report'],
      ['Report Generated', generated],
      ['Total Tests', rows.length],
      ['Passed', count('Passed')],
      ['Failed', count('Failed')],
      ['Timed Out', count('Timed Out')],
      ['Skipped', count('Skipped')],
    ];
    data.forEach(([k, v], i) => {
      const row = ws.getRow(i + 2);
      row.height = 17.25;
      [k, v].forEach((val, j) => {
        const c = row.getCell(j + 1);
        c.value = val;
        c.font = { ...FONT, bold: j === 0 };
        c.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        if (i % 2 === 0) c.fill = ZEBRA;
      });
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = 'A1:B8';
  }

  // 2. All Test Results
  {
    const ws = wb.addWorksheet('All Test Results');
    const W = [9.01, 44, 30, 13, 24, 12, 24, 44, 44, 44, 37, 16, 15, 15];
    header(ws, 1, ['No.', 'Test Name', 'Module', 'Browser', 'Execution Date', 'Result', 'Duration (Seconds)',
      'Expected Result', 'Actual Result', 'Steps to Reproduce', 'Notes', 'Screenshot', 'Video', 'Trace'], W);
    rows.forEach((r, i) => dataRow(ws, i + 2,
      [r.no, r.t.title, r.t.module, r.t.browser, r.t.timestamp, r.label,
        Math.round((r.t.durationMs / 1000) * 100) / 100,
        r.expected, r.actual, r.steps, r.notes, r.t.screenshot, r.t.video, r.t.trace],
      [1, 4, 5, 6, 7], W, i % 2 === 0, { boldCol: 6, resultCol: 6, label: r.label }));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = 'A1:N1';
  }

  // 3. Bug Report (failed and timed out tests; header only when everything passes)
  {
    const ws = wb.addWorksheet('Bug Report');
    // Same widths as the original; text columns widened because the original sheet had no bug rows.
    const W = [12, 16, 30, 14, 40, 40, 30, 34, 14, 14, 12, 17, 19, 40, 16, 11, 11, 30];
    header(ws, 1, ['Bug ID', 'Issue Type', 'Summary', 'Module', 'Description', 'Steps to Reproduce',
      'Expected Result', 'Actual Result', 'Severity', 'Priority', 'Status', 'Reported By', 'Reported Date',
      'Technical Error', 'Screenshot', 'Video', 'Trace', 'Comparison Differences'], W);
    rows.filter(r => r.label === 'Failed' || r.label === 'Timed Out').forEach((r, i) => {
      const diff = (r.t.comparisonDifferences ?? '').trim();
      dataRow(ws, i + 2,
        [`BUG-${String(i + 1).padStart(3, '0')}`, issueType(r.t), r.bugTitle, r.t.module, r.description,
          r.steps, r.expected, r.actual, r.severity, r.priority, r.label === 'Timed Out' ? 'Needs Review' : 'Open', REPORTED_BY, generated,
          clean(r.t.error ?? '').slice(0, 2000) || 'Not available', r.t.screenshot, r.t.video, r.t.trace,
          diff && diff !== 'Not provided.' ? diff : 'Not applicable'],
        [1, 9, 10, 11], W, i % 2 === 0);
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = 'A1:R1';
  }

  // 4 + 5. API performance sheets (only when the tests attached timing data)
  for (const sheet of apiSheets) if (sheet.rows.length) perfSheet(wb, sheet);

  // 6. Passed Tests
  {
    const ws = wb.addWorksheet('Passed Tests');
    const W = [9.01, 44, 30, 13, 12, 24, 37, 44];
    header(ws, 1, ['No.', 'Test Name', 'Module', 'Browser', 'Result', 'Duration (Seconds)', 'Test Summary',
      'Steps to Reproduce'], W);
    rows.filter(r => r.label === 'Passed').forEach((r, i) =>
      dataRow(ws, i + 2,
        [r.no, r.t.title, r.t.module, r.t.browser, r.label, Math.round((r.t.durationMs / 1000) * 100) / 100,
          r.notes, r.steps],
        [1, 4, 5, 6], W, i % 2 === 0));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = 'A1:H1';
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await wb.xlsx.writeFile(outputPath);
  return outputPath;
}