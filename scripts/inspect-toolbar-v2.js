
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://gctp.in/chennai_map');

  // Wait for map to load
  await page.waitForSelector('#touristLocations_map_id');

  // Find the button with LayersIcon to identify the toolbar container
  const layersBtn = page.locator('button:has(svg[data-testid="LayersIcon"])');
  await layersBtn.click(); // Open the panel
  await page.waitForTimeout(1000);

  const toolbarInfo = await page.evaluate(() => {
    // Look for the panel that opens
    // Based on previous logs, keyLocationsButton, cmrlButton, policeBoundaryButton are children of this panel
    const buttons = Array.from(document.querySelectorAll('button[aria-label]'));
    return buttons.map(b => ({
      ariaLabel: b.getAttribute('aria-label'),
      text: b.innerText,
      outerHTML: b.outerHTML,
      isVisible: b.offsetWidth > 0 && b.offsetHeight > 0
    }));
  });

  console.log('Toolbar Buttons Info:', JSON.stringify(toolbarInfo, null, 2));

  // Also check layer titles from OpenLayers map
  const layerTitles = await page.evaluate(() => {
    const mapDiv = document.getElementById('touristLocations_map_id');
    const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return 'Fiber key not found';
    let current = (mapDiv)[fiberKey];
    while (current) {
      if (current.memoizedState && typeof current.memoizedState.getLayers === 'function') {
        const layers = current.memoizedState.getLayers().getArray();
        return layers.map(l => ({
          title: l.get('title'),
          visible: l.getVisible()
        }));
      }
      current = current.return;
    }
    return 'Map not found';
  });

  console.log('Map Layers Info:', JSON.stringify(layerTitles, null, 2));

  await browser.close();
})();
