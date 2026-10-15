import { test } from "@playwright/test";
import { loginToConfiguredCms } from "../utils/cmsLogin";

test("CMS news navigation via loginToCms", async ({ page }) => {
  // Use the actual loginToCms function
  await loginToConfiguredCms(page, "https://cms.gctp.in/chennai-news-updates-Cms");
  console.log("After loginToCms URL:", page.url());
  
  const body1 = (await page.locator("body").innerText()).substring(0, 300);
  console.log("Body after login:", body1);
  
  // Close flash popup
  const popup = page.locator(".flash-popup:visible, .flash-popup-overlay:visible").first();
  if (await popup.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(1000);
  }
  
  // Try clicking news link
  const newsLink = page.locator("a[href='/chennai-news-updates'], a[href*='news-updates']").first();
  const isLinkVisible = await newsLink.isVisible({ timeout: 3000 }).catch(() => false);
  console.log("News link visible:", isLinkVisible);
  
  if (isLinkVisible) {
    await newsLink.click({ force: true });
    await page.waitForTimeout(3000);
    console.log("After news link click URL:", page.url());
    
    const body2 = (await page.locator("body").innerText()).substring(0, 500);
    console.log("Body after news click:", body2);
    
    // Check for news cards
    const newsCards = await page.locator("div.newsbackground:has(button:has-text('Read More'))").count();
    const readMoreBtns = await page.locator("button:has-text('Read More')").count();
    console.log("News cards:", newsCards, "Read More buttons:", readMoreBtns);
    
    // Check all divs near Read More
    const divs = await page.locator("div:has(button:has-text('Read More'))").all();
    console.log("Divs with Read More:", divs.length);
    for (const d of divs.slice(0, 3)) {
      const cls = await d.getAttribute("class");
      const txt = (await d.textContent())?.substring(0, 80);
      console.log(`  class="${cls}" "${txt?.trim()}"`);
    }
  }
});
