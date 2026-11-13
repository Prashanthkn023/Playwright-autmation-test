const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://gctp.in/chennai_map', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // Close any awareness popup
  try {
    const awareness = page.locator('.flash-popup-overlay:visible button').first();
    if (await awareness.isVisible({ timeout: 2000 })) {
      await awareness.click();
    }
  } catch (e) {}

  // Find all buttons inside or near the map container
  const buttonDetails = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(b => ({
      ariaLabel: b.getAttribute('aria-label'),
      title: b.getAttribute('title'),
      className: b.className,
      id: b.id,
      text: b.innerText,
      innerHTML: b.innerHTML.slice(0, 300),
      parentClass: b.parentElement ? b.parentElement.className : '',
      rect: b.getBoundingClientRect()
    })).filter(b => b.rect.width > 0 && b.rect.height > 0);
  });

  console.log('Visible buttons on page:');
  console.log(JSON.stringify(buttonDetails, null, 2));

  await browser.close();
})();
