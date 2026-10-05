import { expect, test } from '@playwright/test';
import {
  CmsNewsPage,
  NewsRecord,
} from '../pages/CmsNewsPage';
import { loginToConfiguredCms } from '../utils/cmsLogin';

// ============================================================
// NORMALIZE COMPARISON VALUE
// ============================================================

const normalizeComparisonValue = (
  value: string | undefined | null
): string => {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ============================================================
// NORMALIZE TITLE FOR MATCHING
// ============================================================

const normalizeTitle = (
  value: string | undefined | null
): string => {
  return normalizeComparisonValue(value).toLowerCase();
};

// ============================================================
// COMPARE CMS NEWS WITH PUBLIC NEWS
// ============================================================

const getComparisonDifferences = (
  cmsRecords: NewsRecord[],
  publicRecords: NewsRecord[]
): string[] => {
  const differences: string[] = [];

  // ----------------------------------------------------------
  // Create public News lookup using title
  // ----------------------------------------------------------

  const publicByTitle = new Map<string, NewsRecord>();

  for (const publicRecord of publicRecords) {
    const title = normalizeTitle(
      publicRecord.title
    );

    if (!title) {
      continue;
    }

    publicByTitle.set(
      title,
      publicRecord
    );
  }

  // ----------------------------------------------------------
  // Compare every CMS record with matching public record
  // ----------------------------------------------------------

  for (const cmsRecord of cmsRecords) {
    const cmsTitle = normalizeTitle(
      cmsRecord.title
    );

    // --------------------------------------------------------
    // CMS record does not have a valid title
    // --------------------------------------------------------

    if (!cmsTitle) {
      differences.push(
        `CMS record has an empty title: ${JSON.stringify(cmsRecord)}`
      );

      continue;
    }

    // --------------------------------------------------------
    // Find matching public News
    // --------------------------------------------------------

    const publicRecord =
      publicByTitle.get(cmsTitle);

    if (!publicRecord) {
      differences.push(
        `Missing public record: title="${cmsRecord.title}"`
      );

      continue;
    }

    // --------------------------------------------------------
    // Compare News fields
    // --------------------------------------------------------

    const fields = [
      'title',
      'description',
      'image',
      'detailTitle',
      'detailBody',
      'detailImage',
    ] as const;

    for (const field of fields) {
      const cmsValue =
        normalizeComparisonValue(
          cmsRecord[field]
        );

      const publicValue =
        normalizeComparisonValue(
          publicRecord[field]
        );

      if (cmsValue !== publicValue) {
        differences.push(
          `Title="${cmsRecord.title}" ${field}: CMS="${cmsRecord[field]}"; public="${publicRecord[field]}"`
        );
      }
    }
  }

  // ----------------------------------------------------------
  // Find records that exist only on public website
  // ----------------------------------------------------------

  const cmsTitles = new Set(
    cmsRecords
      .map((record) =>
        normalizeTitle(record.title)
      )
      .filter(Boolean)
  );

  for (const publicRecord of publicRecords) {
    const publicTitle = normalizeTitle(
      publicRecord.title
    );

    if (
      publicTitle &&
      !cmsTitles.has(publicTitle)
    ) {
      differences.push(
        `Extra public record: title="${publicRecord.title}"`
      );
    }
  }

  // ----------------------------------------------------------
  // Return all differences
  // ----------------------------------------------------------

  return differences;
};

// ============================================================
// CMS NEWS VS PUBLIC NEWS TEST
// ============================================================

test(
  'compare CMS approved News with public News',
  async ({ page }) => {
    const newsPage =
      new CmsNewsPage(page);

    // ========================================================
    // STEP 1 - LOGIN TO CMS
    // ========================================================

    console.log('');
    console.log(
      '=============================================='
    );
    console.log(
      'CMS NEWS VALIDATION STARTED'
    );
    console.log(
      '=============================================='
    );

    console.log(
      'CMS URL:',
      newsPage.cmsNewsUrl
    );

    await loginToConfiguredCms(
      page,
      newsPage.cmsNewsUrl
    );

    // ========================================================
    // STEP 2 - OPEN CMS NEWS
    // ========================================================

    console.log('');
    console.log(
      '========== CMS NEWS =========='
    );

    await newsPage.openCmsNewsPage();

    console.log(
      'CMS Listing URL:',
      newsPage.cmsListingUrl
    );

    console.log(
      'Current URL:',
      page.url()
    );

    // ========================================================
    // STEP 3 - COLLECT CMS NEWS
    // ========================================================

    const cmsRecords =
      await newsPage.collectNewsRecords(
        newsPage.cmsListingUrl
      );

    console.log(
      'CMS News Records:',
      cmsRecords.length
    );

    console.log(
      'CMS News Titles:'
    );

    cmsRecords.forEach(
      (record, index) => {
        console.log(
          `  ${index + 1}. ${record.title}`
        );
      }
    );

    console.log(
      '=============================='
    );

    expect(
      cmsRecords.length,
      'CMS News records should not be empty'
    ).toBeGreaterThan(0);

    // ========================================================
    // STEP 4 - OPEN PUBLIC NEWS
    // ========================================================

    console.log('');
    console.log(
      '========== PUBLIC NEWS =========='
    );

    await newsPage.openPublicNewsPage();

    console.log(
      'Public News URL:',
      newsPage.publicNewsUrl
    );

    console.log(
      'Current URL:',
      page.url()
    );

    // ========================================================
    // STEP 5 - COLLECT PUBLIC NEWS
    // ========================================================

    const publicRecords =
      await newsPage.collectNewsRecords(
        newsPage.publicNewsUrl
      );

    console.log(
      'Public News Records:',
      publicRecords.length
    );

    console.log(
      'Public News Titles:'
    );

    publicRecords.forEach(
      (record, index) => {
        console.log(
          `  ${index + 1}. ${record.title}`
        );
      }
    );

    console.log(
      '================================'
    );

    expect(
      publicRecords.length,
      'Public News records should not be empty'
    ).toBeGreaterThan(0);

    // ========================================================
    // STEP 6 - COMPARE CMS AND PUBLIC NEWS
    // ========================================================

    console.log('');
    console.log(
      '========== NEWS COMPARISON =========='
    );

    console.log(
      `CMS records   : ${cmsRecords.length}`
    );

    console.log(
      `Public records: ${publicRecords.length}`
    );

    console.log(
      'Matching records by News title...'
    );

    const differences =
      getComparisonDifferences(
        cmsRecords,
        publicRecords
      );

    // ========================================================
    // STEP 7 - PRINT COMPARISON RESULT
    // ========================================================

    if (differences.length === 0) {
      console.log('');
      console.log(
        '=============================================='
      );
      console.log(
        'NEWS VALIDATION PASSED'
      );
      console.log(
        'CMS and Public News content match.'
      );
      console.log(
        '=============================================='
      );
    } else {
      console.log('');
      console.log(
        '=============================================='
      );
      console.log(
        'NEWS VALIDATION FAILED'
      );
      console.log(
        `Total Differences: ${differences.length}`
      );
      console.log(
        '=============================================='
      );

      differences.forEach(
        (difference, index) => {
          console.log(
            `${index + 1}. ${difference}`
          );
        }
      );

      console.log(
        '=============================================='
      );
    }

    // ========================================================
    // STEP 8 - ATTACH DIFFERENCES TO ALLURE
    // ========================================================

    await test.info().attach(
      'news-comparison-differences',
      {
        body:
          differences.length > 0
            ? differences.join('\n')
            : 'No content differences found.',
        contentType: 'text/plain',
      }
    );

    // ========================================================
    // STEP 9 - ATTACH CMS NEWS DATA
    // ========================================================

    await test.info().attach(
      'cms-news-records',
      {
        body: JSON.stringify(
          cmsRecords,
          null,
          2
        ),
        contentType: 'application/json',
      }
    );

    // ========================================================
    // STEP 10 - ATTACH PUBLIC NEWS DATA
    // ========================================================

    await test.info().attach(
      'public-news-records',
      {
        body: JSON.stringify(
          publicRecords,
          null,
          2
        ),
        contentType: 'application/json',
      }
    );

    // ========================================================
    // STEP 11 - FINAL ASSERTION
    // ========================================================

    expect(
      differences,
      'CMS and public News content should match'
    ).toEqual([]);
  }
);