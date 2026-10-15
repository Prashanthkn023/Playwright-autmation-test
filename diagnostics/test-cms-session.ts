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
  
  // Find and fill login form
  const usernameField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  
  const formVisible = await usernameField.isVisible().catch(() => false);
  console.log("Login form visible:", formVisible);
  
  if (formVisible) {
    await usernameField.fill(process.env.CMS_USERNAME || "");
    await passwordField.fill(process.env.CMS_PASSWORD || "");
    
    // Listen for login API
    const respPromise = page.waitForResponse(
      r => r.url().includes("/api/fusion-configuration-service/users/login") && r.request().method() === "POST",
      { timeout: 15000 }
    ).catch(() => null);
    
    await page.getByRole("button", { name: /^login$/i }).first().click();
    const resp = await respPromise;
    
    if (resp) {
      console.log("Login API status:", resp.status());
    }
    
    // Wait for page to change
    await page.waitForTimeout(3000);
    console.log("After login URL:", page.url());
    
    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          data[key] = val.substring(0, 100);
        }
      }
      return data;
    });
    console.log("LocalStorage keys:", Object.keys(localStorageData));
    console.log("LocalStorage (truncated):", JSON.stringify(localStorageData, null, 2));
    
    // Check cookies
    const cookies = await page.context().cookies();
    const cookieNames = cookies.map(c => `${c.name} (${c.domain})`);
    console.log("Cookies:", JSON.stringify(cookieNames));
  }
  
  await browser.close();
}

main().catch(console.error);
