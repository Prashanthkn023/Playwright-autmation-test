import { test, expect } from "@playwright/test";

test("check CMS home inputs after login", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  
  const respPromise = page.waitForResponse(
    r => r.url().includes("/api/fusion-configuration-service/users/login"),
    { timeout: 15000 }
  );
  
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await respPromise.catch(() => null);
  
  // Check inputs at different time intervals
  for (const wait of [1000, 3000, 5000, 10000]) {
    await page.waitForTimeout(wait === 1000 ? wait : wait - (wait === 3000 ? 1000 : wait === 5000 ? 3000 : 5000));
    
    const emailCount = await page.locator('input[type="email"]:visible').count();
    const passwordCount = await page.locator('input[type="password"]:visible').count();
    console.log(`@${wait}ms: email inputs=${emailCount} password inputs=${passwordCount}`);
    
    if (emailCount > 0) {
      const emailInputs = await page.locator('input[type="email"]:visible').all();
      for (const inp of emailInputs) {
        const n = await inp.getAttribute("name");
        const p = await inp.getAttribute("placeholder");
        console.log(`  email input: name=${n} placeholder=${p}`);
      }
    }
    if (passwordCount > 0) {
      const pwInputs = await page.locator('input[type="password"]:visible').all();
      for (const inp of pwInputs) {
        const n = await inp.getAttribute("name");
        const p = await inp.getAttribute("placeholder");
        console.log(`  password input: name=${n} placeholder=${p}`);
      }
    }
  }
});
