# GCTP Playwright Automation - Developer Bug Report

**Generated on:** 2026-11-10  
**Project:** GCTP-Playwright (`https://gctp.in`)  
**Scope:** API Negative Testing & UI Resilience Testing  

---

## Bug Summary Table

| Bug ID | Title | Module | Test ID | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Citizen Login API returns HTTP 500 on malformed JSON | API / Authentication | API-NEG-04 | High | Open |
| **BUG-02** | Frontend crashes with TypeError when API returns empty array `[]` | Frontend / UI Resilience | COR-04 | High | Open |
| **BUG-03** | Frontend crashes with TypeError when API returns `null` values | Frontend / UI Resilience | COR-05 | High | Open |
| **BUG-04** | Frontend crashes / unhandled error when API returns HTTP 500 | Frontend / UI Resilience | COR-06 | Medium | Open |

---

## Detailed Bug Reports

### BUG-01: Citizen Login API returns HTTP 500 for malformed JSON instead of HTTP 400

- **Bug ID:** BUG-01
- **Title:** Citizen Login API returns HTTP 500 for malformed JSON instead of HTTP 400
- **Module:** API / Authentication
- **Test ID:** API-NEG-04
- **Browser:** Chromium / Firefox (API Request Context)
- **Preconditions:** GCTP API backend is running and accessible at `https://gctp.in`.
- **Steps to reproduce:**
  1. Send a POST request to `${CONFIG.BASE_URL}${CONFIG.API_ENDPOINTS.citizenLogin}`.
  2. Send malformed JSON payload in the request body (e.g., `{ malformed_json: true, missing_quotes: `).
  3. Inspect the HTTP response status code.
- **Test input:**
  ```json
  { malformed_json: true, missing_quotes: 
  ```
- **Expected result:** The API gateway / backend should catch the JSON parsing error and return an HTTP 400 Bad Request response with a descriptive validation error message.
- **Actual result:** The server returns HTTP 500 Internal Server Error.
- **Technical error:** 
  ```
  Expected status to be less than 500, received 500
  ```
- **Severity:** High
- **Developer recommendation:** Implement robust request body parsing middleware (e.g., express/fastify json parser error handler) to catch syntax errors during JSON deserialization and respond with a clean HTTP 400 Bad Request instead of throwing an unhandled exception resulting in an HTTP 500.

---

### BUG-02: Frontend crashes when API returns an empty array

- **Bug ID:** BUG-02
- **Title:** Frontend crashes when API returns an empty array
- **Module:** Frontend / UI Resilience (`Search` / `Home` / `Media`)
- **Test ID:** COR-04
- **Browser:** Chromium / Firefox
- **Preconditions:** Network interception configured via Playwright `page.route()`.
- **Steps to reproduce:**
  1. Intercept network requests matching `**/api/**` for home-page, media, or news-and-updates.
  2. Fulfill route with `status: 200` and body `JSON.stringify([])`.
  3. Navigate to `https://gctp.in/search` (or home page).
  4. Observe page rendering and console errors.
- **Test input:** Mocked API response: `[]`
- **Expected result:** The UI should render gracefully, displaying empty state messages (e.g., "No items found") without throwing runtime JavaScript errors.
- **Actual result:** Unhandled JavaScript runtime exception (`TypeError: Cannot read properties of undefined (reading 'map')` or component render crash).
- **Technical error:**
  ```
  Unexpected JS error: TypeError: Cannot read properties of undefined (reading 'map')
  ```
- **Severity:** High
- **Developer recommendation:** Add defensive null/undefined checks and fallback values on API data arrays in React components (e.g., `(data ?? []).map(...)` or optional chaining `data?.map(...)`).

---

### BUG-03: Frontend crashes when API returns null values

- **Bug ID:** BUG-03
- **Title:** Frontend crashes when API returns null values
- **Module:** Frontend / UI Resilience (`Search` / `Home` / `Media`)
- **Test ID:** COR-05
- **Browser:** Chromium / Firefox
- **Preconditions:** Network interception configured via Playwright `page.route()`.
- **Steps to reproduce:**
  1. Intercept network requests matching `**/api/**` for home-page or media endpoints.
  2. Fulfill route with `status: 200` and body `JSON.stringify({ title: null, items: null, count: null })`.
  3. Navigate to `https://gctp.in/search`.
  4. Observe component behavior.
- **Test input:** Mocked API response: `{ title: null, items: null, count: null }`
- **Expected result:** The UI should handle `null` property values gracefully by displaying fallback text or placeholders without throwing exceptions.
- **Actual result:** Runtime exception when attempting to access properties on `null` objects (e.g., `.map()` or `.length` on null).
- **Technical error:**
  ```
  Unexpected JS error: TypeError: Cannot read properties of null (reading 'map')
  ```
- **Severity:** High
- **Developer recommendation:** Enforce robust type guards and default property values when consuming API response payloads (e.g., `const items = response?.items ?? [];`).

---

### BUG-04: Frontend crashes when API returns HTTP 500

- **Bug ID:** BUG-04
- **Title:** Frontend crashes when API returns HTTP 500
- **Module:** Frontend / UI Resilience (`Search` / `Home` / `Media`)
- **Test ID:** COR-06
- **Browser:** Chromium / Firefox
- **Preconditions:** Network interception configured via Playwright `page.route()`.
- **Steps to reproduce:**
  1. Intercept network requests matching `**/api/**` for home-page or media endpoints.
  2. Fulfill route with `status: 500` and body `'Internal Server Error'`.
  3. Navigate to `https://gctp.in/search`.
  4. Observe UI error handling.
- **Test input:** Mocked API response status 500
- **Expected result:** The UI should display a user-friendly error banner, toast notification, or retry button (`.alert-danger`, `[role="alert"]`) without crashing the React application tree.
- **Actual result:** Uncaught promise rejection or unhandled error boundary exception causing blank screen or unhandled crash.
- **Technical error:**
  ```
  Unexpected JS error: Uncaught (in promise) Error: Request failed with status 500 / TypeError in data rendering
  ```
- **Severity:** Medium
- **Developer recommendation:** Wrap API fetch/axios calls in `try/catch` blocks, implement React Error Boundaries around major page sections, and display graceful error alerts when backend services return 5xx errors.
