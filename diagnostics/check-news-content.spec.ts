import { test } from "@playwright/test";

test("check news listing page content", async ({ page }) => {
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
  
  // Navigate to news listing
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log("URL:", page.url());
  
  const bodyText = await page.locator("body").innerText().catch(() => "");
  console.log("Body (first 500):", bodyText.substring(0, 500));
  
  // Check all div classes that might be cards
  const allDivs = await page.locator("div[class*='news']").all();
  console.log("divs with 'news' in class:", allDivs.length);
  
  for (const div of allDivs.slice(0, 5)) {
    const cls = await div.getAttribute("class");
    const text = (await div.textContent())?.substring(0, 60);
    console.log(`  div.${cls}: "${text}"`);
  }
  
  // Check for Read More buttons
  const readMoreBtns = await page.locator('button:has-text("Read More")').count();
  console.log("Read More buttons:", readMoreBtns);
  
  // Check what role="button" elements exist
  const buttons = await page.locator("button").allTextContents();
  console.log("All buttons:", buttons.slice(0, 10).join(", "));
});
