# GCTP CMS Supervisor View Test Plan

## Application Overview

Live inspection-based test plan for the authenticated GCTP CMS Supervisor View. Covers supervisor login, approval queue, master content, complaints, feedback, CMS logs, pagination, profile notifications, footer, and authorized action boundaries.

## Test Scenarios

### 1. Supervisor Authentication

**Seed:** `tests/seed.spec.ts`

#### 1.1. SUP-AUTH-001: Supervisor login entry and successful authentication

**File:** `tests/supervisor-auth.spec.ts`

**Steps:**
  1. Assume a fresh browser session and open https://cms.gctp.in/chennai-supervisorview.
    - expect: The page title is CMS Website.
    - expect: The supervisor login form is visible with email and password fields plus Login and Forgot password controls.
    - expect: The URL remains https://cms.gctp.in/chennai-supervisorview.
  2. Enter a valid supervisor email and password, then click Login.
    - expect: The login form is removed.
    - expect: The page remains at /chennai-supervisorview.
    - expect: The supervisor account identity and notification controls become available.
    - expect: The APPROVAL LIST tab is selected.
  3. Open a fresh browser session and repeat login with blank credentials.
    - expect: Invalid submission does not open supervisor content.
    - expect: Inline or native validation is shown for required fields.
    - expect: The user remains on the supervisor login route.
  4. Use the valid email with an incorrect password.
    - expect: Authentication fails visibly.
    - expect: No supervisor data or action controls are revealed.
    - expect: The password is not exposed.

#### 1.2. SUP-AUTH-002: Password visibility and forgot-password controls

**File:** `tests/supervisor-auth.spec.ts`

**Steps:**
  1. On the login form, enter text in the password field and toggle password visibility.
    - expect: The toggle changes the password field between masked and readable states.
    - expect: The field remains usable after the toggle.
  2. Click Forgot password ?.
    - expect: The forgot-password dialog or recovery flow opens.
    - expect: Recovery controls and validation are presented.
    - expect: Canceling or completing the flow does not expose supervisor data.

#### 1.3. SUP-AUTH-003: Authorization boundaries

**File:** `tests/supervisor-auth.spec.ts`

**Steps:**
  1. In a fresh unauthenticated session, open /chennai-supervisorview.
    - expect: Only the login or an authorized redirect is available.
    - expect: Supervisor-only data and actions are not accessible.
  2. Using a non-supervisor account, open /chennai-supervisorview if available.
    - expect: The account is denied or redirected.
    - expect: Supervisor-only controls and records are not displayed.

### 2. Approval Queue

**Seed:** `tests/seed.spec.ts`

#### 2.1. SUP-APR-001: Approval list structure and live records

**File:** `tests/supervisor-approval.spec.ts`

**Steps:**
  1. Log in as supervisor and ensure APPROVAL LIST is selected.
    - expect: APPROVAL LIST contains 17 column headers: S.No., Tab, Section, Title, Description, Tamil Title, Tamil Description, Signature, Tamil Signature, Contact No, Designation, Office Address, Image, Action, Created On/Updated On, Created by/Updated by, and Content Publishing.
    - expect: Displayed pending records expose tab, section, action type, timestamps, and creator data.
  2. Inspect each pending row.
    - expect: The serial and source module match the displayed record.
    - expect: Create, Update, and Delete records show the corresponding action.
    - expect: Every pending row exposes Approve and Reject controls.
    - expect: Inspection does not mutate data.
  3. Inspect pagination.
    - expect: Rows per page shows 10.
    - expect: The range reflects the live dataset.
    - expect: Previous and next controls are disabled when no additional page exists.

#### 2.2. SUP-APR-002: Approve workflow in an authorized test environment

**File:** `tests/supervisor-approval.spec.ts`

**Steps:**
  1. Identify one disposable pending record and click Approve.
    - expect: An approval confirmation or success result is shown.
    - expect: The record leaves the pending approval queue.
    - expect: Master content or audit surfaces reflect the approval and supervisor identity when available.
  2. Cancel the approval before confirmation if confirmation is provided.
    - expect: The record remains pending.
    - expect: No status or content change occurs.

#### 2.3. SUP-APR-003: Reject workflow

**File:** `tests/supervisor-approval.spec.ts`

**Steps:**
  1. Identify one disposable pending record and click Reject.
    - expect: A rejection confirmation or reason dialog is presented if supported.
    - expect: The record remains unchanged until confirmed.
    - expect: No unexpected navigation occurs.
  2. Confirm rejection.
    - expect: The record leaves the approval queue.
    - expect: It is not published as master content.
    - expect: CMS logs or audit trails record the action, timestamp, and supervisor identity when available.
  3. If a rejection reason is required, test blank and valid text.
    - expect: Blank required reason is rejected.
    - expect: Valid reason is saved or displayed according to the workflow contract.

#### 2.4. SUP-APR-004: Contact Us and Organogram sections

**File:** `tests/supervisor-approval.spec.ts`

**Steps:**
  1. Inspect DETAILED CONTACTUS DATA.
    - expect: It exposes S.No., Tab, Officer Name, Rank, Office Phone Numbers, Display Order, Action, Created On/Updated On, Created by/Updated by, and Content Publishing.
    - expect: Counts and pagination match live data.
  2. Inspect ORGANOGRAM DATA.
    - expect: No pending records show No data found to Approve.
    - expect: Any displayed pending record exposes the defined approval controls.

