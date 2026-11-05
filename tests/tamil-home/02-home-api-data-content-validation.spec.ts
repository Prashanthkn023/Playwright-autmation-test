import { test, expect } from '@playwright/test';
import {
  CmsTamilHomeApi,
  cmsHomeUrl,
  publishedHomeUrl,
  requiredContentFields,
  cmsMetadataFields,
  type JsonValue,
  type ApiEnvelope,
  type ComparisonStats,
} from '../apis/CmsTamilHomeApi';

test('CmsTamilHome API JSON: compare approved CMS records with published Home data', async ({ request }, testInfo) => {
  const apiService = new CmsTamilHomeApi(request);
  const failures: string[] = [];
  let cmsEnvelope: ApiEnvelope | null = null;
  let publishedEnvelope: ApiEnvelope | null = null;

  try {
    const response = await apiService.getCmsHome();
    cmsEnvelope = await apiService.getJsonResponse(response, 'CMS Home API', failures);
  } catch (error) {
    failures.push(`CMS Home API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const response = await apiService.getPublishedHome();
    publishedEnvelope = await apiService.getJsonResponse(response, 'Published Home API', failures);
  } catch (error) {
    failures.push(`Published Home API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const stats: ComparisonStats = {
    compared: 0,
    matching: 0,
    mismatches: [],
    missing: [],
    unexpectedEmpty: [],
  };

  if (cmsEnvelope && publishedEnvelope) {
    const cmsPayload = cmsEnvelope.payload as JsonValue[];
    const publishedPayload = publishedEnvelope.payload as JsonValue[];

    const cmsApprovedById = new Map<string, { [key: string]: JsonValue }>();
    for (const [index, item] of cmsPayload.entries()) {
      if (!apiService.isRecord(item)) {
        failures.push(`CMS payload[${index}] must be an object`);
        continue;
      }
      if (item.f_approval_status !== 'APPROVED') continue;
      if (typeof item.id !== 'number' && typeof item.id !== 'string') {
        failures.push(`CMS approved payload[${index}].id must be a string or number`);
        continue;
      }
      const id = String(item.id);
      if (cmsApprovedById.has(id)) failures.push(`CMS approved records contain duplicate id ${id}`);
      cmsApprovedById.set(id, item);
    }

    const publishedById = new Map<string, { [key: string]: JsonValue }>();
    for (const [index, item] of publishedPayload.entries()) {
      if (!apiService.isRecord(item)) {
        failures.push(`Published payload[${index}] must be an object`);
        continue;
      }
      if (typeof item.id !== 'number' && typeof item.id !== 'string') {
        failures.push(`Published payload[${index}].id must be a string or number`);
        continue;
      }
      const id = String(item.id);
      if (publishedById.has(id)) failures.push(`Published records contain duplicate id ${id}`);
      publishedById.set(id, item);
    }

    if (cmsApprovedById.size === 0) failures.push('CMS API returned no approved Home records to compare');
    if (publishedById.size === 0) failures.push('Published API returned no Home records to compare');

    const allIds = new Set([...cmsApprovedById.keys(), ...publishedById.keys()]);
    for (const id of allIds) {
      const cmsRecord = cmsApprovedById.get(id);
      const publishedRecord = publishedById.get(id);
      if (!cmsRecord || !publishedRecord) {
        stats.missing.push({
          path: `records[id=${id}]`,
          kind: 'missing',
          cmsValue: cmsRecord ? 'present' : '<missing>',
          publishedValue: publishedRecord ? 'present' : '<missing>',
        });
        continue;
      }

      for (const field of requiredContentFields) {
        if (!(field in cmsRecord)) {
          stats.missing.push({ path: `records[id=${id}].${field}`, kind: 'missing', cmsValue: '<missing>', publishedValue: publishedRecord[field] });
          continue;
        }
        if (!(field in publishedRecord)) {
          stats.missing.push({ path: `records[id=${id}].${field}`, kind: 'missing', cmsValue: cmsRecord[field], publishedValue: '<missing>' });
          continue;
        }
        if (['f_tamil_title', 'f_tamil_description', 'f_title', 'f_description'].includes(field) && apiService.isUnexpectedEmpty(cmsRecord[field])) {
          stats.unexpectedEmpty.push({ path: `records[id=${id}].${field}`, kind: 'unexpected-empty', cmsValue: cmsRecord[field], publishedValue: publishedRecord[field] });
        }
      }

      for (const field of Object.keys(cmsRecord)) {
        if (cmsMetadataFields.has(field) || field === 'f_approval_status') continue;
        apiService.compareValue(cmsRecord[field], publishedRecord[field], `records[id=${id}].${field}`, stats);
      }
      for (const field of Object.keys(publishedRecord)) {
        if (cmsMetadataFields.has(field) || field === 'f_approval_status' || field in cmsRecord) continue;
        stats.missing.push({ path: `records[id=${id}].${field}`, kind: 'missing', cmsValue: '<missing>', publishedValue: publishedRecord[field] });
      }
    }
  }

  const report = {
    endpoints: { cms: cmsHomeUrl, published: publishedHomeUrl },
    totalFieldsCompared: stats.compared,
    matchingFields: stats.matching,
    mismatchedFields: stats.mismatches,
    missingFields: stats.missing,
    unexpectedEmptyOrNullValues: stats.unexpectedEmpty,
    apiFailures: failures,
  };
  await testInfo.attach('cms-tamil-home-api-comparison.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });

  expect(failures, 'API failures or invalid response structures').toEqual([]);
  expect(stats.missing, 'Missing CMS/published fields or records').toEqual([]);
  expect(
    stats.mismatches,
    'CMS and published Tamil Home API content must match field by field'
  ).toEqual([]);
});
