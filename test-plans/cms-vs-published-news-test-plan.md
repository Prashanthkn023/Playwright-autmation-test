# CMS vs Public News Updates Comparison Test Plan

## Application Overview

Compare approved News records from the authenticated CMS source with published records on https://gctp.in/chennai-news-updates. The explored public and CMS-rendered pages expose three news cards. Each card has a title, summary/description, image, and Read More action; each detail view exposes a full title, full description/body, and image. The CMS page itself does not visibly expose approval controls, so approved status must be obtained from the CMS data/API or an authenticated CMS record view. Use a fresh browser context for each scenario, secure credentials from environment variables, and never print credentials.

## Test Scenarios

### 1. CMS Authentication and Approved Records

**Seed:** `tests/Cmsnews.spec.ts`

#### 1.1. Authenticate to CMS News source

**File:** `tests/cms-news/authentication.spec.ts`

**Steps:**
  1. Start from a fresh browser context and navigate to the configured CMS News route, expected to be https://cms.gctp.in/chennai-news-updates or the project-configured CMS News route.
    - expect: The CMS login boundary is displayed when no authenticated session exists.
    - expect: Username, password, Login, and password-visibility controls are available.
    - expect: News content is not treated as collected before authentication.
  2. Submit credentials from secure environment variables and complete login.
    - expect: Authentication succeeds without exposing credentials in console output, screenshots, traces, or attachments.
    - expect: The authenticated CMS session is established and the CMS News route becomes accessible.
  3. Dismiss the Awareness popup if it appears, using the visible .flash-close-btn or the project popup helper.
    - expect: The popup overlay is hidden before News controls are used.
    - expect: No popup remains over the page or blocks navigation.

#### 1.2. Collect only approved CMS News records

**File:** `tests/cms-news/collect-approved-records.spec.ts`

**Steps:**
  1. Open the authenticated CMS News record view or CMS News API and retrieve all News records.
    - expect: The source returns a non-empty record collection or the test fails with a clear source error.
    - expect: Each record can be identified by a stable title, ID, slug, or equivalent key.
  2. Filter the source to records with approved/published status; exclude drafts, rejected records, deleted records, and CMS-only test records.
    - expect: Only approved records are used as the CMS expected set.
    - expect: Approval filtering is explicit and recorded in diagnostics without leaking credentials.
  3. For each approved record, collect title, summary/description, image URL or filename, detail title, detail body/content, detail image URL or filename, publish status, and source order.
    - expect: The CMS expected record schema contains all comparison fields.
    - expect: Missing required fields are reported against the record identity rather than silently converted to passing empty values.
    - expect: CMS-only IDs, timestamps, editor names, and approval metadata are retained only for diagnostics and are excluded from parity equality.

### 2. Published News Collection

**Seed:** `tests/Cmsnews.spec.ts`

#### 2.1. Collect published News cards

**File:** `tests/cms-news/collect-published-cards.spec.ts`

**Steps:**
  1. From a fresh browser context, navigate to https://gctp.in/chennai-news-updates.
    - expect: The URL matches /chennai-news-updates.
    - expect: The page title is Greater Chennai Traffic Police - GCTP.
    - expect: The page loads without a blocking popup after the popup helper runs.
  2. Collect every visible News card in DOM order, not only the three currently known titles.
    - expect: The public collection contains the visible News records in display order.
    - expect: For each card, collect title, summary/description, image alt/src, Read More presence, and the card index.
    - expect: The collection includes the currently observed titles: Traffic Diversion and U-Turn Restrictions in OMR and Thuraipakkam Area, Pending E-Challan Fine Verification, and Mega Bike Rally for Road Safety, unless CMS data has legitimately changed.
  3. Validate each card image and action control.
    - expect: Each News card has one visible image with a non-empty source and a meaningful accessible name or title association.
    - expect: Each News card has a visible Read More control.
    - expect: Broken images or missing controls fail with the associated title and image URL.

#### 2.2. Collect published detail records

**File:** `tests/cms-news/collect-published-details.spec.ts`

