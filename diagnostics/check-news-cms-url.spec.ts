import { test } from "@playwright/test";

test("check news-Cms URL after login", async ({ page }) => {
  // Login at /chennai-home
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  
  // Wait for auth
  await page.locator('input[type="password"]').first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(2000);
  console.log("After login URL:", page.url());
  
  // Now navigate to the CMS news URL (used as cmsUrl in Cmsnews test)
  await page.goto("https://cms.gctp.in/chennai-news-updates-Cms", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("After goto(chennai-news-updates-Cms):", page.url());
  
  const emailVis = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
  const passwordVis = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
  console.log("Login form: email=", emailVis, "password=", passwordVis);
  
  const bodyText = (await page.locator("body").innerText()).substring(0, 500);
  console.log("Body:", bodyText);
  
  // Check for news management content
  const newsTable = await page.locator("table, [class*='table']").count();
  const newsCards = await page.locator("div.newsbackground, [class*='newsbackground']").count();
  console.log("Tables:", newsTable, "newsbackground:", newsCards);
  
  // Check anchor tags
  const anchors = await page.locator("a[href]").count();
  console.log("Anchors:", anchors);
});
