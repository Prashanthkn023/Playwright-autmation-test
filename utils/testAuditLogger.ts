import fs from 'fs';
import path from 'path';

export type AuditTestType = 'CONTENT' | 'API' | 'UI' | 'E2E';
export type AuditStatus = 'PASS' | 'FAIL' | 'ERROR';

export interface AuditEntry {
  timestamp?: string;
  testName: string;
  moduleName?: string;
  testType: AuditTestType;
  target: string;
  item: string;
  expected: string;
  actual: string;
  status: AuditStatus;
  failureReason?: string;
}

export class TestAuditLogger {
  private static getLogFilePath(): string {
    const logDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return path.join(logDir, 'cms-tamil-abt-audit.log');
  }

  static log(entry: AuditEntry): void {
    const timestamp = entry.timestamp || new Date().toISOString();
    const moduleName = entry.moduleName || 'CmsTamilABT';
    const logFile = this.getLogFilePath();

    const failureReasonStr = entry.failureReason ? ` | Reason: ${JSON.stringify(entry.failureReason)}` : '';
    const logLine = `[${timestamp}] [${entry.testType}] Module: ${moduleName} | Test: ${entry.testName} | Target: ${entry.target} | Item: ${entry.item} | Status: ${entry.status} | Expected: ${JSON.stringify(entry.expected)} | Actual: ${JSON.stringify(entry.actual)}${failureReasonStr}\n`;

    try {
      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      console.error(`[TestAuditLogger Error] Failed to write audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static readLogEntries(): AuditEntry[] {
    const logFile = this.getLogFilePath();
    if (!fs.existsSync(logFile)) return [];

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const entries: AuditEntry[] = [];

    for (const line of lines) {
      const statusMatch = line.match(/\| Status: (PASS|FAIL|ERROR) \|/);
      const typeMatch = line.match(/\[([A-Z0-9_]+)\] Module:/);
      if (statusMatch && typeMatch) {
        entries.push({
          testName: 'parsed',
          testType: typeMatch[1] as AuditTestType,
          target: '',
          item: '',
          expected: '',
          actual: '',
          status: statusMatch[1] as AuditStatus,
        });
      }
    }
    return entries;
  }

  static getSummary(): {
    totalValidations: number;
    passed: number;
    failed: number;
    error: number;
    byType: Record<string, { total: number; pass: number; fail: number; error: number }>;
  } {
    const entries = this.readLogEntries();
    const summary = {
      totalValidations: entries.length,
      passed: 0,
      failed: 0,
      error: 0,
      byType: {} as Record<string, { total: number; pass: number; fail: number; error: number }>,
    };

    for (const entry of entries) {
      if (entry.status === 'PASS') summary.passed++;
      else if (entry.status === 'FAIL') summary.failed++;
      else if (entry.status === 'ERROR') summary.error++;

      if (!summary.byType[entry.testType]) {
        summary.byType[entry.testType] = { total: 0, pass: 0, fail: 0, error: 0 };
      }
      summary.byType[entry.testType].total++;
      if (entry.status === 'PASS') summary.byType[entry.testType].pass++;
      else if (entry.status === 'FAIL') summary.byType[entry.testType].fail++;
      else if (entry.status === 'ERROR') summary.byType[entry.testType].error++;
    }

    return summary;
  }
}
