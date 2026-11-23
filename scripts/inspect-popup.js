const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://gctp.in/chennai-home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000); // Wait for popup

  const dom = await page.evaluate(() => {
    const overlays = document.querySelectorAll('.flash-popup-overlay');
    const popups = document.querySelectorAll('.flash-popup');
    return {
      overlayCount: overlays.length,
      popupCount: popups.length,
      overlayHTML: Array.from(overlays).map(e => e.outerHTML.slice(0, 200)),
      popupHTML: Array.from(popups).map(e => e.outerHTML.slice(0, 200))
    };
  });
  console.log('DOM Structure:', JSON.stringify(dom, null, 2));
  await browser.close();
})();