### 3. Supervisor Tabs

**Seed:** `tests/seed.spec.ts`

#### 3.1. SUP-TAB-001: Master Content List

**File:** `tests/supervisor-tabs.spec.ts`

**Steps:**
  1. Click MASTER CONTENT LIST.
    - expect: The tab becomes selected.
    - expect: The table has S.No., Tab, Section, Title, Description, Tamil Title, Tamil Description, Image, Created On, Approved On, Created By, and Approved By.
    - expect: Approved records and pagination are shown.
  2. Change page size and navigate pages.
    - expect: Rows update without duplicates or missing records.
    - expect: Previous and Next controls match the current position.
    - expect: First and final pages disable the appropriate controls.

#### 3.2. SUP-TAB-002: Complaint List empty state

**File:** `tests/supervisor-tabs.spec.ts`

**Steps:**
  1. Click COMPLAINT LIST.
    - expect: COMPLAINTS LIST shows S. No., Complaint Provided By, Submitted Date & Time, Category, Description, and Contact Information.
    - expect: The live empty state shows 0–0 of 0.
    - expect: No stale rows are displayed.

#### 3.3. SUP-TAB-003: Feedback List ratings and pagination

**File:** `tests/supervisor-tabs.spec.ts`

**Steps:**
  1. Click FEEDBACK LIST.
    - expect: AVERAGE RATING is shown.
    - expect: The table shows Feedback Submitted Date & Time, Feedback Message, and Ratings Offered.
    - expect: Rows include valid rating and timestamp values.
    - expect: Pagination reflects the live feedback total.
  2. Navigate to later feedback pages.
    - expect: Records match server results and page ranges.
    - expect: No duplicate feedback appears across adjacent pages.

#### 3.4. SUP-TAB-004: CMS Logs

**File:** `tests/supervisor-tabs.spec.ts`

**Steps:**
  1. Click CMS LOGS.
    - expect: CMS LOGS shows Tab, Section, Title, Description, Tamil fields, Image, Action, timestamps, and creator/approver fields.
    - expect: Rows reflect CMS activity.
    - expect: Pagination reflects the live total.
  2. After an authorized action in a test environment, locate its log row.
    - expect: Action, object, timestamp, and associated accounts are recorded.
    - expect: No credentials appear in the UI or logs.

#### 3.5. SUP-TAB-005: Tab switching and refresh

**File:** `tests/supervisor-tabs.spec.ts`

**Steps:**
  1. Switch among all five supervisor tabs repeatedly and refresh.
    - expect: The correct view renders for each tab.
    - expect: Only one tab is selected.
    - expect: Authentication remains intact and refresh leaves the supervisor interface usable.
    - expect: No application crash occurs.

### 4. Cross-cutting UI and Reliability

**Seed:** `tests/seed.spec.ts`

#### 4.1. SUP-XCUT-001: Header, identity, notifications, and footer

**File:** `tests/supervisor-cross-cutting.spec.ts`

**Steps:**
  1. Inspect the authenticated header and footer.
    - expect: Bilingual Greater Chennai Traffic Police branding is visible.
    - expect: Supervisor identity appears in the account control.
    - expect: The notification count is displayed.
    - expect: LTTS hosting and Version Fusion V1.2 are shown.
    - expect: Important links and visitor count remain visible when available.
  2. Open and close account and notification controls without changing data.
    - expect: Controls open meaningful menus or indicators.
    - expect: Controls close cleanly.
    - expect: No mutation action occurs.

#### 4.2. SUP-XCUT-002: Data consistency

**File:** `tests/supervisor-cross-cutting.spec.ts`

**Steps:**
  1. Compare counts and fields across supervisor views.
    - expect: Counts match rendered ranges and API datasets.
    - expect: Timestamps are valid and consistently formatted.
    - expect: N/A and empty values do not break layout.
    - expect: Long bilingual text wraps or truncates consistently.

#### 4.3. SUP-XCUT-003: Responsive layout

**File:** `tests/supervisor-cross-cutting.spec.ts`

**Steps:**
  1. Run the supervisor view at desktop, tablet, and mobile widths.
    - expect: Tabs, tables, pagination, header, footer, and login remain usable.
    - expect: Wide approval grids use controlled horizontal overflow.
    - expect: No critical text overlaps or clips.

#### 4.4. SUP-XCUT-004: Session timeout and logout

**File:** `tests/supervisor-cross-cutting.spec.ts`

**Steps:**
  1. Expire or idle out the authenticated session.
    - expect: Protected supervisor data is cleared or the session redirects to login.
    - expect: Actions fail safely after expiration.
  2. Use logout if available, then press browser Back.
    - expect: Protected state is removed.
    - expect: The login or public route is shown.
    - expect: Back and refresh do not restore protected content.

#### 4.5. SUP-XCUT-005: Network and console resilience

**File:** `tests/supervisor-cross-cutting.spec.ts`

**Steps:**
  1. Inspect network and console diagnostics.
    - expect: Application API failures do not crash the supervisor interface.
    - expect: No credentials appear in URLs, requests, console logs, or snapshots.
    - expect: Mixed-content or resource-integrity warnings are recorded as environment defects.
