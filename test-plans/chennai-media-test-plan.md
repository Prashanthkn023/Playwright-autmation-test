# Chennai Media Test Plan

## Application Overview

Exploratory functional, accessibility, navigation, media-loading, responsive, and error-handling coverage for https://gctp.in/chennai-media. The page contains a Photos/Videos media switcher, three photo cards, embedded YouTube videos, global search, language selection, social and app links, important-link carousel controls, and footer navigation. Each scenario assumes a fresh browser context and an independently loaded page.

## Test Scenarios

### 1. Media Gallery

**Seed:** `tests/chennai-media-seed.spec.ts`

#### 1.1. Photos tab loads the photo gallery

**File:** `tests/chennai-media/photos-gallery.spec.ts`

**Steps:**
  1. Open https://gctp.in/chennai-media in a fresh browser context.
    - expect: The page loads with the GCTP title and the Media navigation item available.
    - expect: The PHOTOS and VIDEOS controls are visible.
  2. Select the PHOTOS tab.
    - expect: PHOTOS is visibly selected.
    - expect: The photo gallery displays the available photo items, including Helmet Awareness Drive, Road Safety Awareness Quiz 2025, and Ride for Road Safety.
    - expect: Each displayed photo has a non-empty accessible name or alt text and loads with non-zero dimensions.
  3. Reload the page and select PHOTOS again.
    - expect: The same photo gallery is restored without duplicate cards, blank placeholders, or broken image icons.

#### 1.2. Photo item interaction opens or presents media details

**File:** `tests/chennai-media/photo-item-interaction.spec.ts`

**Steps:**
  1. Open the page, select PHOTOS, and wait until all visible photo images finish loading.
    - expect: All visible photo cards are stable before interaction.
  2. Click the Helmet Awareness Drive photo.
    - expect: The application either opens a clearly identifiable image viewer/details presentation or navigates to a documented media detail destination.
    - expect: The selected image, title, and any close/back control are visible and usable.
    - expect: No unrelated page content is lost or obscured.
  3. Use the available close or back action, then click the other two photo items independently.
    - expect: Each photo produces the same consistent interaction pattern.
    - expect: The correct selected title/image is shown for each item.
    - expect: The page does not navigate unexpectedly or throw a visible error.

#### 1.3. Videos tab displays playable embedded media

**File:** `tests/chennai-media/videos-gallery.spec.ts`

**Steps:**
  1. Open the page in a fresh context and select VIDEOS.
    - expect: VIDEOS is visibly selected.
    - expect: Video entries are displayed with titles, embedded player frames, or an equivalent loading/error state.
  2. Verify the visible video entries and their titles, including Strap Your Helmet. Save Your Life., Chennai News Today | Chennai Traffic Cops Get Air-Conditioned Helmets To Beat The Heat, and Nungambakkam | Roads | Metro | Crane | Traffic Jam | Motorists | Sun News.
    - expect: Each expected video entry has a corresponding player or an explicit recoverable unavailable-media message.
    - expect: Embedded frames are not blank or collapsed.
  3. Activate Play video on each visible player one at a time.
    - expect: The player starts playback or presents a clear browser/provider restriction state.
    - expect: The interaction does not reload the parent page or break the other players.
  4. Open Watch on YouTube for a video using a new-tab-safe interaction.
    - expect: The outbound URL is a YouTube URL for the selected video.
    - expect: The original Chennai Media page remains available.

#### 1.4. Photos and Videos tab state is independent

**File:** `tests/chennai-media/media-tab-state.spec.ts`

**Steps:**
  1. Open the page, select VIDEOS, then select PHOTOS, then select VIDEOS again.
    - expect: Only the selected media type is shown at each step.
    - expect: Previously rendered content does not duplicate or remain visibly overlaid.
    - expect: The selected tab state is clear to keyboard and assistive-technology users.

### 2. Global Controls And Navigation

**Seed:** `tests/chennai-media-seed.spec.ts`

#### 2.1. Global search accepts input and handles results

**File:** `tests/chennai-media/search.spec.ts`

**Steps:**
  1. Open the page and focus the Search... combobox.
    - expect: The search control receives focus and exposes an accessible name.
  2. Enter a known site term such as traffic and submit using the available search action or Enter key.
    - expect: A results view, filtered result list, or relevant navigation response appears.
    - expect: The entered query is preserved or clearly represented.
    - expect: No uncaught error or empty broken state is shown.
  3. Repeat with a random string that should have no matches, then clear the search.
    - expect: No-result feedback is clear and non-destructive.
    - expect: Clearing the query restores the default page state.

#### 2.2. Language selector changes page language

**File:** `tests/chennai-media/language-selector.spec.ts`

**Steps:**
  1. Open the page and open the English language combobox.
    - expect: The language menu opens and lists the supported choices without clipping.
  2. Select a non-English language, then reload the page.
    - expect: Visible navigational or page text changes to the selected language, or a clear unsupported-language response is shown.
    - expect: The selected language persists or resets consistently according to product requirements.
  3. Switch back to English.
    - expect: The page returns to English and media controls remain functional.

