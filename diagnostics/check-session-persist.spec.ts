import { test } from "@playwright/test";

test("check session persistence", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  const rp = page.waitForResponse(r => r.url().includes("/users/login"), { timeout: 15000 });
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await rp.catch(() => null);
  await page.waitForTimeout(2000);
  
  // Check localStorage
  const ls1 = await page.evaluate(() => {
    const d: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) d[k] = (localStorage.getItem(k) || "").substring(0, 100);
    }
    return d;
  });
  console.log("LS after login:", JSON.stringify(ls1));
  
  // Navigate to news updates
  await page.goto("https://cms.gctp.in/chennai-news-updates", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  
  // Check localStorage after navigate
  const ls2 = await page.evaluate(() => {
    const d: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) d[k] = (localStorage.getItem(k) || "").substring(0, 100);
    }
    return d;
  });
  console.log("LS after goto news:", JSON.stringify(ls2));
  console.log("URL:", page.url());
  
  const loginFormVis = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
  console.log("Login form visible after goto:", loginFormVis);
});
