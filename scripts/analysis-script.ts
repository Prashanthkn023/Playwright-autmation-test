interface ContactRecord {
  id: number;
  f_name: string;
  f_designation: string;
  f_phonenumber: string;
  f_address: string;
  f_faxnumber: string;
  f_email: string;
  f_updated_by?: number;
  f_created_by?: number;
  f_updated_on?: string;
  f_created_on?: string;
  f_approval_status?: string;
  f_status_updated_by?: number;
  f_status_updated_on?: string;
  f_tab?: string;
  f_tamil_name?: string | null;
  f_tamil_description?: string | null;
  f_approved_by?: number;
  f_approved_by_name?: string;
  f_approved_on?: string;
  f_action_type?: string;
  f_display_order?: number;
  [key: string]: string | number | null | undefined;
}

interface ApiResponse {
  status: number;
  payload: ContactRecord[];
}

const fs = require('fs');

function analyze() {
  const cmsRaw: ApiResponse = JSON.parse(fs.readFileSync('../artifacts/api-responses/cms-full.json'));
  const pubRaw: ApiResponse = JSON.parse(fs.readFileSync('../artifacts/api-responses/public-full.json'));

  if (!Array.isArray(cmsRaw.payload) || !Array.isArray(pubRaw.payload)) {
    console.error('Error: API payloads are not arrays');
    return;
  }

  const cmsData = cmsRaw.payload;
  const pubData = pubRaw.payload;
  const tamilRegex = /[஀-௿]/;

  const approvedCms = cmsData.filter((r: ContactRecord) => r.f_approval_status === 'APPROVED');
  const cmsIds = new Set(approvedCms.map((r: ContactRecord) => r.id));
  const pubIds = new Set(pubData.map((r: ContactRecord) => r.id));

  console.log('--- Tamil Contact Us Record Analysis Report ---\n');

  // Check missing records
  approvedCms.forEach((c: ContactRecord) => {
    if (!pubIds.has(c.id)) console.log(`[Missing] Record ID ${c.id}: In CMS, but NOT in Public API.`);
  });
  pubData.forEach((p: ContactRecord) => {
    if (!cmsIds.has(p.id)) console.log(`[Extra] Record ID ${p.id}: In Public API, but NOT in approved CMS.`);
  });

  // Compare matches
  approvedCms.forEach((c: ContactRecord) => {
    const p = pubData.find((r: ContactRecord) => r.id === c.id);
    if (!p) return;

    const fields = ['f_name', 'f_designation', 'f_phonenumber', 'f_address', 'f_faxnumber', 'f_email', 'f_tamil_name', 'f_tamil_description', 'f_display_order'];

    fields.forEach(f => {
      // 1. Sync check
      if (c[f] !== p[f]) {
        console.log(`[Sync Mismatch] Record ID ${c.id}, Field '${f}': CMS='${c[f]}', Public='${p[f]}'`);
      }

      // 2. Tamil specific checks (only for Tamil fields)
      if (f === 'f_tamil_name' || f === 'f_tamil_description') {
        const val = c[f];
        if (val === null || val === undefined) {
          console.log(`[Mandatory Check] Record ID ${c.id}, Field '${f}': Value is NULL/Undefined.`);
        } else if (typeof val === 'string') {
          if (val.trim() === '') {
            console.log(`[Content Check] Record ID ${c.id}, Field '${f}': Value is empty/whitespace.`);
          } else if (!tamilRegex.test(val)) {
            console.log(`[Content Check] Record ID ${c.id}, Field '${f}': No Tamil script found in '${val}'.`);
          }
        }
      }
    });
  });
}

analyze();
