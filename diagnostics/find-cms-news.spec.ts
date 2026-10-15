import { test } from "@playwright/test";

test("find CMS news URL", async ({ page }) => {
  // Login first
  await page.goto("https://cms.gctp.in/chennai-home", { waitUntil: "domcontentloaded" });
  
  await page.locator('input[type="email"]').first().fill(process.env.CMS_USERNAME || "");
  await page.locator('input[type="password"]').first().fill(process.env.CMS_PASSWORD || "");
  
  const respPromise = page.waitForResponse(
    r => r.url().includes("/api/fusion-configuration-service/users/login"),
    { timeout: 15000 }
  );
  
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await respPromise.catch(() => null);
  await page.waitForTimeout(3000);
  
  console.log("After login URL:", page.url());
  
  // Look for news links in the navigation
  const navLinks = await page.locator("nav a, header a, .navAContainer").all();
  console.log("Nav links count:", navLinks.length);
  
  for (const link of navLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute("href");
    if (text?.toLowerCase().includes("news") || href?.toLowerCase().includes("news")) {
      console.log(`  News link: text="${text?.trim()}" href="${href}"`);
    }
  }
  
  // Try clicking the News link
  const newsLink = page.getByRole("link", { name: "News" }).first();
  if (await newsLink.isVisible().catch(() => false)) {
    await newsLink.click();
    await page.waitForTimeout(2000);
    console.log("After News click URL:", page.url());
  }
  
  // Now try direct navigation to news urls
  for (const path of ["/chennai-news-updates", "/chennai-news-updates-Cms", "/news", "/chennai-news"]) {
    await page.goto("https://cms.gctp.in" + path, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(1000);
    console.log(`  goto(${path}) -> ${page.url()}`);
  }
});
