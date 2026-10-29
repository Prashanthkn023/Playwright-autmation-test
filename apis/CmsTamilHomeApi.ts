import { APIRequestContext, APIResponse } from '@playwright/test';
import { TestAuditLogger, AuditTestType } from '../utils/testAuditLogger';

export const cmsHomeUrl = 'https://gctp.in/api/fusion-cms-web-backend/home-page?approvalStatus=all';
export const publishedHomeUrl = 'https://gctp.in/api/fusion-public-facing-web-backend/home-page';

export const requiredContentFields = [
  'id',
  'f_section',
  'f_title',
  'f_description',
  'f_url',
  'f_image',
  'f_tab',
  'f_approval_status',
  'f_tamil_title',
  'f_tamil_description',
  'f_other',
  'f_tamil_signature',
] as const;

export const cmsMetadataFields = new Set([
  'f_updated_by',
  'f_updated_on',
  'f_created_by',
  'f_created_on',
  'f_status_updated_by',
  'f_status_updated_on',
  'f_reject_reason',
  'f_approved_by',
  'f_approved_on',
  'f_approved_by_name',
  'f_created_by_name',
  'f_action_type',
  'f_display_order',
]);

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ApiEnvelope = {
  status: number;
  payload: JsonValue;
  message?: JsonValue;
};

export type FieldDifference = {
  path: string;
  kind: 'mismatch' | 'missing' | 'unexpected-empty';
  cmsValue?: JsonValue | string;
  publishedValue?: JsonValue | string;
};

export type ComparisonStats = {
  compared: number;
  matching: number;
  mismatches: FieldDifference[];
  missing: FieldDifference[];
  unexpectedEmpty: FieldDifference[];
};

