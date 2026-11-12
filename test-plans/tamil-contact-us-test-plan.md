# Tamil Contact Us Test Plan

## Application Overview

## Scope

This plan covers only the Tamil-language Contact Us module on the GCTP public website (content, UI, and data). The CMS admin website is used only for approved-record API comparisons with the saved authenticated session.

## Application URLs

> Items marked (confirm) are assumed from the existing URL pattern. Verify them in the browser network tab before automating.

- Public website: https://gctp.in
- Contact Us page: https://gctp.in/chennai-contact-us (confirm)
- Public Contact Us API: https://gctp.in/api/fusion-public-facing-web-backend/contact-us (confirm)
- CMS Contact Us API: https://gctp.in/api/fusion-cms-web-backend/contact-us?approvalStatus=all (confirm)

## Approach

- Reuse the saved CMS session from auth.setup.
- Switch the public website from English to Tamil through the language control.
- Use Page Object Model classes for navigation, locators, and actions.
- Keep expected Tamil labels in a separate data file.
- Use Playwright web-first assertions and dynamic waits.
- Compare CMS and public records by API field values, without hardcoding live addresses, phone numbers, or emails.
- Report an approved-record absence clearly rather than failing for the wrong reason.

## Test Data

- Tamil language name: தமிழ்
- Contact Us navigation text: தொடர்புக்கு (confirm exact label on site)
- Tamil script check: text must contain characters in the Tamil Unicode range (U+0B80–U+0BFF).
- Non-translatable values (phone numbers, email addresses, URLs) are excluded from the Tamil script check.
- Form labels, placeholders, submit button, and success message belong in the labels data file (confirm form exists).
- Form submission uses only approved synthetic data in an authorized test environment.

## Test Scenarios

### 1. Tamil Contact Us Scenarios

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-CON-01: Validate Contact Us content in Tamil

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Open the GCTP website and switch to Tamil.
    - expect: The language control reflects தமிழ் and the website content is displayed in Tamil.
  2. Open the Contact Us page and verify its route and exact Tamil navigation label on the live page.
    - expect: Contact Us opens successfully from the main navigation.
    - expect: Confirm or correct the assumed /chennai-contact-us route and தொடர்புக்கு label before automation.
  3. Verify the page heading, section titles, office name, address, and working-hours labels contain Tamil content.
    - expect: Translatable content is in Tamil with no English fallback.
    - expect: Tamil-script checks use U+0B80–U+0BFF and exclude phone numbers, email addresses, and URLs.
  4. If a form exists, verify its labels, placeholders, and submit button text against the Tamil labels data file.
    - expect: Form labels, placeholders, and submit button match the expected Tamil labels.
    - expect: If no form is present, record the assumption as disproved.

#### 1.2. TC-CON-02: Verify Contact Us UI layout and media

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Open the Contact Us page in Tamil.
    - expect: The Contact Us page is displayed in Tamil.
  2. Scroll through the full page to reveal lazy-loaded content.
    - expect: All sections are reachable during the full-page review.
  3. Verify banner images, icons, and the map, if present, are loaded successfully.
    - expect: All displayed images and icons are loaded; an optional map is checked if present.
  4. Check visible Contact Us sections and content for overlapping layout.
    - expect: Contact Us sections do not overlap or display broken content.

#### 1.3. TC-CON-03: Verify contact details and links

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Open the Contact Us page in Tamil.
    - expect: Contact details and links are present.
  2. Verify each displayed phone number uses a valid tel: link and each email address uses a valid mailto: link.
    - expect: Phone and email links use the correct URI schemes and correspond to their displayed values.
  3. Open or inspect each map or directions link and verify it targets the expected office location.
    - expect: Map and directions links resolve to the displayed office location.
  4. Verify social and other external links are present and return a valid response.
    - expect: External links have valid destinations and return a valid response.

#### 1.4. TC-CON-04: Submit the Contact Us form in Tamil

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Open the Contact Us page in Tamil and verify form labels, placeholders, and the submit button are shown in Tamil.
    - expect: If the form exists, its labels, placeholders, and submit button match the Tamil labels data.
    - expect: If no form exists, record the assumption as disproved rather than inventing a flow.
  2. Fill in all form fields with valid synthetic data approved for the target environment.
    - expect: All required fields accept valid test data.
  3. Submit the form in an authorized test environment.
    - expect: The form submission completes successfully without sending unapproved test data to production.
  4. Verify the success message.
    - expect: The success message is shown in Tamil.

#### 1.5. TC-CON-05: Compare approved CMS contact data with the Contact Us page

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Using the saved authenticated CMS session, get approved Contact Us records from the CMS Contact Us API and verify the assumed route in the network traffic.
    - expect: The CMS API request succeeds and returns Contact Us records with approval information.
    - expect: Confirm or correct the assumed CMS API route before automating.
  2. Get Contact Us records from the public Contact Us API and verify the assumed route in network traffic.
    - expect: The public API request succeeds and returns Contact Us records.
    - expect: Confirm or correct the assumed public API route before automating.
  3. Compare approved CMS and public record counts, then match each approved record by office name or title.
    - expect: Approved CMS records correspond to public Contact Us records.
    - expect: If no approved CMS records exist, report their absence clearly instead of failing for an unrelated mismatch.
  4. Compare address, phone, email, working hours, map link, and other available content fields between matching records.
    - expect: All corresponding available field values match without hardcoding live contact details.
  5. Compare Tamil values from the public API with text rendered on the page.
    - expect: Rendered Tamil values match their corresponding public API fields.

#### 1.6. TC-CON-06: Complete Tamil Contact Us user journey

**File:** `tests/tamil-contact-us/tamil-contact-us.spec.ts`

**Steps:**
  1. Open the website and switch to Tamil.
    - expect: The website is displayed in Tamil.
  2. Open the Contact Us page from the main navigation.
    - expect: The verified Contact Us page opens from the main navigation.
  3. Verify Tamil content and contact details.
    - expect: Contact Us content is shown in Tamil and contact details are present.
  4. Click each contact link and verify it behaves correctly.
    - expect: Phone, email, map/directions, and other external links behave as expected.
  5. If the form exists, fill it with valid synthetic data approved for the target environment and submit in an authorized test environment.
    - expect: Submission succeeds and displays a Tamil success message; if no form exists, report its absence explicitly.
  6. Return to the home page and verify that the language is still Tamil.
    - expect: The home page remains in Tamil without navigation or content errors.
