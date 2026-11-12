const fs = require('fs');

function checkDuplicates(data, label) {
    const ids = data.map(r => r.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.log(`${label} duplicates: ${duplicates.length > 0 ? JSON.stringify(duplicates) : 'None'}`);
}

function analyze() {
    const cmsRaw = JSON.parse(fs.readFileSync('../artifacts/api-responses/cms-full.json', 'utf8')).payload;
    const pubRaw = JSON.parse(fs.readFileSync('../artifacts/api-responses/public-full.json', 'utf8')).payload;

    const cmsApproved = cmsRaw.filter(r => r.f_approval_status === 'APPROVED');

    checkDuplicates(cmsApproved, 'CMS');
    checkDuplicates(pubRaw, 'Public');

    const cmsMap = new Map(cmsApproved.map(r => [r.id, r]));
    const pubMap = new Map(pubRaw.map(r => [r.id, r]));

    const cmsIds = Array.from(cmsMap.keys()).sort();
    const pubIds = Array.from(pubMap.keys()).sort();

    console.log('CMS IDs:', JSON.stringify(cmsIds));
    console.log('Public IDs:', JSON.stringify(pubIds));

    const fields = [
      'f_name', 'f_designation', 'f_phonenumber', 'f_address',
      'f_faxnumber', 'f_email', 'f_tab', 'f_tamil_name',
      'f_tamil_description', 'f_display_order'
    ];
    console.log('Fields Checked:', JSON.stringify(fields));

    const results = {
        missingIds: [],
        extraIds: [],
        fieldMismatches: []
    };

    cmsIds.forEach(id => {
        if (!pubMap.has(id)) results.missingIds.push(id);
    });
    pubIds.forEach(id => {
        if (!cmsMap.has(id)) results.extraIds.push(id);
    });

    const commonIds = cmsIds.filter(id => pubMap.has(id));

    commonIds.forEach(id => {
        const cms = cmsMap.get(id);
        const pub = pubMap.get(id);
        fields.forEach(f => {
            if (cms[f] !== pub[f]) {
                results.fieldMismatches.push({
                    id,
                    field: f,
                    cmsVal: cms[f],
                    pubVal: pub[f]
                });
            }
        });
    });

    console.log('Results:', JSON.stringify(results, null, 2));
}
analyze();
