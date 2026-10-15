import { test } from "@playwright/test";

test("find correct CMS news URL", async ({ page }) => {
  // Login first  
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  
  const respPromise = page.waitForResponse(
    r => r.url().includes("/api/fusion-configuration-service/users/login"),
    { timeout: 15000 }
  );
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await respPromise.catch(() => null);
  
  // Wait for React to fully render the authenticated state
  await page.waitForTimeout(3000);
  console.log("After login URL:", page.url());
  
  // Log all anchor hrefs
  const anchors = await page.locator("a").all();
  console.log("Total anchors:", anchors.length);
  for (const a of anchors) {
    const href = await a.getAttribute("href");
    const text = (await a.textContent())?.trim().substring(0, 30);
    if (href && text) {
      console.log(`  <a href="${href}">${text}</a>`);
    }
  }
  
  // Look specifically for any "News" links
  const newsAnchors = await page.locator("a:has-text('News'), a[href*='news']").all();
  console.log("News anchors:", newsAnchors.length);
  
  // Try clicking the "News " text link in the nav (getByRole link named News)
  const newsLinkEl = page.getByRole("link", { name: "News" }).first();
  if (await newsLinkEl.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("News link found, href:", await newsLinkEl.getAttribute("href"));
    // Track navigation
    const navPromise = page.waitForURL("**/chennai*", { timeout: 10000 });
    await newsLinkEl.click();
    await navPromise.catch(() => null);
    await page.waitForTimeout(2000);
    console.log("After News click URL:", page.url());
    
    // Check for cards
    const cards = await page.locator('div.newsbackground, .news-card, [class*="news"][class*="card"]').count();
    console.log("Card-like elements:", cards);
    const readMoreBtns = await page.locator('button:has-text("Read More")').count();
    console.log("Read More buttons:", readMoreBtns);
  } else {
    console.log("News link not visible");
  }
});
