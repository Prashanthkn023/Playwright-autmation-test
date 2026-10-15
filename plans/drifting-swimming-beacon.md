# Plan: Fix Jenkins Playwright Test Failures

## Context
The GCTP-Playwright project has three persistent test failures in Jenkins that need investigation and resolution.
1. `tests/CmsABT.tamil.spec.ts`: Tamil language selector click times out.
2. `tests/CmsMedia.spec.ts`: Content mismatch between CMS and public media pages.
3. `tests/Cmsnews.spec.ts`: Locator timeout for news card headings.

The goal is to fix these issues using robust selectors and proper waiting mechanisms, adhering to the project's existing patterns, and avoiding brittle workarounds like `force: true` or arbitrary sleeps.

## Proposed Changes

### 1. Fix Tamil About Us Test (`tests/CmsABT.tamil.spec.ts`)
- **Problem**: Language selector click times out due to potential interference from popups.
- **Approach**:
  - Update `selectTamil` to implement a more robust `waitFor` mechanism for the language selector combobox.
  - Before clicking, ensure the `.flash-popup-overlay` is not obstructing interaction.
  - Improve the interaction logic by checking if the element is interactable before clicking.

### 2. Fix CMS Media Test (`tests/CmsMedia.spec.ts`)
- **Problem**: Content mismatch in `verify CMS media content matches the public website`.
- **Approach**:
  - Update `getVisibleMediaRecords` to correctly target the parent container that holds both the image and the text content.
  - Enhance content normalization logic in `getVisibleMediaRecords` to match API formatting, specifically focusing on handling `Read More` text and whitespace differences.
  - Ensure the content comparison logic accounts for potential DOM structure discrepancies.

### 3. Fix CMS News Test (`tests/Cmsnews.spec.ts` & `pages/CmsNewsPage.ts`)
- **Problem**: Locator timeout when retrieving news card headings.
- **Approach**:
  - Update `pages/CmsNewsPage.ts` to use more resilient locators for news cards (e.g., avoid relying strictly on text in selectors where possible).
  - Enhance `collectNewsRecords` in `CmsNewsPage.ts` to use a more robust waiting strategy to ensure news cards are rendered before inspection.

## Verification
- Run individual tests:
  - `npx playwright test tests/CmsABT.tamil.spec.ts`
  - `npx playwright test tests/CmsMedia.spec.ts`
  - `npx playwright test tests/Cmsnews.spec.ts`
- Run the full suite to ensure no regressions: `npx playwright test`.
- Verify TypeScript compilation: `npx tsc --noEmit`.
