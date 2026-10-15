import { test } from "@playwright/test";

test("find CMS news management URL", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.waitForTimeout(3000);
  console.log("Logged in URL:", page.url());
  
  // List ALL anchor tags
  const allAnchors = await page.locator("a[href]").all();
  const hrefSet = new Set<string>();
  for (const a of allAnchors) {
    const href = await a.getAttribute("href");
    if (href && !href.startsWith("http")) hrefSet.add(href);
  }
  console.log("Internal hrefs:", Array.from(hrefSet).sort().join("\n"));
  
  // Navigate to news updates with scroll
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500); // Check URL very quickly
  console.log("Quick check URL 500ms:", page.url());
  await page.waitForTimeout(2000);
  console.log("URL after 2.5s:", page.url());
  
  // Check news content on /chennai-news-updates before redirect  
  const newsbackground = await page.locator("div.newsbackground").count();
  console.log("div.newsbackground count on news page:", newsbackground);
  const bodyText = (await page.locator("body").innerText()).substring(0, 500);
  console.log("Body:", bodyText);
});
