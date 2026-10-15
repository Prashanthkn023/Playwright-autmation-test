import { test } from "@playwright/test";

test("diagnose CMS login polling issue", async ({ page }) => {
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

  // Check multiple times
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    
    const emailSelector = 'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]';
    const emailVis = await page.locator(emailSelector).first().isVisible().catch(() => false);
    const passwordVis = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
    
    // Get all visible email inputs
    const allEmailInputs = await page.locator(emailSelector).all();
    const visibleEmailDetails: string[] = [];
    for (const inp of allEmailInputs) {
      const vis = await inp.isVisible().catch(() => false);
      if (vis) {
        const n = await inp.getAttribute("name");
        const t = await inp.getAttribute("type");
        const p = await inp.getAttribute("placeholder");
        const val = await inp.inputValue().catch(() => "");
        visibleEmailDetails.push(`type=${t} name=${n} placeholder=${p} value=${val}`);
      }
    }
    
    console.log(`Poll ${i}: emailVis=${emailVis} passwordVis=${passwordVis} url=${page.url()}`);
    if (visibleEmailDetails.length > 0) {
      console.log(`  Visible email inputs: ${visibleEmailDetails.join("; ")}`);
    }
    
    if (!emailVis && !passwordVis) {
      console.log("Form gone at poll " + i);
      break;
    }
  }
  
  await page.screenshot({ path: "test-results/post-login-debug.png", fullPage: false });
});