#### 2.3. Header, social, and app links navigate correctly

**File:** `tests/chennai-media/header-links.spec.ts`

**Steps:**
  1. Open the page and activate Home, City Profile, City Map, Media, News, Tamil Nadu Police, and Contact Us one at a time from a fresh start for each link.
    - expect: Each internal link reaches the correct path and renders a non-error page.
    - expect: The Media link returns to /chennai-media.
  2. Open each social account link and the Google Play and Apple Store links with new-tab-safe handling.
    - expect: Each link uses the expected external provider domain and does not silently redirect to an unrelated site.
    - expect: The originating page remains usable.
  3. Activate the Play Store header control.
    - expect: It opens or routes to the configured app-download destination, or presents a clear unavailable state.

#### 2.4. Important links carousel controls work

**File:** `tests/chennai-media/important-links.spec.ts`

**Steps:**
  1. Locate the important-links region and verify Tamilnadu Police Citizen Portal, Parivahan, TN Govt Web, and TNRTO entries.
    - expect: All entries have visible labels, valid destinations, and loaded thumbnails where applicable.
  2. Click Scroll important links right and then Scroll important links left.
    - expect: The carousel position changes when additional content is available.
    - expect: Controls do not cause horizontal page overflow, duplicate entries, or an exception when already at a boundary.
  3. Activate each important link using new-tab-safe handling.
    - expect: Each destination matches its displayed label and external link target.

### 3. Footer And Accessibility

**Seed:** `tests/chennai-media-seed.spec.ts`

#### 3.1. Footer links and metadata are present

**File:** `tests/chennai-media/footer.spec.ts`

**Steps:**
  1. Open the page and scroll to the footer.
    - expect: Feedback, Site Map, Privacy Policy, Complaints, and FAQ'S links are visible.
    - expect: Ownership, hosting, last-updated, and version metadata are readable.
  2. Open each footer link from a fresh page state.
    - expect: Each link reaches the correct internal path and renders usable content.
    - expect: Browser back returns to the Chennai Media page without losing the selected media state unexpectedly.

#### 3.2. Keyboard navigation and accessible names

**File:** `tests/chennai-media/accessibility.spec.ts`

**Steps:**
  1. Open the page and navigate through header, navigation, media tabs, media items, carousel controls, and footer links using only Tab, Shift+Tab, Enter, and Space.
    - expect: Every interactive control is reachable in a logical order.
    - expect: Focused elements have a visible focus indicator.
    - expect: Buttons and links expose meaningful accessible names; icon-only controls have labels or tooltips.
  2. Use keyboard activation on PHOTOS, VIDEOS, and an individual media item.
    - expect: Keyboard activation produces the same result as pointer activation.
    - expect: Focus is moved or retained predictably after tab changes or media presentation.
  3. Inspect visible images and embedded frames with accessibility tooling.
    - expect: Content images have meaningful alt text, decorative images are appropriately hidden, and embedded video frames have usable titles or provider semantics.

#### 3.3. Responsive layout remains usable

**File:** `tests/chennai-media/responsive.spec.ts`

**Steps:**
  1. Open the page at desktop, tablet, and mobile viewport sizes.
    - expect: Header, navigation, search, tabs, media cards/players, carousel, and footer remain usable without clipped text or overlapping controls.
    - expect: The page does not introduce unintended horizontal scrolling.
  2. At each viewport, switch between PHOTOS and VIDEOS and activate one media control.
    - expect: The selected content fits the viewport and remains operable by touch or pointer.
    - expect: Embedded players and photo cards maintain stable dimensions and do not shift surrounding content unexpectedly.

### 4. Reliability And Error Handling

**Seed:** `tests/chennai-media-seed.spec.ts`

#### 4.1. Media assets and page requests handle failures gracefully

**File:** `tests/chennai-media/network-failures.spec.ts`

**Steps:**
  1. Open the page while monitoring console errors, failed requests, and image load state.
    - expect: The page reaches a usable state without uncaught application exceptions.
    - expect: Required page assets load successfully or show an explicit recoverable error state.
  2. Simulate a failed photo request and reload the PHOTOS tab.
    - expect: A broken photo does not collapse the layout or prevent other media from loading.
    - expect: The failure is represented accessibly and does not falsely report successful media.
  3. Simulate a failed YouTube/embed request and select VIDEOS.
    - expect: The page shows a clear unavailable-video state or fallback link.
    - expect: Other page navigation and footer controls remain usable.

#### 4.2. Fresh-load and reload consistency

**File:** `tests/chennai-media/reload-consistency.spec.ts`

**Steps:**
  1. Load the page in a fresh context, record visible media counts/titles, switch tabs, and reload.
    - expect: The page consistently restores the default tab and expected media content.
    - expect: No duplicate players, duplicate photo cards, stale overlays, or persistent loading spinners appear.
  2. Use browser back and forward after switching between the page and another internal route.
    - expect: History navigation returns to the correct route and the page remains interactive.
