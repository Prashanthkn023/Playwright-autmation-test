import { test } from "@playwright/test";

test("find news cards on CMS", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  
  // Wait for auth transition - login form should disappear
  await page.locator('input[type="email"]').first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("Auth URL:", page.url());
  
  // Navigate to news section (the CMS redirects /chennai-news-updates to /chennai-home)
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  console.log("News URL:", page.url());
  
  // Inspect all elements
  const bodyText = (await page.locator("body").innerText()).substring(0, 3000);
  console.log("Body text:", bodyText);
  
  // Check for various card selectors
  for (const sel of [
    "div.newsbackground", "div[class*='news']", "div[class*='News']",
    ".backgroundtail", "div[class*='backgroundtail']",
    ".news-updates", "[class*='newscard']", "[class*='card']",
    "div:has(> button:has-text('Read More'))",
    ".MuiCard-root", ".MuiPaper-root"
  ]) {
    const count = await page.locator(sel).count();
    if (count > 0) console.log(`"${sel}": ${count}`);
  }
  
  // Get div classes that have Read More
  const divsWithReadMore = await page.locator("div:has(button:has-text('Read More'))").all();
  console.log("divs with Read More:", divsWithReadMore.length);
  for (const div of divsWithReadMore.slice(0, 3)) {
    const cls = await div.getAttribute("class");
    const text = (await div.textContent())?.substring(0, 100);
    console.log(`  class="${cls}" text="${text?.trim()}"`);
  }
});
