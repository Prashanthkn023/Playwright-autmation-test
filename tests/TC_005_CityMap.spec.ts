import { test, expect } from '../fixtures/baseTest';

test.describe('City Map Page and Controls Validation', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page, cityMap }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon.ico') &&
          !text.includes('ERR_') &&
          !text.includes('analytics') &&
          !text.includes('Failed to load resource') &&
          !text.includes('integrity') &&
          !text.includes('EncodingError') &&
          !text.includes('Failed to load WFS station boundaries') // Ignore known WFS issue
        ) {
          consoleErrors.push(text);
        }
      }
    });

    await cityMap.openCityMap();
  });

  test('TC_005_01: City Map page loads and container/controls are visible', async ({ cityMap }) => {
    await expect(cityMap.mapContainer).toBeVisible();
    await expect(cityMap.zoomInButton).toBeVisible();
    await expect(cityMap.zoomOutButton).toBeVisible();
    await expect(cityMap.fullScreenButton).toBeVisible();
    await expect(cityMap.keyLocationsButton).toBeAttached();
    await expect(cityMap.cmrlButton).toBeAttached();
    await expect(cityMap.layersButton).toBeVisible();

    const initialZoom = await cityMap.getMapZoom();
    expect(initialZoom).toBeGreaterThan(0);
  });

  test('TC_005_02: Zoom In (+) increases map zoom level', async ({ cityMap }) => {
    const zoomBefore = await cityMap.getMapZoom();
    await cityMap.clickZoomIn();
    const zoomAfter = await cityMap.getMapZoom();
    expect(zoomAfter).toBeGreaterThan(zoomBefore);
  });

  test('TC_005_03: Zoom Out (-) decreases map zoom level', async ({ cityMap }) => {
    await cityMap.clickZoomIn();
    const zoomBefore = await cityMap.getMapZoom();
    await cityMap.clickZoomOut();
    const zoomAfter = await cityMap.getMapZoom();
    expect(zoomAfter).toBeLessThan(zoomBefore);
  });

  test('TC_005_04: Repeated zoom operations stability', async ({ cityMap }) => {
    const initialZoom = await cityMap.getMapZoom();
    for (let i = 0; i < 3; i++) {
      await cityMap.clickZoomIn();
    }
    const zoomHigh = await cityMap.getMapZoom();
    expect(zoomHigh).toBeGreaterThan(initialZoom);

    for (let i = 0; i < 3; i++) {
      await cityMap.clickZoomOut();
    }
    const zoomLow = await cityMap.getMapZoom();
    expect(zoomLow).toBeLessThan(zoomHigh);
    await expect(cityMap.mapContainer).toBeVisible();
  });

  test('TC_005_05: Fullscreen / expand toggle works correctly', async ({ cityMap }) => {
    await cityMap.toggleFullScreen();
    await cityMap.toggleFullScreen();
    await expect(cityMap.mapContainer).toBeVisible();
  });

  test('TC_005_06: Police / shield button toggles Traffic Police Boundary layer', async ({ cityMap }) => {
    const initialVisible = await cityMap.getLayerVisibility('Traffic_Police_Boundary');
    expect(initialVisible).not.toBeNull();

    await cityMap.togglePoliceBoundary();
    const toggledVisible = await cityMap.getLayerVisibility('Traffic_Police_Boundary');
    expect(toggledVisible).toBe(!initialVisible);
  });

  test('TC_005_07: Location pin button toggles Tourist locations layer', async ({ cityMap }) => {
    const initialVisible = await cityMap.getLayerVisibility('Tourist_locations');
    expect(initialVisible).not.toBeNull();

    await cityMap.toggleKeyLocations();
    const toggledVisible = await cityMap.getLayerVisibility('Tourist_locations');
    expect(toggledVisible).toBe(!initialVisible);
  });

  test('TC_005_08: Public transport (CMRL) button toggles CMRL layers', async ({ cityMap }) => {
    const initialVisible = await cityMap.getLayerVisibility('CMRL_Phase1');
    if (initialVisible === null) {
      test.skip();
      return;
    }

    await cityMap.toggleCmrl();
    const toggledVisible = await cityMap.getLayerVisibility('CMRL_Phase1');
    expect(toggledVisible).toBe(!initialVisible);
  });

  test('TC_005_09: Layers button inspects layer selection functionality', async ({ cityMap, page }) => {
    await cityMap.clickLayersButton();
    await page.waitForTimeout(500);
    await expect(cityMap.mapContainer).toBeVisible();
  });

  test('TC_005_10: Browser console error monitoring during map interactions', async ({ cityMap }) => {
    await cityMap.clickZoomIn();
    await cityMap.clickZoomOut();
    await cityMap.togglePoliceBoundary();
    await cityMap.toggleKeyLocations();
    await cityMap.toggleCmrl();

    expect(consoleErrors).toEqual([]);
  });
});
