const fs = require('fs');

function isTamil(str) {
  if (typeof str !== 'string' || !str) return false;
  return /[஀-௿]/.test(str);
}

function analyze() {
  try {
    const cmsData = JSON.parse(fs.readFileSync('cms-full.json', 'utf8'));
    const pubData = JSON.parse(fs.readFileSync('public-full.json', 'utf8'));

    if (!Array.isArray(cmsData.payload) || !Array.isArray(pubData.payload)) {
      console.error('Error: Data payloads are not arrays');
      return;
    }

    const cmsApproved = cmsData.payload.filter(r => r.f_approval_status === 'APPROVED');
    const pubRecords = pubData.payload;

    const cmsMap = new Map(cmsApproved.map(r => [r.id, r]));
    const pubMap = new Map(pubRecords.map(r => [r.id, r]));

    const missingInPub = [];
    const extraInPub = [];
    const mismatches = [];
    const verificationNeeded = [];

    // Check for missing in Pub and mismatches
    cmsMap.forEach((cmsRec, id) => {
      if (!pubMap.has(id)) {
        missingInPub.push(id);
      } else {
        const pubRec = pubMap.get(id);
        const fields = ['f_tamil_name', 'f_tamil_description'];

        fields.forEach(f => {
          const cmsVal = cmsRec[f];
          const pubVal = pubRec[f];

          // Check null, undefined, empty
          if (cmsVal == null || cmsVal === '' || /^\s*$/.test(cmsVal)) {
            verificationNeeded.push({id, field: f, val: cmsVal, type: 'CMS_NULL_OR_EMPTY'});
          }
          if (pubVal == null || pubVal === '' || /^\s*$/.test(pubVal)) {
            verificationNeeded.push({id, field: f, val: pubVal, type: 'PUB_NULL_OR_EMPTY'});
          }

          // Check Tamil script
          if (cmsVal && !isTamil(cmsVal)) {
            mismatches.push({id, field: f, val: cmsVal, reason: 'CMS_NO_TAMIL'});
          }
          if (pubVal && !isTamil(pubVal)) {
            mismatches.push({id, field: f, val: pubVal, reason: 'PUB_NO_TAMIL'});
          }

          // Compare
          if (cmsVal !== pubVal) {
             mismatches.push({id, field: f, cmsVal, pubVal, reason: 'MISMATCH'});
          }
        });
      }
    });

    // Check for extra in Pub
    pubMap.forEach((_, id) => {
      if (!cmsMap.has(id)) {
        extraInPub.push(id);
      }
    });

    console.log('--- Summary ---');
    console.log(`CMS Approved: ${cmsMap.size}`);
    console.log(`Public Records: ${pubMap.size}`);
    console.log(`Missing in Public: ${missingInPub.length}`);
    console.log(`Extra in Public: ${extraInPub.length}`);
    console.log(`Mismatches: ${mismatches.length}`);
    console.log(`Fields needing verification: ${verificationNeeded.length}`);

    console.log('\n--- Details ---');
    if (mismatches.length > 0) {
        console.log('Mismatches:', JSON.stringify(mismatches, null, 2));
    }
    if (verificationNeeded.length > 0) {
        console.log('Verification Needed:', JSON.stringify(verificationNeeded, null, 2));
    }

  } catch (e) {
    console.error('Error reading/parsing files:', e);
  }
}

analyze();
