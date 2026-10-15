import { test } from "@playwright/test";

test("check CMS localStorage", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  
  const usernameField = page.locator('input[type="email"]').first();
  await usernameField.waitFor({ timeout: 15000 });
  
  await usernameField.fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  
  const respPromise = page.waitForResponse(
    r => r.url().includes("/api/fusion-configuration-service/users/login"),
    { timeout: 15000 }
  );
  
  await page.getByRole("button", { name: /^login$/i }).first().click();
  const resp = await respPromise.catch(() => null);
  
  if (resp) {
    console.log("LOGIN STATUS:", resp.status());
  }
  
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());
  
  const ls = await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = (localStorage.getItem(key) || "").substring(0, 300);
    }
    return data;
  });
  console.log("LS KEYS:", Object.keys(ls).join(", "));
  console.log("LS DATA:", JSON.stringify(ls, null, 2));
});