export class CmsTamilHomeApi {
  protected request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getCmsHome(testName: string = 'CmsTamilHome API Comparison', testType: AuditTestType = 'HOME_API'): Promise<APIResponse> {
    try {
      const response = await this.request.get(cmsHomeUrl, { headers: { Accept: 'application/json' } });
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: cmsHomeUrl,
        item: 'CMS Home API GET Request',
        expected: '200 OK',
        actual: `${response.status()} ${response.statusText()}`,
        status: response.ok() ? 'PASS' : 'FAIL',
      });
      return response;
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: cmsHomeUrl,
        item: 'CMS Home API GET Request',
        expected: '200 OK',
        actual: '<request error>',
        status: 'ERROR',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getPublishedHome(testName: string = 'CmsTamilHome API Comparison', testType: AuditTestType = 'HOME_API'): Promise<APIResponse> {
    try {
      const response = await this.request.get(publishedHomeUrl, { headers: { Accept: 'application/json' } });
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: publishedHomeUrl,
        item: 'Published Home API GET Request',
        expected: '200 OK',
        actual: `${response.status()} ${response.statusText()}`,
        status: response.ok() ? 'PASS' : 'FAIL',
      });
      return response;
    } catch (error) {
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: publishedHomeUrl,
        item: 'Published Home API GET Request',
        expected: '200 OK',
        actual: '<request error>',
        status: 'ERROR',
        failureReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  describe(value: unknown): string {
    return JSON.stringify(value);
  }

  validateJsonTree(value: JsonValue, pathStr: string, errors: string[]): void {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      return;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) errors.push(`${pathStr}: number is not finite`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => this.validateJsonTree(item, `${pathStr}[${index}]`, errors));
      return;
    }
    if (this.isRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        this.validateJsonTree(child, `${pathStr}.${key}`, errors);
      }
      return;
    }
    errors.push(`${pathStr}: unsupported JSON value`);
  }

  isUnexpectedEmpty(value: JsonValue): boolean {
    return value === null || (typeof value === 'string' && value.trim() === '');
  }

  compareValue(
    cmsValue: JsonValue | undefined,
    publishedValue: JsonValue | undefined,
    pathStr: string,
    stats: ComparisonStats,
    testName: string = 'CmsTamilHome API Comparison',
    testType: AuditTestType = 'HOME_API'
  ): void {
    if (cmsValue === undefined || publishedValue === undefined) {
      stats.missing.push({
        path: pathStr,
        kind: 'missing',
        cmsValue: cmsValue === undefined ? '<missing>' : cmsValue,
        publishedValue: publishedValue === undefined ? '<missing>' : publishedValue,
      });
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: 'API Field Level',
        item: `Field ${pathStr}`,
        expected: 'Field present in both CMS & Published',
        actual: cmsValue === undefined ? 'Missing in CMS' : 'Missing in Published',
        status: 'FAIL',
      });
      return;
    }

    if (Array.isArray(cmsValue) && Array.isArray(publishedValue)) {
      stats.compared++;
      if (cmsValue.length !== publishedValue.length) {
        stats.mismatches.push({
          path: `${pathStr}.length`,
          kind: 'mismatch',
          cmsValue: cmsValue.length,
          publishedValue: publishedValue.length,
        });
        TestAuditLogger.log({
          testName,
          moduleName: 'CmsTamilHome',
          testType,
          target: 'API Array Length',
          item: `Array Length ${pathStr}`,
          expected: String(cmsValue.length),
          actual: String(publishedValue.length),
          status: 'FAIL',
        });
      } else {
        stats.matching++;
      }

      const length = Math.max(cmsValue.length, publishedValue.length);
      for (let index = 0; index < length; index++) {
        this.compareValue(cmsValue[index], publishedValue[index], `${pathStr}[${index}]`, stats, testName, testType);
      }
      return;
    }

    if (this.isRecord(cmsValue) && this.isRecord(publishedValue)) {
      const keys = new Set([...Object.keys(cmsValue), ...Object.keys(publishedValue)]);
      for (const key of keys) {
        this.compareValue(cmsValue[key], publishedValue[key], `${pathStr}.${key}`, stats, testName, testType);
      }
      return;
    }

    stats.compared++;
    const matches = Object.is(cmsValue, publishedValue);
    if (matches) {
      stats.matching++;
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: 'API Content Field',
        item: `Field ${pathStr}`,
        expected: String(cmsValue),
        actual: String(publishedValue),
        status: 'PASS',
      });
    } else {
      stats.mismatches.push({
        path: pathStr,
        kind: 'mismatch',
        cmsValue,
        publishedValue,
      });
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: 'API Content Field',
        item: `Field ${pathStr}`,
        expected: String(cmsValue),
        actual: String(publishedValue),
        status: 'FAIL',
      });
    }
  }

  async getJsonResponse(
    response: APIResponse,
    source: string,
    failures: string[],
    testName: string = 'CmsTamilHome API Comparison',
    testType: AuditTestType = 'HOME_API'
  ): Promise<ApiEnvelope | null> {
    const status = response.status();
    const contentType = response.headers()['content-type'] ?? '';
    const body = await response.text();

    if (!response.ok()) {
      failures.push(`${source}: HTTP ${status} ${response.statusText()}`);
    }
    if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType.trim())) {
      failures.push(`${source}: expected JSON Content-Type, received ${contentType || '(missing)'}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      const msg = `${source}: response is not valid JSON (${error instanceof Error ? error.message : String(error)})`;
      failures.push(msg);
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: source,
        item: `${source} JSON Parse`,
        expected: 'Valid JSON Object',
        actual: '<invalid JSON>',
        status: 'ERROR',
        failureReason: msg,
      });
      return null;
    }

    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
      const msg = `${source}: expected a JSON envelope object`;
      failures.push(msg);
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: source,
        item: `${source} Envelope Structure`,
        expected: 'JSON Envelope Object',
        actual: String(parsed),
        status: 'FAIL',
      });
      return null;
    }

    const envelope = parsed as Record<string, unknown>;
    if (typeof envelope.status !== 'number' || !Number.isFinite(envelope.status)) {
      failures.push(`${source}: envelope.status must be a finite number`);
    }
    if (envelope.status !== 200) {
      failures.push(`${source}: envelope.status expected 200, received ${this.describe(envelope.status)}`);
    }
    if (!Array.isArray(envelope.payload)) {
      failures.push(`${source}: envelope.payload must be an array`);
      TestAuditLogger.log({
        testName,
        moduleName: 'CmsTamilHome',
        testType,
        target: source,
        item: `${source} Payload Array Check`,
        expected: 'Array payload',
        actual: typeof envelope.payload,
        status: 'FAIL',
      });
      return null;
    }

    const jsonErrors: string[] = [];
    this.validateJsonTree(parsed as JsonValue, source, jsonErrors);
    failures.push(...jsonErrors);

    const isSuccess = failures.length === 0;
    TestAuditLogger.log({
      testName,
      moduleName: 'CmsTamilHome',
      testType,
      target: source,
      item: `${source} Structure & Envelope Validation`,
      expected: 'Status 200 & Array payload without structural errors',
      actual: `Status ${envelope.status}, payload count: ${envelope.payload.length}`,
      status: isSuccess ? 'PASS' : 'FAIL',
      failureReason: isSuccess ? undefined : failures.join('; '),
    });

    return envelope as ApiEnvelope;
  }
}
