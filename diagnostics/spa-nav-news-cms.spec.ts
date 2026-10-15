import { test } from "@playwright/test";

test("SPA navigate to news-Cms", async ({ page }) => {
  // Do manual login to avoid rate-limit issues
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  const resp = await rp.catch(() => null);
  console.log("Login status:", resp?.status());
  
  // Wait for React to process login
  await page.waitForTimeout(4000);
  console.log("After wait URL:", page.url());
  const loginFormVis = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
  console.log("Login form visible:", loginFormVis);
  
  if (!loginFormVis) {
    // Navigate to news-Cms via react router (push state - simulate link click using evaluate)
    await page.evaluate(() => {
      window.history.pushState({}, "", "/chennai-news-updates-Cms");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.waitForTimeout(2000);
    console.log("After pushState URL:", page.url());
    const body = (await page.locator("body").innerText()).substring(0, 1000);
    console.log("Body:", body);
    
    // Check for news cards
    for (const sel of ["div.newsbackground", ".backgroundtail", "div[class*='news']", "table", "tr"]) {
      const count = await page.locator(sel).count();
      if (count > 0) console.log(`"${sel}": ${count}`);
    }
    
    const readMoreBtns = await page.locator("button:has-text('Read More')").count();
    console.log("Read More buttons:", readMoreBtns);
  }
});
