# CMS vs Published Chennai Media Test Plan

## Application Overview

Comparative plan for authenticated CMS https://cms.gctp.in/chennai-media and public https://gctp.in/chennai-media. CMS exploration reached a login screen without a session. The published page exposes PHOTOS and VIDEOS tabs, three photo entries, two YouTube embeds, shared navigation, important links, and footer links. CMS credentials must be supplied securely by the test environment; no image pixel comparison is required.

## Test Scenarios

### 1. Access And Baseline

**Seed:** `tests/CmsMedia.spec.ts`

#### 1.1. CMS authentication boundary

**File:** `tests/cms-media/authentication.spec.ts`

**Steps:**
  1. Open https://cms.gctp.in/chennai-media in a fresh context without a session.
    - expect: CMS login controls are shown.
    - expect: Media content is not exposed before authentication.
  2. Submit invalid credentials.
    - expect: Login is rejected with a clear error.
    - expect: The browser remains at the authentication boundary.
  3. Submit valid credentials from secure environment variables.
    - expect: The CMS session is established and the Chennai Media page becomes accessible.
    - expect: Credentials are not printed or attached to reports.

#### 1.2. Published media baseline

**File:** `tests/cms-media/published-baseline.spec.ts`

**Steps:**
  1. Open https://gctp.in/chennai-media in a fresh context.
    - expect: The published URL and GCTP page title are correct.
    - expect: PHOTOS and VIDEOS controls are visible.
    - expect: Global navigation and footer are usable.
  2. Select PHOTOS and wait for visible media to settle.
    - expect: Helmet Awareness Drive, Road Safety Awareness Quiz 2025, and Ride for Road Safety are displayed.
    - expect: Each visible image completes successfully with non-zero dimensions.
  3. Select VIDEOS.
    - expect: Two embedded video players are visible.
    - expect: Their iframe sources use YouTube embed URLs.

### 2. CMS To Published Parity

**Seed:** `tests/CmsMedia.spec.ts`

#### 2.1. Photo content parity

**File:** `tests/cms-media/photo-parity.spec.ts`

**Steps:**
  1. In the authenticated CMS, collect photo titles, stable media IDs or URLs, order, publish state, and image load state.
    - expect: CMS photo records are available for comparison.
  2. Collect the same fields from the published PHOTOS tab.
    - expect: Published records can be matched to CMS records by title or stable media ID.
    - expect: Titles, count, order, and publish visibility match.
  3. Compare matched images.
    - expect: Only identity and load success are compared.
    - expect: Pixel data, screenshots, visual appearance, and image hashes are not compared.
    - expect: Broken or missing published images fail with title and URL diagnostics.

#### 2.2. Video content parity

**File:** `tests/cms-media/video-parity.spec.ts`

**Steps:**
  1. In the authenticated CMS, collect video titles, provider IDs, order, and publish state.
    - expect: CMS video records are available for comparison.
  2. Collect published video titles and iframe source IDs from the VIDEOS tab.
    - expect: Published entries match CMS by title/provider ID and order.
    - expect: Exactly the configured published videos are shown.
  3. Compare published and unpublished CMS records.
    - expect: Published records appear publicly.
    - expect: Draft/unpublished records do not appear publicly.

#### 2.3. Publish propagation

**File:** `tests/cms-media/publish-propagation.spec.ts`

**Steps:**
  1. Publish a controlled CMS media item using test data, then wait the documented propagation interval.
    - expect: The item becomes visible on the published page with the configured title and media type.
  2. Unpublish the same controlled item and reload the published page.
    - expect: The item is removed publicly without removing unrelated media.

### 3. Interaction And Loading

**Seed:** `tests/CmsMedia.spec.ts`

#### 3.1. Photo interaction parity

**File:** `tests/cms-media/photo-interaction.spec.ts`

**Steps:**
  1. Inspect the CMS-configured action for a photo, then click the corresponding published photo.
    - expect: Published behavior matches the CMS configuration or documented requirement.
    - expect: No unexpected navigation, blank modal, or uncaught error occurs.
  2. Repeat for all three published photos.
    - expect: Each photo uses a consistent interaction pattern and preserves the correct title/identity.

#### 3.2. Video interaction parity

**File:** `tests/cms-media/video-interaction.spec.ts`

**Steps:**
  1. Play each published video.
    - expect: Playback starts or a clear provider restriction is shown.
    - expect: The parent page remains usable.
  2. Open Watch on YouTube for each video with new-tab-safe handling.
    - expect: The outbound URL matches the CMS provider/video ID.
    - expect: The original media page remains available.

#### 3.3. Media load failure handling

**File:** `tests/cms-media/load-failures.spec.ts`

**Steps:**
  1. Monitor image and iframe requests while loading both tabs.
    - expect: Images report complete success and non-zero dimensions, or a specific accessible failure state.
    - expect: Failed embeds do not crash the page.
  2. Simulate or observe one failed image and one failed video embed.
    - expect: The affected item is diagnosed by title/URL or video ID.
    - expect: Other media, navigation, and footer controls remain usable.

### 4. Shared UX And Regression

**Seed:** `tests/CmsMedia.spec.ts`

#### 4.1. Navigation and external links

**File:** `tests/cms-media/navigation.spec.ts`

**Steps:**
  1. Compare shared CMS and published navigation where applicable, including Home, Media, News, Contact Us, and external police links.
    - expect: Each destination is correct for its environment.
    - expect: CMS-only edit/publish controls are absent from the public page.
  2. Verify important links and footer links on the published page.
    - expect: Tamilnadu Police Citizen Portal, Parivahan, TN Govt Web, TNRTO, Feedback, Site Map, Privacy Policy, Complaints, and FAQ'S resolve correctly.

#### 4.2. Responsive and accessibility comparison

**File:** `tests/cms-media/responsive-accessibility.spec.ts`

**Steps:**
  1. Run authenticated CMS and public checks at desktop, tablet, and mobile viewports.
    - expect: Tabs, images, players, text, navigation, and footer do not overlap, clip, or require unintended horizontal scrolling.
  2. Navigate media controls using keyboard and inspect accessibility names.
    - expect: Tabs and actionable media controls are keyboard reachable.
    - expect: Images have meaningful alt text or are correctly decorative.
    - expect: Video frames have usable titles or provider semantics.
    - expect: Focus remains visible and predictable.

#### 4.3. Reload and history consistency

**File:** `tests/cms-media/reload-history.spec.ts`

**Steps:**
  1. Reload both CMS and published media pages after switching tabs.
    - expect: Expected media returns without duplicates, stale loaders, blank permanent containers, or lost records.
  2. Use browser back and forward after visiting another internal route.
    - expect: The correct media route and usable tab state are restored.
    - expect: CMS authentication remains isolated from the public context.
