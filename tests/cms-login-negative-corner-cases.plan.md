# CMS Login Page Negative and Corner-Case Test Plan

## Application Overview

Focused black-box test plan for the login screen at https://cms.gctp.in/ (currently routed to /chennai-home), including the Forgot Password dialog that is launched from the same screen. Scope is limited to negative validation and corner cases; no successful login flow is included. Observed UI includes email and password textboxes, Login, a password-visibility toggle, and Forgot password. Empty login submission displayed “Login Error!”; the recovery dialog displayed “This field is required” for an empty email and “Email is not valid” for malformed email. Use a fresh browser state per test and a controlled QA environment for any request that could contact authentication or OTP services. Never use real user credentials or trigger repeated failed logins against production.

## Test Scenarios

### 1. CMS Login: Negative and Corner Cases

**Seed:** `tests/seed.spec.ts`

#### 1.1. Reject login with both credential fields empty

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: start from a fresh browser context with no authenticated session. Navigate to https://cms.gctp.in/ and wait for the CMS login form.
    - expect: The CMS login screen is visible with email, password, Login, and Forgot password controls.
  2. Leave both email and password empty and click Login once.
    - expect: Login is rejected and the user remains on the login screen.
    - expect: A visible validation/error state is shown; the current UI displays “Login Error!”.
    - expect: No authenticated page or session is created.

#### 1.2. Reject login when email is missing

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: start from a fresh unauthenticated browser context. Open the CMS login screen.
    - expect: The login form is ready for input.
  2. Leave email empty, enter a non-empty password value reserved for QA testing, and click Login once.
    - expect: Login is rejected without navigating to an authenticated page.
    - expect: The missing email is reported with visible feedback; no success-shaped response is shown.

#### 1.3. Reject login when password is missing

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: start from a fresh unauthenticated browser context. Open the CMS login screen.
    - expect: The login form is ready for input.
  2. Enter a syntactically valid but non-personal QA email address, leave password empty, and click Login once.
    - expect: Login is rejected without navigation or an authenticated session.
    - expect: The missing password is reported with visible feedback.

#### 1.4. Reject malformed login email addresses

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: run each data row in a fresh unauthenticated state and use a QA-only password. Try representative malformed email values: missing @, missing local part, missing domain, and whitespace within the address; submit each once.
    - expect: Each malformed email is rejected and does not create an authenticated session.
    - expect: The user receives clear validation/error feedback and remains on the login screen.
    - expect: Input is not silently rewritten into a different address.

#### 1.5. Reject whitespace-only credentials and handle surrounding whitespace safely

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: use a fresh unauthenticated context and a QA-only value. Test both fields containing only spaces, then test an otherwise malformed/unknown email with leading or trailing spaces and a whitespace-only password. Submit each case once.
    - expect: Whitespace-only values do not authenticate.
    - expect: The page either trims and validates values consistently or rejects them with clear feedback; it does not treat whitespace as a valid credential.
    - expect: The page remains responsive and does not expose a server error or authenticated content.

#### 1.6. Handle credential input length and character boundaries without truncation or failure

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: use a fresh unauthenticated context. Exercise the email and password fields with empty-to-one-character transitions, a value at the documented maximum length and one character beyond it, and representative non-ASCII input. Use QA-only data; submit no more than one failed authentication attempt.
    - expect: The UI remains responsive and preserves the documented input limits and validation behavior.
    - expect: Values are either clearly rejected or handled according to the product's documented limits; they are not silently truncated into another value.
    - expect: No authenticated state, layout break, unhandled error, or misleading success feedback occurs.

#### 1.7. Validate required and malformed email in Forgot Password dialog

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: open the login screen in a fresh browser context and click Forgot password.
    - expect: A Forgot Password dialog appears with an email field, Cancel, and Send OTP controls.
  2. Leave the recovery email empty and click Send OTP once.
    - expect: The dialog remains open and shows required-field feedback; the observed UI says “This field is required”.
    - expect: No OTP-success state is shown and no request is sent for an empty address.
  3. Enter a malformed address such as “not-an-email” and click Send OTP once.
    - expect: The dialog remains open and shows email-format feedback; the observed UI says “Email is not valid”.
    - expect: No OTP-success state is shown for an invalid address.

#### 1.8. Reset recovery dialog state after cancel and reopen

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: open the login screen in a fresh browser context, open Forgot Password, enter a malformed email, and trigger its validation message.
    - expect: The dialog displays the entered invalid address and its validation feedback.
  2. Click Cancel, reopen Forgot password, and inspect the new dialog without submitting.
    - expect: The dialog closes on Cancel and reopens without the previously entered invalid value or stale validation message.
    - expect: The reopened email field is ready for a new attempt; the login screen remains unauthenticated.

#### 1.9. Keep password masked when visibility toggle is switched back off

**File:** `tests/cms-login-negative-corner-cases.spec.ts`

**Steps:**
  1. Assumption: start on the login screen in a fresh unauthenticated context. Enter a non-sensitive QA-only password value and activate the password visibility toggle twice.
    - expect: The password is revealed only while visibility is enabled and is masked again after the second activation.
    - expect: The value is unchanged by toggling and is not submitted; the user remains on the login screen.
