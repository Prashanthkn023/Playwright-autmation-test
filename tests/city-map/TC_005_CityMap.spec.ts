import { test, expect } from '../../fixtures/baseTest';

test('TC_005: City Map navigation, controls, layer interactions, toolbar buttons and fullscreen validation', async ({ cityMap, page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('google-analytics') &&
        !text.includes('googletagmanager') &&
        !text.includes('favicon') &&
        !text.includes('ERR_BLOCKED_BY_CLIENT') &&
        !text.includes("Failed to find a valid digest in the 'integrity' attribute")
      ) {
        consoleErrors.push(text);
      }
    }
  });

  const criticalFailures: string[] = [];
  page.on('requestfailed', request => {
    const url = request.url();
    if (
      url.includes('gctp.in') &&
      !url.includes('/igistile/') &&
      !url.includes('/wmts/') &&
      !url.includes('/wms') &&
      (url.includes('api/v1/') || url.includes('/auth/'))
    ) {
      criticalFailures.push(`Critical request failed: ${url} - ${request.failure()?.errorText || 'unknown'}`);
    }
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (
      status >= 500 &&
      url.includes('gctp.in') &&
      !url.includes('/igistile/') &&
      !url.includes('/wmts/')
    ) {
      criticalFailures.push(`Server error (${status}): ${url}`);
    }
  });

  // Open City Map from Home Page
  await cityMap.openCityMapFromHomePage();

  await expect(cityMap.mapContainer).toBeVisible();
  await expect(cityMap.mapCanvas).toBeVisible();
  await expect(cityMap.zoomInButton).toBeVisible();
  await expect(cityMap.zoomOutButton).toBeVisible();
  await expect(cityMap.fullScreenButton).toBeVisible();

  // Inspect layer info and zoom boundaries via React Fiber introspection
  const layerInfos = await cityMap.getAllLayerInfo();
  console.log('Detected layers:', layerInfos);
  expect(layerInfos.length).toBeGreaterThan(0);

  const minZoom = await cityMap.getMinZoom();
  const maxZoom = await cityMap.getMaxZoom();
  console.log(`Detected minZoom: ${minZoom}, maxZoom: ${maxZoom}`);
  expect(minZoom).toBeGreaterThanOrEqual(0);
  expect(maxZoom).toBeGreaterThan(minZoom);

  const initialZoom = await cityMap.getMapZoom();
  console.log(`Initial map zoom: ${initialZoom}`);

  // 1. Verify zoom-in and zoom-out work
  await cityMap.clickZoomIn();
  const zoomAfterIn = await cityMap.getMapZoom();
  expect(zoomAfterIn).toBeGreaterThan(initialZoom);

  await cityMap.clickZoomOut();
  const zoomAfterOut = await cityMap.getMapZoom();
  expect(zoomAfterOut).toBeLessThan(zoomAfterIn);

  // Restore zoom
  await cityMap.clickZoomIn();

  // 2. Fullscreen expand button and repeated interaction validation (Section 2 & 3)
  for (let cycle = 1; cycle <= 2; cycle++) {
    console.log(`Fullscreen interaction cycle ${cycle}`);
    // Verify expand icon is visible before fullscreen
    await expect(cityMap.expandFullScreenButton).toBeVisible();
    expect(await cityMap.isFullScreenActive()).toBe(false);

    // Click expand button to enter fullscreen
    await cityMap.toggleFullScreen();
    await expect.poll(async () => await cityMap.isFullScreenActive(), { timeout: 5000 }).toBe(true);

    // Verify fullscreen exit X button (ol-full-screen-true) appears and is visible/enabled/clickable
    await expect(cityMap.exitFullScreenButton).toBeVisible();
    await expect(cityMap.exitFullScreenButton).toBeEnabled();

    // Click exit / X button to exit fullscreen
    await cityMap.exitFullScreenButton.click();
    await expect.poll(async () => await cityMap.isFullScreenActive(), { timeout: 5000 }).toBe(false);

    // Verify normal expand icon returns
    await expect(cityMap.expandFullScreenButton).toBeVisible();
    await expect(cityMap.mapContainer).toBeVisible();
    await expect(cityMap.mapCanvas).toBeVisible();
  }

  // 3. Verify Layers panel and bottom toolbar buttons (Section 1)
  // Verify Layers button is visible and enabled
  await expect(cityMap.layersButton).toBeVisible();
  await expect(cityMap.layersButton).toBeEnabled();

  // Open Layers panel
  await cityMap.clickLayersButton();
  await expect(cityMap.keyLocationsButton).toBeVisible();
  await expect(cityMap.cmrlButton).toBeVisible();
  await expect(cityMap.policeBoundaryButton).toBeVisible();

  const policeTitle = 'Traffic_Police_Boundary';
  const touristTitle = 'Tourist_locations';
  const cmrlTitle = 'CMRL_Phase1';

  // Test Layers: Traffic Police, Tourist/Parking, CMRL
  const layersToTest = [
    { title: policeTitle, button: cityMap.policeBoundaryButton, toggle: () => cityMap.togglePoliceBoundary() },
    { title: touristTitle, button: cityMap.keyLocationsButton, toggle: () => cityMap.toggleKeyLocations() },
    { title: cmrlTitle, button: cityMap.cmrlButton, toggle: () => cityMap.toggleCmrl() }
  ];

  for (const layer of layersToTest) {
    await expect(layer.button).toBeVisible();
    await expect(layer.button).toBeEnabled();

    // Capture initial visibilities of all layers
    const allLayersBefore = await cityMap.getAllLayerInfo();
    const initialTargetVis = await cityMap.getLayerVisibility(layer.title);

    // Toggle layer
    await layer.toggle();
    expect(await cityMap.getLayerVisibility(layer.title)).toBe(!initialTargetVis);

    // Verify toggling this layer does not unexpectedly change other independent layers (ignoring coupled CMRL sub-layers)
    const allLayersAfter = await cityMap.getAllLayerInfo();
    for (const info of allLayersAfter) {
      if (info.title === layer.title) continue;
      if (layer.title.startsWith('CMRL_') && info.title.startsWith('CMRL_')) continue;
      const prevInfo = allLayersBefore.find(l => l.title === info.title);
      expect(info.visible, `Layer "${info.title}" should not change when toggling "${layer.title}"`).toBe(prevInfo?.visible);
    }

    // Restore layer state
    await layer.toggle();
    expect(await cityMap.getLayerVisibility(layer.title)).toBe(initialTargetVis);
  }

  // Close Layers panel
  await cityMap.clickLayersButton();
  await expect(cityMap.keyLocationsButton).toBeHidden();

  // 4. Validate actual map markers (P Parking markers and ★ Tourist markers in Tourist_locations layer)
  const markerCounts = await cityMap.getTouristLayerFeatureCounts();
  console.log('Actual marker counts from Tourist_locations layer:', markerCounts);
  console.log('Feature type breakdown:', markerCounts.typeBreakdown);

  expect(markerCounts.total, 'Total features in Tourist_locations layer should be greater than 0').toBeGreaterThan(0);
  expect(markerCounts.parkingCount, 'Parking (P) markers should be present').toBeGreaterThan(0);
  expect(markerCounts.touristCount, 'Tourist (★) markers should be present').toBeGreaterThan(0);

  // Validate feature coordinates
  const coordsValid = await cityMap.validateTouristLayerCoordinates();
  expect(coordsValid, 'All marker features must have valid geographic coordinates within Chennai bounds').toBe(true);

  // Verify marker popups / details open correctly upon clicking markers
  const clickedParkingName = await cityMap.clickMarkerAndVerifyPopup(true);
  console.log('Clicked parking marker name:', clickedParkingName);
  expect(clickedParkingName).toBeTruthy();

  const clickedTouristName = await cityMap.clickMarkerAndVerifyPopup(false);
  console.log('Clicked tourist marker name:', clickedTouristName);
  expect(clickedTouristName).toBeTruthy();

  // Report console errors and critical request failures
  console.log('Report: Captured console errors:', consoleErrors);
  console.log('Report: Critical network failures:', criticalFailures);

  const genuineErrors = consoleErrors.filter(err => err.includes('TypeError') || err.includes('ReferenceError') || err.includes('Uncaught'));
  expect(genuineErrors, `Unexpected runtime errors: ${genuineErrors.join(', ')}`).toEqual([]);
  expect(criticalFailures, `Critical API or request failures: ${criticalFailures.join(' | ')}`).toEqual([]);
});
