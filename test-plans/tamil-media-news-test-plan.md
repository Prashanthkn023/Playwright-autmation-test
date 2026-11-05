# Tamil Media and News Test Plan

## Scope

This plan covers only the Tamil-language Media and News modules on the GCTP public website. The CMS admin website is used only for approved-record API comparisons with the saved authenticated session.

## Application URLs

- Public website: `https://gctp.in`
- Media page: `https://gctp.in/chennai-media`
- News page: `https://gctp.in/chennai-news-updates`
- Public Media API: `https://gctp.in/api/fusion-public-facing-web-backend/media`
- Public News API: `https://gctp.in/api/fusion-public-facing-web-backend/news-and-updates`
- CMS Media API: `https://gctp.in/api/fusion-cms-web-backend/media?approvalStatus=all`
- CMS News API: `https://gctp.in/api/fusion-cms-web-backend/news-and-updates?approvalStatus=all`

## Approach

- Reuse the saved CMS session from `auth.setup`.
- Switch the public website from English to Tamil through the language control.
- Use Page Object Model classes for navigation, locators and actions.
- Keep expected Tamil labels in a separate data file.
- Use Playwright web-first assertions and dynamic waits.
- Compare CMS and public records by API field values, without hardcoding live titles or counts.
- Report an approved-record absence clearly rather than failing for the wrong reason.

## Test Data

- Tamil language name: `தமிழ்`
- Media navigation text: `ஊடகம்`
- News navigation text: `செய்திகள்`
- News read-more text: `மேலும் வாசிக்க`
- Tamil script check: text must contain characters in the Tamil Unicode range.

## Media Scenarios

### TC-MED-01: Validate Media content in Tamil

**File:** `tests/tamil-media-news/tamil-media.spec.ts`

**Steps:**
1. Open the GCTP website and switch to Tamil.
2. Open the Media page.
3. Open the photos section.
4. Verify photo titles and captions contain Tamil content.
5. Open the videos section.
6. Verify video titles and captions contain Tamil content.

**Expected result:** Photos and videos show their titles and captions in Tamil.

### TC-MED-02: Verify Media UI layout and images

**File:** `tests/tamil-media-news/tamil-media.spec.ts`

**Steps:**
1. Open the Media page in Tamil.
2. Open the photos section.
3. Scroll through every photo card.
4. Verify every thumbnail is loaded.
5. Repeat the process for videos.
6. Check visible cards for overlapping layout.

**Expected result:** All thumbnails load and Media cards do not overlap or show broken images.

### TC-MED-03: Open a photo and a video

**File:** `tests/tamil-media-news/tamil-media.spec.ts`

**Steps:**
1. Open the Media page in Tamil.
2. Open one photo item.
3. Verify the larger photo view and Tamil title.
4. Close or return to the photos list.
5. Open the videos section and open one video.
6. Verify the video opens and displays its Tamil title.

**Expected result:** A photo and a video open correctly with Tamil content.

### TC-MED-04: Compare approved CMS media with the Media page

**File:** `tests/tamil-media-news/tamil-media.spec.ts`

**Steps:**
1. Get approved photo and video records from the CMS Media API.
2. Get Media records from the public Media API.
3. Compare photo and video counts.
4. Match each approved record by title.
5. Compare title, link, section and other available content fields.

**Expected result:** Approved CMS Media records match the public Media records field by field.

### TC-MED-05: Complete Tamil Media user journey

**File:** `tests/tamil-media-news/tamil-media.spec.ts`

**Steps:**
1. Open the website and switch to Tamil.
2. Open the Media page.
3. Open every photo item and verify its content.
4. Return to the Media page.
5. Open the videos section.
6. Open every video item and verify its content.

**Expected result:** The complete Tamil Media journey works without navigation or content errors.

## News Scenarios

### TC-NEWS-01: Validate News content in Tamil

**File:** `tests/tamil-news/tc-news-01-content.spec.ts`

**Steps:**
1. Open the GCTP website and switch to Tamil.
2. Open the News page.
3. Verify every news heading contains Tamil content.
4. Verify each displayed date.
5. Verify each displayed summary contains Tamil content.

**Expected result:** News headings, dates and summaries are shown correctly.

### TC-NEWS-02: Verify News UI layout and images

**File:** `tests/tamil-news/tc-news-02-layout.spec.ts`

**Steps:**
1. Open the News page in Tamil.
2. Scroll through every News card.
3. Verify each card is visible.
4. Verify every card image loads.
5. Check visible cards for overlapping layout.

**Expected result:** News cards and images load correctly without broken or overlapping content.

### TC-NEWS-03: Open a News item

**File:** `tests/tamil-news/tc-news-03-open-item.spec.ts`

**Steps:**
1. Open the News page in Tamil.
2. Select a News item.
3. Verify the full heading.
4. Verify the full Tamil content.
5. Verify the detail image, if supplied.

**Expected result:** The selected News item opens and shows its complete Tamil content.

### TC-NEWS-04: Compare approved CMS News with the News page

**File:** `tests/tamil-news/tc-news-04-cms-public-comparison.spec.ts`

**Steps:**
1. Get approved News records from the CMS News API.
2. Get News records from the public News API.
3. Compare record counts.
4. Match records by heading.
5. Compare heading, date, summary, detail text and image fields.

**Expected result:** Approved CMS News records match the public News records field by field.

### TC-NEWS-05: Complete Tamil News user journey

**File:** `tests/tamil-news/tc-news-05-news-journey.spec.ts`

**Steps:**
1. Open the website and switch to Tamil.
2. Open the News page.
3. Open every News item one by one.
4. Verify the full Tamil heading and text for each item.
5. Return to the News list.

**Expected result:** The complete Tamil News journey works without navigation or content errors.

## Risks

- Live CMS or public records can change during execution.
- Media and News APIs may contain no approved records or incomplete fields.
- Tamil labels or dynamic layouts may differ by breakpoint.
- Lazy-loaded thumbnails and embeds may need content-based waits.
- CMS session expiration can affect API comparisons.

## Automation Limitations

- No login steps are included because authentication is supplied by the saved session.
- Pixel-perfect overlap testing is not included; layout validation uses element bounds and visibility.
- Video playback quality and third-party embed availability depend on external providers.
- CMS approval status and live content are treated as dynamic test data.

## Seed

Use `tests/cms-abt-tamil/01-content-validation.spec.ts` only as the pattern for the existing Tamil About Us implementation.
