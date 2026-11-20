# Fix for Jenkins Flash Popup Failures

## Issue
The `.flash-popup-overlay` element was appearing after navigation to `/chennai-home` and blocking clicks on:
- Tamil Contact Us link (`'தொடர்பு'`)
- Tamil language option (`'தமிழ்'`)

## Root Cause
The flash popup appeared asynchronously after navigation, blocking pointer events before tests could interact with elements.

## Solution
Reused existing `closeAwarenessPopup` utility to ensure popup dismissal before element interaction:

### Changes Made

#### 1. `tests/tamil-contact-us/evidence-review.spec.ts` (lines 37-38)
- Added `await closeAwarenessPopup(page);` after `await page.goto('/chennai-home');`
- Ensures popup is dismissed before any further interaction

#### 2. `tests/tamil-contact-us/TamilContactUsPage.ts` (line 15)
- Added `await expect(this.page.locator('#language-select')).toBeVisible();` before dismissing popup
- Ensures page elements are ready before attempting to dismiss overlay

## Verification
- ✅ Both affected tests now pass in Chromium headless with 1 worker
- ✅ All 6 Tamil Contact Us tests pass (1 skipped for production safety)
- ✅ No regressions in Tamil City Profile tests (4/4 pass)
- ✅ No failures in other test suites using `closeAwarenessPopup`
- ✅ No arbitrary waits or force clicks used