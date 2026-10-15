import { test } from "@playwright/test";

test("inspect CMS home news cards", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.waitForTimeout(3000);
  console.log("URL:", page.url());
  
  // Look for the actual CMS news module URL via navigation
  const newsLinks = await page.locator("a[href*='news']").all();
  for (const link of newsLinks.slice(0, 5)) {
    const href = await link.getAttribute("href");
    const text = (await link.textContent())?.trim().substring(0, 50);
    console.log(`News link: href="${href}" text="${text}"`);
  }
  
  // Check what CMS news module URL looks like
  // The CmsNewsPage.ts has cmsNewsUrl = 'https://cms.gctp.in/chennai-news-updates-Cms'
  await page.goto("https://cms.gctp.in/chennai-news-updates-Cms", { waitUntil: "domcontentloaded" }).catch(() => null);
  await page.waitForTimeout(3000);
  console.log("CmsUrl after goto:", page.url());
  
  const bodyText = await page.locator("body").innerText();
  console.log("Body (2000):", bodyText.substring(0, 2000));
  
  // Check for newsbackground specifically
  const cards = await page.locator("div.newsbackground").count();
  console.log("div.newsbackground count:", cards);
  
  const readMore = await page.locator("button:has-text('Read More')").count();
  console.log("Read More buttons:", readMore);
});
