import { test } from "@playwright/test";

test("inspect CMS news listing page", async ({ page }) => {
  // Login
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.waitForTimeout(3000);
  console.log("After login:", page.url());
  
  // Use force click on the News link
  const newsLink = page.locator("a[href='/chennai-news-updates']").first();
  await page.locator(".flash-popup, .flash-popup-overlay").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
  await newsLink.click({ force: true });
  await page.waitForURL(/chennai-news-updates/, { timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(3000);
  console.log("After News click:", page.url());
  
  const bodyText = await page.locator("body").innerText();
  console.log("Body text (1000):", bodyText.substring(0, 1000));
  
  // Check for different card selectors
  for (const sel of [
    "div.newsbackground", 
    ".news-card", 
    "[class*=newsbackground]",
    "div:has(button:has-text('Read More'))",
    "button:has-text('Read More')"
  ]) {
    const count = await page.locator(sel).count();
    console.log(`Selector "${sel}": ${count}`);
  }
});
