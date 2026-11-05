import { test, expect } from '../fixtures/baseTest';

test('TC_005: City Map navigation, controls, and layer interactions', async ({ cityMap }) => {
  await cityMap.openCityMapFromHomePage();

  await expect(cityMap.mapContainer).toBeVisible();
  await expect(cityMap.mapCanvas).toBeVisible();
  await expect(cityMap.zoomInButton).toBeVisible();
  await expect(cityMap.zoomOutButton).toBeVisible();
  await expect(cityMap.fullScreenButton).toBeVisible();

  const initialZoom = await cityMap.getMapZoom();
  await cityMap.clickZoomIn();
  await cityMap.clickZoomIn();
  const zoomedIn = await cityMap.getMapZoom();
  expect(zoomedIn).toBeGreaterThan(initialZoom);

  await cityMap.clickZoomOut();
  await cityMap.clickZoomOut();
  expect(await cityMap.getMapZoom()).toBeLessThanOrEqual(zoomedIn);

  await cityMap.toggleFullScreen();
  await expect.poll(() => cityMap.isFullScreenActive()).toBe(true);
  await cityMap.clickMapCanvas({ x: 599, y: 17 });
  await expect(cityMap.mapCanvas).toBeVisible();
  await cityMap.toggleFullScreen();
  await expect.poll(() => cityMap.isFullScreenActive()).toBe(false);

  await cityMap.clickLayersButton();
  await expect(cityMap.keyLocationsButton).toBeVisible();
  await expect(cityMap.cmrlButton).toBeVisible();
  await expect(cityMap.policeBoundaryButton).toBeVisible();

  await cityMap.toggleCmrl();
  await cityMap.toggleCmrl();
  await cityMap.toggleKeyLocations();
  await cityMap.toggleKeyLocations();
  await cityMap.togglePoliceBoundary();
  await cityMap.togglePoliceBoundary();
  await cityMap.togglePoliceBoundary();
  await cityMap.toggleKeyLocations();
  await cityMap.clickMapCanvas();
  await expect(cityMap.mapCanvas).toBeVisible();

  await cityMap.toggleCmrl();
  await cityMap.toggleKeyLocations();
  await expect(cityMap.mapCanvas).toBeVisible();
  await cityMap.toggleKeyLocations();
  await cityMap.togglePoliceBoundary();

  await cityMap.openCityMap();
  await cityMap.clickLayersButton();
  await cityMap.toggleKeyLocations();
  await cityMap.toggleCmrl();
  await expect(cityMap.mapCanvas).toBeVisible();
  await cityMap.togglePoliceBoundary();
  await cityMap.toggleKeyLocations();
  await cityMap.toggleCmrl();
  await cityMap.toggleCmrl();
  await cityMap.togglePoliceBoundary();
  await cityMap.toggleCmrl();
  await cityMap.clickLayersButton();

  await expect(cityMap.mapContainer).toBeVisible();
  await expect(cityMap.mapCanvas).toBeVisible();
});
