import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to CMS home
  await page.goto("https://cms.gctp.in/chennai-home", { 
    waitUntil: "domcontentloaded",
    timeout: 30000 
  });
  
  console.log("Before login URL:", page.url());
  
  const usernameField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  
  if (await usernameField.isVisible().catch(() => false)) {
    await usernameField.fill(process.env.CMS_USERNAME || "");
    await passwordField.fill(process.env.CMS_PASSWORD || "");
    
    const respPromise = page.waitForResponse(
      r => r.url().includes("/api/fusion-configuration-service/users/login"),
      { timeout: 15000 }
    ).catch(() => null);
    
    await page.getByRole("button", { name: /^login$/i }).first().click();
    const resp = await respPromise;
    
    if (resp) {
      console.log("Login API status:", resp.status());
    }
    
    // Wait longer for React to update
    await page.waitForTimeout(5000);
    console.log("URL after login:", page.url());
    
    const ls = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = (localStorage.getItem(key) || "").substring(0, 200);
      }
      return data;
    });
    console.log("LocalStorage keys:", Object.keys(ls));
    console.log("LocalStorage data:", JSON.stringify(ls, null, 2));
    
    const isFormVisible = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
    console.log("Login form still visible:", isFormVisible);
  }
  
  await browser.close();
}

main().catch(console.error);
