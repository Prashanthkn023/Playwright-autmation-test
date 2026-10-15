import { test } from "@playwright/test";

test("check news listing immediately", async ({ page }) => {
  // Login
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.locator('input[type="password"]').first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("Logged in at:", page.url());
  
  // Navigate to listing URL - check BEFORE redirect
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded" });
  // Immediate check after domcontentloaded - before React redirect
  console.log("URL immediately:", page.url());
  
  // Check cards
  for (const sel of [
    "div.newsbackground",
    "div[class*='newsbackground']",
    "div.backgroundtail",
    "div:has(button:has-text('Read More'))",
    ".MuiGrid-item:has(button:has-text('Read More'))"
  ]) {
    const count = await page.locator(sel).count();
    if (count > 0) console.log(`FOUND "${sel}": ${count}`);
  }
  
  // Wait a bit and check again
  await page.waitForTimeout(1500);
  console.log("URL after 1.5s:", page.url());
  const body = (await page.locator("body").innerText()).substring(0, 1000);
  console.log("Body:", body);
  
  for (const sel of [
    "div.newsbackground",
    "div[class*='newsbackground']",
    "button:has-text('Read More')"
  ]) {
    const count = await page.locator(sel).count();
    console.log(`"${sel}": ${count}`);
  }
});