**Steps:**
  1. For each published News card, click Read More and wait for the detail view to load.
    - expect: A detail view opens for the selected record.
    - expect: The detail view exposes a Go back control or an equivalent route/history return path.
    - expect: The detail title is visible and associated with the selected card.
  2. Collect the detail title, complete description/body text, detail image alt/src, and detail URL or route.
    - expect: The detail title is non-empty.
    - expect: The detail body is non-empty and is captured in normalized text form.
    - expect: The detail image is visible, has a non-empty source, and is associated with the selected article.
    - expect: The detail route or stable identity can be mapped back to the source card.
  3. Return to the News listing and repeat for every published card.
    - expect: The listing returns in the same order without duplicates or missing records.
    - expect: Every card has exactly one collected detail record.
    - expect: A failure identifies the specific title, card index, and detail route.

### 3. CMS to Public News Parity

**Seed:** `tests/Cmsnews.spec.ts`

#### 3.1. Compare CMS approved records with public News records

**File:** `tests/cms-news/cms-public-parity.spec.ts`

**Steps:**
  1. Build the CMS expected set from approved records and the public actual set from visible News cards and details.
    - expect: Both sets are non-empty before comparison.
    - expect: Records are matched by stable slug/ID when available; otherwise use normalized title and report ambiguous duplicate titles as a failure.
  2. Compare total record count.
    - expect: The number of approved CMS records equals the number of published public records.
    - expect: If counts differ, report records missing from public and unexpected public records separately.
  3. Compare record order.
    - expect: The order of matched public records equals the CMS approved source order.
    - expect: Order differences identify the first differing index and both record identities.
  4. Compare card titles and descriptions.
    - expect: Each public title equals the corresponding CMS title after whitespace and HTML normalization.
    - expect: Each public summary/description equals the CMS summary/description after whitespace, HTML entity, and line-break normalization.
    - expect: Differences include the record title and both normalized values.
  5. Compare card and detail images.
    - expect: CMS and public image identity matches by normalized filename, stable media ID, or URL path; ignore host differences between CMS and public domains.
    - expect: Missing, changed, or broken images identify the record and both image sources.
  6. Compare detail content.
    - expect: The public detail title equals the CMS detail title after normalization.
    - expect: The public full detail body equals the CMS detail body after normalization.
    - expect: The public detail image matches the CMS detail image identity.
    - expect: A detail mismatch identifies the record and whether title, body, or image differs.
  7. Attach a comparison report and assert parity.
    - expect: The report includes CMS count, public count, order mismatches, missing records, unexpected records, and field-level differences.
    - expect: The test passes only when count, order, title, description, image, and detail content all match.
    - expect: CMS-only metadata is not incorrectly reported as a public-content mismatch.

#### 3.2. Unpublished and Missing Content Handling

**File:** `tests/cms-news/unpublished-and-missing-content.spec.ts`

**Steps:**
  1. Use a CMS dataset containing at least one non-approved record, or mock the CMS source response with a draft/rejected record.
    - expect: The non-approved record is excluded from the CMS expected set.
    - expect: The test does not fail merely because the non-approved record is absent from the public page.
  2. Remove or simulate removal of an approved record from the public response while leaving it approved in CMS.
    - expect: The parity test fails with a clear missing-public-record diagnostic.
    - expect: The failure names the CMS record and its expected title/identity.
  3. Change or simulate a mismatch in a title, description, image, or detail body.
    - expect: The parity test fails only the affected field comparison.
    - expect: The failure report contains CMS and public values after normalization.
  4. Return an empty CMS or public collection, or a response with missing required fields.
    - expect: The test fails as a data-source/contract failure rather than passing on two empty arrays.
    - expect: The failure identifies the empty source or missing field and does not produce misleading parity success.

### 4. News Navigation and Regression

**Seed:** `tests/Cmsnews.spec.ts`

#### 4.1. Verify News detail navigation remains usable

**File:** `tests/cms-news/detail-navigation.spec.ts`

**Steps:**
  1. Open each public News detail and use the Go back control once.
    - expect: The browser returns to /chennai-news-updates.
    - expect: The News listing remains populated and ordered.
    - expect: No duplicate cards, blank state, or blocking popup appears.
  2. Reload the listing and revisit the first and last News records.
    - expect: The same records are available after reload.
    - expect: The detail title, body, image, and return control remain usable.
