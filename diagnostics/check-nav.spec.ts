import { test } from "@playwright/test";

test("check all CMS nav links", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  // Wait for authenticated state
  await page.locator('input[type="password"]').first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(1000);
  console.log("URL:", page.url());
  
  // Hover over News to reveal sub-links
  const newsLink = page.locator("a:has-text('News')").first();
  if (await newsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newsLink.hover().catch(() => null);
    await page.waitForTimeout(1000);
  }
  
  // Get all anchor tags
  const allAnchors = await page.locator("a[href]").all();
  console.log("Total anchors:", allAnchors.length);
  for (const a of allAnchors) {
    const href = await a.getAttribute("href");
    const text = (await a.textContent())?.trim().substring(0, 40);
    if (text) console.log(`  href="${href}" | "${text}"`);
  }
  
  // Check for news-specific items
  const newsItems = await page.locator("a[href*='news'], a[href*='News']").all();
  console.log("News hrefs:", newsItems.length);
  for (const a of newsItems) {
    const href = await a.getAttribute("href");
    const text = (await a.textContent())?.trim();
    console.log(`  NEWS: href="${href}" | "${text}"`);
  }
});
