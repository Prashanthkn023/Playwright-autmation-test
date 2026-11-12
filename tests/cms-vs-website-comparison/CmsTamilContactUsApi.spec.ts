import { expect, test } from '@playwright/test';
import { hasCmsSession, isLoginFormVisible } from '../../utils/cmsLogin';
import { TamilContactUsPage } from '../tamil-contact-us/TamilContactUsPage';

const cmsUrl = process.env.CMS_BASE_URL || 'https://cms.gctp.in/';
const cmsContactApi = 'https://gctp.in/api/fusion-cms-web-backend/contact-us?approvalStatus=all';
const publicContactApi = 'https://gctp.in/api/fusion-public-facing-web-backend/contact-us';

interface ContactRecord {
  f_name: string | null;
  f_designation: string | null;
  f_phonenumber: string | null;
  f_address: string | null;
  f_faxnumber: string | null;
  f_email: string | null;
  f_approval_status: string;
  f_tamil_name: string | null;
  f_tamil_description: string | null;
  f_display_order: number | null;
}

function isContactRecordsResponse(value: unknown): value is { payload: ContactRecord[] } {
  if (typeof value !== 'object' || value === null || !('payload' in value)) return false;
  return Array.isArray(value.payload) && value.payload.every(record =>
    typeof record === 'object' && record !== null &&
    'f_name' in record && (typeof record.f_name === 'string' || record.f_name === null) &&
    'f_designation' in record && (typeof record.f_designation === 'string' || record.f_designation === null) &&
    'f_phonenumber' in record && (typeof record.f_phonenumber === 'string' || record.f_phonenumber === null) &&
    'f_address' in record && (typeof record.f_address === 'string' || record.f_address === null) &&
    'f_faxnumber' in record && (typeof record.f_faxnumber === 'string' || record.f_faxnumber === null) &&
    'f_email' in record && (typeof record.f_email === 'string' || record.f_email === null) &&
    'f_approval_status' in record && typeof record.f_approval_status === 'string' &&
    'f_tamil_name' in record && (typeof record.f_tamil_name === 'string' || record.f_tamil_name === null) &&
    'f_tamil_description' in record && (typeof record.f_tamil_description === 'string' || record.f_tamil_description === null) &&
    'f_display_order' in record && (typeof record.f_display_order === 'number' || record.f_display_order === null)
  );
}

const normalize = (value: string | null) => (value ? value.trim().toLocaleLowerCase() : '');

function strictCompare(a: string | null, b: string | null, fieldName: string) {
  expect(a, `${fieldName} mismatch`).toBe(b);
}

function strictCompareTrimmed(a: string | null, b: string | null, fieldName: string) {
  expect((a || '').trim(), `${fieldName} (trimmed) mismatch`).toBe((b || '').trim());
}

test('TC-CON-05: Compare approved CMS Contact Us records with the Tamil public page', async ({ page }) => {
  // 1. Reuse and verify the saved authenticated CMS session.
  const cmsOrigin = new URL(cmsUrl);
  await page.goto(cmsOrigin.toString());
  const authenticated = await hasCmsSession(page, cmsOrigin.hostname) && !(await isLoginFormVisible(page));
  expect(authenticated, `A valid saved CMS session is required for ${cmsOrigin.origin}`).toBe(true);

  // 2. Get all CMS Contact Us records and published public Contact Us records.
  const cmsResponse = await page.request.get(cmsContactApi);
  expect(cmsResponse.ok(), 'CMS Contact Us API request should succeed with the saved session').toBeTruthy();
  const cmsBody: unknown = await cmsResponse.json();
  expect(isContactRecordsResponse(cmsBody), 'CMS API should return a Contact Us payload').toBe(true);
  if (!isContactRecordsResponse(cmsBody)) throw new Error('CMS Contact Us API returned an unexpected payload shape');

  const approvedRecords = cmsBody.payload.filter(record => record.f_approval_status.toUpperCase() === 'APPROVED');
  expect(approvedRecords.length, 'CMS API returned no approved Contact Us records to compare').toBeGreaterThan(0);

  const publicResponse = await page.request.get(publicContactApi);
  expect(publicResponse.ok(), 'Public Contact Us API request should succeed').toBeTruthy();
  const publicBody: unknown = await publicResponse.json();
  expect(isContactRecordsResponse(publicBody), 'Public API should return a Contact Us payload').toBe(true);
  if (!isContactRecordsResponse(publicBody)) throw new Error('Public Contact Us API returned an unexpected payload shape');

  // 3. Compare approved and public record counts and match each record by Tamil office name.
  expect(publicBody.payload).toHaveLength(approvedRecords.length);
  const publicByTamilName = new Map(publicBody.payload.map(record => [normalize(record.f_tamil_name), record]));
  for (const approved of approvedRecords) {
    const published = publicByTamilName.get(normalize(approved.f_tamil_name));
    expect(published, `Approved record "${approved.f_tamil_name}" must be available in the public API`).toBeDefined();
    if (!published) continue;

    // 4. Compare available contact and translated content fields without fixed live values.
    strictCompareTrimmed(published.f_name, approved.f_name, 'f_name');
    strictCompareTrimmed(published.f_designation, approved.f_designation, 'f_designation');
    strictCompareTrimmed(published.f_tamil_description, approved.f_tamil_description, 'f_tamil_description');
    strictCompareTrimmed(published.f_phonenumber, approved.f_phonenumber, 'f_phonenumber');
    strictCompareTrimmed(published.f_address, approved.f_address, 'f_address');
    strictCompareTrimmed(published.f_faxnumber, approved.f_faxnumber, 'f_faxnumber');
    strictCompareTrimmed(published.f_email, approved.f_email, 'f_email');
    strictCompare(published.f_display_order ? published.f_display_order.toString() : null, approved.f_display_order ? approved.f_display_order.toString() : null, 'f_display_order');
  }

  // 5. Compare the public Tamil API values with the values rendered on the page.
  const contactPage = new TamilContactUsPage(page);
  await contactPage.openInTamil();
  const renderedRows = contactPage.table.locator('tbody tr');
  await expect(renderedRows).toHaveCount(publicBody.payload.length);
  for (const record of publicBody.payload) {
    const row = renderedRows.filter({ hasText: record.f_tamil_name || '' });
    await expect(row, `Public record "${record.f_tamil_name}" should appear in the rendered table`).toHaveCount(1);

    // Validate rendered cells
    if (record.f_tamil_name) await expect(row.locator('td').nth(0)).toHaveText(record.f_tamil_name);
    else await expect(row.locator('td').nth(0)).toBeEmpty();

    if (record.f_tamil_description) await expect(row.locator('td').nth(1)).toHaveText(record.f_tamil_description);
    else await expect(row.locator('td').nth(1)).toBeEmpty();

    if (record.f_phonenumber) await expect(row.locator('td').nth(2)).toHaveText(record.f_phonenumber.trim());
    else await expect(row.locator('td').nth(2)).toBeEmpty();

    if (record.f_email) await expect(row.locator('td').nth(3)).toHaveText(record.f_email.trim());
    else await expect(row.locator('td').nth(3)).toBeEmpty();
  }
});
