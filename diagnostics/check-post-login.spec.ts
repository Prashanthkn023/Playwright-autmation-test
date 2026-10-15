import { test } from "@playwright/test";

test("check CMS post-login state", async ({ page }) => {
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  
  const respPromise = page.waitForResponse(
    r => r.url().includes("/api/fusion-configuration-service/users/login"),
    { timeout: 15000 }
  );
  
  await page.getByRole("button", { name: /^login$/i }).first().click();
  const resp = await respPromise.catch(() => null);
  console.log("Login status:", resp?.status());
  
  // Wait for React to update
  await page.waitForTimeout(3000);
  console.log("URL after login:", page.url());
  
  // Check what email inputs are visible
  const emailInputs = await page.locator('input[name="username"], input[type="email"]').all();
  for (const input of emailInputs) {
    const vis = await input.isVisible().catch(() => false);
    const name = await input.getAttribute("name");
    const type = await input.getAttribute("type");
    const placeholder = await input.getAttribute("placeholder");
    console.log(`Email/username input: type=${type} name=${name} placeholder=${placeholder} visible=${vis}`);
  }
  
  const passwordInputs = await page.locator('input[type="password"]').all();
  for (const input of passwordInputs) {
    const vis = await input.isVisible().catch(() => false);
    console.log(`Password input visible=${vis}`);
  }
});
