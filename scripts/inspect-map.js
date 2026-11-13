const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://gctp.in/chennai_map', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const mapDiv = document.getElementById('touristLocations_map_id');
    if (!mapDiv) return { error: 'No mapDiv' };
    const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return { error: 'No fiber' };
    let current = mapDiv[fiberKey];
    let mapObj = null;
    while (current) {
      let state = current.memoizedState;
      while (state) {
        if (state.memoizedState && typeof state.memoizedState.getLayers === 'function') {
          mapObj = state.memoizedState;
          break;
        }
        state = state.next;
      }
      if (mapObj) break;
      current = current.return;
    }
    if (!mapObj) return { error: 'No mapObj' };

    // Get overlays
    const overlays = mapObj.getOverlays().getArray().map(o => ({
      id: o.getId(),
      element: o.getElement() ? o.getElement().outerHTML.slice(0, 200) : null
    }));

    // Get listeners on map
    const listeners = mapObj.listeners_ ? Object.keys(mapObj.listeners_) : [];

    // Get Tourist_locations layer
    const layer = mapObj.getLayers().getArray().find(l => l.get('title') === 'Tourist_locations');
    const features = layer ? layer.getSource().getFeatures().map(f => ({
      name: f.get('f_place_name'),
      type: f.get('f_place_type'),
      coords: f.getGeometry().getCoordinates(),
      pixel: mapObj.getPixelFromCoordinate(f.getGeometry().getCoordinates())
    })) : [];

    return { overlays, listeners, featureCount: features.length, sampleFeatures: features.slice(0, 5) };
  });

  console.log('Map Info:', JSON.stringify(info, null, 2));
  await browser.close();
})();
