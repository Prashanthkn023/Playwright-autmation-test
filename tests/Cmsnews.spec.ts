import { expect, test } from '@playwright/test';
import { CmsNewsPage, NewsRecord } from '../pages/CmsNewsPage';
import { loginToConfiguredCms } from '../utils/cmsLogin';

const normalizeComparisonValue = (value: string) => value.replace(/\s+/g, ' ').trim();

const getComparisonDifferences = (expected: NewsRecord[], actual: NewsRecord[]) => {
  const differences: string[] = [];

  if (expected.length !== actual.length) {
    differences.push(`Count: CMS=${expected.length}; public=${actual.length}`);
  }

  for (let index = 0; index < Math.max(expected.length, actual.length); index++) {
    const cmsRecord = expected[index];
    const publicRecord = actual[index];

    if (!cmsRecord || !publicRecord) {
      differences.push(`Order/record ${index + 1}: CMS=${JSON.stringify(cmsRecord ?? null)}; public=${JSON.stringify(publicRecord ?? null)}`);
      continue;
    }

    for (const field of ['title', 'description', 'image', 'detailTitle', 'detailBody', 'detailImage'] as const) {
      if (normalizeComparisonValue(cmsRecord[field]) !== normalizeComparisonValue(publicRecord[field])) {
        differences.push(`Record ${index + 1} ${field}: CMS="${cmsRecord[field]}"; public="${publicRecord[field]}"`);
      }
    }
  }

  return differences;
};

test('compare CMS approved News with public News', async ({ page }) => {
  const newsPage = new CmsNewsPage(page);

  await loginToConfiguredCms(page, newsPage.cmsNewsUrl);
  await newsPage.openCmsNewsPage();
  const cmsRecords = await newsPage.collectNewsRecords(newsPage.cmsListingUrl);
  console.log('========== CMS NEWS DEBUG ==========');
  console.log('CMS News URL:', newsPage.cmsListingUrl);
  console.log('Current URL:', page.url());
  console.log('CMS News Records:', cmsRecords.length);
  console.log('====================================');
  expect(cmsRecords.length, 'CMS News records should not be empty').toBeGreaterThan(0);

  await newsPage.openPublicNewsPage();
  const publicRecords = await newsPage.collectNewsRecords(newsPage.publicNewsUrl);
  expect(publicRecords.length, 'Public News records should not be empty').toBeGreaterThan(0);

  const differences = getComparisonDifferences(cmsRecords, publicRecords);
  await test.info().attach('news-comparison-differences', {
    body: differences.length ? differences.join('\n') : 'No content differences found.',
    contentType: 'text/plain',
  });

  expect(differences, 'CMS and public News content should match').toEqual([]);
});
