import { test } from "@playwright/test";

test("SPA navigate to news-updates", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.waitForTimeout(4000);
  
  const loginFormVis = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
  console.log("Login form visible:", loginFormVis, "URL:", page.url());
  
  if (!loginFormVis) {
    // Use pushState to navigate
    await page.evaluate(() => {
      window.history.pushState({}, "", "/chennai-news-updates");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.waitForTimeout(3000);
    console.log("After pushState URL:", page.url());
    
    const body = (await page.locator("body").innerText()).substring(0, 1500);
    console.log("Body:", body);
    
    for (const sel of [
      "div.newsbackground", "div[class*='newsbackground']",
      ".backgroundtail", "div:has(button:has-text('Read More'))"
    ]) {
      const count = await page.locator(sel).count();
      if (count > 0) console.log(`"${sel}": ${count}`);
    }
    
    const readMoreBtns = await page.locator("button:has-text('Read More')").count();
    console.log("Read More buttons:", readMoreBtns);
  }
});
