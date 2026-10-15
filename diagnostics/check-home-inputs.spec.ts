import { test } from "@playwright/test";

test("check CMS home page inputs without login", async ({ page }) => {
  // Go to CMS home page
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  
  const emailSelector = 'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]';
  const allEmailInputs = await page.locator(emailSelector).all();
  
  console.log("Total email-type inputs:", allEmailInputs.length);
  for (const inp of allEmailInputs) {
    const vis = await inp.isVisible().catch(() => false);
    const n = await inp.getAttribute("name");
    const t = await inp.getAttribute("type");
    const p = await inp.getAttribute("placeholder");
    const parentHtml = await inp.evaluate(el => el.closest("form")?.className || el.parentElement?.className || "no-form");
    console.log(`  input: type=${t} name=${n} placeholder=${p} visible=${vis} form=${parentHtml}`);
  }
  
  const allPasswordInputs = await page.locator('input[type="password"]').all();
  console.log("Total password inputs:", allPasswordInputs.length);
  for (const inp of allPasswordInputs) {
    const vis = await inp.isVisible().catch(() => false);
    const n = await inp.getAttribute("name");
    const p = await inp.getAttribute("placeholder");
    const parentHtml = await inp.evaluate(el => el.closest("form")?.className || el.parentElement?.className || "no-form");
    console.log(`  password: name=${n} placeholder=${p} visible=${vis} form=${parentHtml}`);
  }
});
