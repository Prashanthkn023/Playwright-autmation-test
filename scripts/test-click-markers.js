const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://gctp.in/chennai_map', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const mapDiv = document.getElementById('touristLocations_map_id');
    const fiberKey = Object.keys(mapDiv).find(k => k.startsWith('__reactFiber'));
    let current = mapDiv[fiberKey];
    let mapObj = null;
    while (current) {
      if (current.memoizedState && typeof current.memoizedState.getLayers === 'function') {
        mapObj = current.memoizedState;
        break;
      }
      current = current.return;
    }

    const layer = mapObj.getLayers().getArray().find(l => l.get('title') === 'Tourist_locations');
    const features = layer.getSource().getFeatures();
    const mapSize = mapObj.getSize();

    return features.map((f, i) => {
      const coords = f.getGeometry().getCoordinates();
      const px = mapObj.getPixelFromCoordinate(coords);
      return {
        index: i,
        name: f.get('f_place_name'),
        type: f.get('f_place_type'),
        coords,
        px,
        inViewport: px && px[0] > 50 && px[0] < mapSize[0] - 50 && px[1] > 50 && px[1] < mapSize[1] - 50
      };
    });
  });

  const inView = results.filter(r => r.inViewport);
  console.log('In viewport features count:', inView.length);
  console.log('Sample in viewport features:');
  inView.slice(0, 10).forEach(f => console.log(`[${f.type}] "${f.name}" at px (${f.px[0].toFixed(1)}, ${f.px[1].toFixed(1)})`));

  // Now test clicking one parking and one tourist feature
  const parkingFeature = inView.find(f => f.type === 'Parking');
  const touristFeature = inView.find(f => f.type !== 'Parking');

  console.log('\nTesting click on parking feature:', parkingFeature.name);
  const canvas = page.locator('#touristLocations_map_id canvas').first();
  await canvas.click({ position: { x: parkingFeature.px[0], y: parkingFeature.px[1] } });
  await page.waitForTimeout(1000);
  const popover = page.locator('.MuiPopover-paper, [role="dialog"], .ol-popup');
  const pVisible = await popover.first().isVisible().catch(() => false);
  const pText = pVisible ? await popover.first().textContent() : 'NOT VISIBLE';
  console.log('Parking Popup visible:', pVisible, 'Text:', pText);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('\nTesting click on tourist feature:', touristFeature.name);
  await canvas.click({ position: { x: touristFeature.px[0], y: touristFeature.px[1] } });
  await page.waitForTimeout(1000);
  const tVisible = await popover.first().isVisible().catch(() => false);
  const tText = tVisible ? await popover.first().textContent() : 'NOT VISIBLE';
  console.log('Tourist Popup visible:', tVisible, 'Text:', tText);

  await browser.close();
})();
