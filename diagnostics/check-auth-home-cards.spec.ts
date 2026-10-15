import { test } from "@playwright/test";

test("check authenticated home news cards", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.locator('input[type="password"]').first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("URL:", page.url());
  
  // Close awareness popup
  const popup = page.locator(".flash-popup:visible, .flash-popup-overlay:visible").first();
  if (await popup.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(500);
  }
  
  // Check news section specifically
  const newsSection = page.locator("nav a[href='/chennai-news-updates']");
  if (await newsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newsSection.click({ force: true });
    await page.waitForTimeout(3000);
    console.log("After News click URL:", page.url());
  }
  
  const body = (await page.locator("body").innerText()).substring(0, 2000);
  console.log("Body:", body);
  
  // Check all newsbackground-related selectors
  for (const sel of [
    "div.newsbackground",
    "div[class*='newsbackground']",
    "section.newsbackground",
    "[class*='news'][class*='background']",
    "div:has(button:has-text('Read More'))",
    "div.backgroundtail",
    ".backgroundtail"
  ]) {
    const count = await page.locator(sel).count();
    if (count > 0) console.log(`"${sel}": ${count}`);
  }
  
  // Get outer div classes of cards
  const readMoreDivs = await page.locator("div:has(> button:has-text('Read More'))").all();
  console.log("Direct parent divs of ReadMore:", readMoreDivs.length);
  for (const div of readMoreDivs.slice(0, 3)) {
    const cls = await div.getAttribute("class");
    const text = (await div.textContent())?.substring(0, 80);
    console.log(`  class="${cls}" text="${text?.trim()}"`);
  }
});
