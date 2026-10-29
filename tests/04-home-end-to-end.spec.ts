import { test, expect } from '../fixtures/baseTest';
import { CmsTamilHomeApi, type JsonValue, type ComparisonStats } from '../apis/CmsTamilHomeApi';

test.describe('Tamil Home Module – 04 End-to-End Workflow Validation', () => {
  test('Complete Tamil Home Module User Journey E2E', async ({ cmsTamil, request }) => {
    test.setTimeout(240000);

    // Step 1: Open Home Page and Switch Language to Tamil
    await cmsTamil.navigateToTamil();

    // Step 2: Verify Tamil language selection
    await cmsTamil.verifyTamilLanguageSelected('HOME_E2E');

    // Step 3: Validate key Home Page content
    await cmsTamil.verifyHelplineTamil('HOME_E2E');
    await cmsTamil.verifyTrafficUpdatesTamil('HOME_E2E');
    await cmsTamil.verifyImportantLinksTamil('HOME_E2E');
    await cmsTamil.verifyFooterLinksTamil('HOME_E2E');

    // Step 4: Verify Home Page Sliders and their images
    await cmsTamil.verifyHomePageSlidersTamil('HOME_E2E');

    // Step 5: Verify Education and Information content and images
    await cmsTamil.verifyEducationSectionTamil('HOME_E2E');

    // Step 6: Validate other relevant Home sections
    await cmsTamil.verifyImagesLoadedTamil('HOME_E2E');

    // Step 7: Confirm that the CMS-versus-published-data comparison passes using API service
    const apiService = new CmsTamilHomeApi(request);
    const failures: string[] = [];
    const stats: ComparisonStats = { compared: 0, matching: 0, mismatches: [], missing: [], unexpectedEmpty: [] };

    const cmsResponse = await apiService.getCmsHome('E2E - CMS Home API Check', 'HOME_E2E');
    const publishedResponse = await apiService.getPublishedHome('E2E - Published Home API Check', 'HOME_E2E');

    const cmsEnvelope = await apiService.getJsonResponse(cmsResponse, 'CMS Home API', failures, 'E2E - CMS Home API Check', 'HOME_E2E');
    const publishedEnvelope = await apiService.getJsonResponse(publishedResponse, 'Published Home API', failures, 'E2E - Published Home API Check', 'HOME_E2E');

    expect(cmsEnvelope).not.toBeNull();
    expect(publishedEnvelope).not.toBeNull();

    if (cmsEnvelope && publishedEnvelope) {
      const cmsPayload = cmsEnvelope.payload as JsonValue[];
      const publishedPayload = publishedEnvelope.payload as JsonValue[];

      const cmsApprovedById = new Map<string, { [key: string]: JsonValue }>();
      for (const item of cmsPayload) {
        if (apiService.isRecord(item) && item.f_approval_status === 'APPROVED' && (typeof item.id === 'number' || typeof item.id === 'string')) {
          cmsApprovedById.set(String(item.id), item);
        }
      }

      const publishedById = new Map<string, { [key: string]: JsonValue }>();
      for (const item of publishedPayload) {
        if (apiService.isRecord(item) && (typeof item.id === 'number' || typeof item.id === 'string')) {
          publishedById.set(String(item.id), item);
        }
      }

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

        for (const field of ['f_tamil_title', 'f_tamil_description'] as const) {
          if (!(field in cmsRecord) || !(field in publishedRecord)) {
            stats.missing.push({
              path: `records[id=${id}].${field}`,
              kind: 'missing',
              cmsValue: field in cmsRecord ? cmsRecord[field] : '<missing>',
              publishedValue: field in publishedRecord ? publishedRecord[field] : '<missing>',
            });
            continue;
          }
          apiService.compareValue(cmsRecord[field], publishedRecord[field], `records[id=${id}].${field}`, stats, 'E2E - CMS vs Published Home Comparison', 'HOME_E2E');
        }
      }
    }

    expect(failures, 'API failures or invalid response structures').toEqual([]);
    expect(stats.missing, 'Missing CMS or published records/fields').toEqual([]);
    expect(stats.mismatches, 'CMS and published Tamil Home API content must match field by field').toEqual([]);

    // Step 8: Final page state validation
    await cmsTamil.verifyURL('https://gctp.in/chennai-home');
  });
});
