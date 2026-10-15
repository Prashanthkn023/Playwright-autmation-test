import { test } from "@playwright/test";

test("check CMS news URL navigation", async ({ page }) => {
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
  await page.waitForTimeout(3000);
  console.log("1. After login URL:", page.url());
  
  // Now navigate to the CMS news URL (with -Cms suffix)
  await page.goto("https://cms.gctp.in/chennai-news-updates-Cms", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("2. After goto(chennai-news-updates-Cms):", page.url());
  
  // Now navigate to the listing URL (without -Cms suffix)
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("3. After goto(chennai-news-updates):", page.url());
  
  // Also try checking what's on the news updates page
  const cards = page.locator('div.newsbackground:has(button:has-text("Read More"))');
  const count = await cards.count();
  console.log("4. News cards found:", count);
  
  // Check if there are other news-related elements
  const newsItems = await page.locator(".newsbackground, .news-card, [class*='news']").count();
  console.log("5. News-related elements:", newsItems);
});
