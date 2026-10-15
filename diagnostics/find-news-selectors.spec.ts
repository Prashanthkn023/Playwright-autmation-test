import { test } from "@playwright/test";
import { loginToConfiguredCms } from "../utils/cmsLogin";

test("find news card selectors", async ({ page }) => {
  await loginToConfiguredCms(page, "https://cms.gctp.in/chennai-news-updates-Cms");
  console.log("URL:", page.url());
  
  // Close awareness popup
  await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(1000);
  
  // Look for news section cards - search for the specific news content
  // The body shows "Wear Helmet / Safer Pedestrian Walk / Smart Traffic Management..." etc
  // These appear to be announcement cards, NOT news cards
  
  // Let's look at what content is on the page in more detail
  // and find any Read More buttons that are part of news cards
  const readMoreButtons = await page.locator("button:has-text('Read More')").all();
  console.log("Total Read More buttons:", readMoreButtons.length);
  
  for (let i = 0; i < readMoreButtons.length; i++) {
    const btn = readMoreButtons[i];
    const parent = btn.locator("..");
    const grandParent = parent.locator("..");
    const greatGrandParent = grandParent.locator("..");
    
    const parentCls = await parent.getAttribute("class");
    const gpCls = await grandParent.getAttribute("class");
    const ggpCls = await greatGrandParent.getAttribute("class");
    
    // Get the nearby heading
    const nearbyText = (await greatGrandParent.textContent())?.substring(0, 100);
    
    console.log(`Button ${i+1}:`);
    console.log(`  parent class: "${parentCls}"`);
    console.log(`  grandparent class: "${gpCls}"`);
    console.log(`  great-grandparent class: "${ggpCls}"`);
    console.log(`  text: "${nearbyText?.trim()}"`);
  }
  
  // Try to find news-specific cards (not traffic announcements)
  const newsHeadings = await page.locator("h1, h2, h3, h4").allTextContents();
  console.log("Headings:", newsHeadings.slice(0, 10).join(" | "));
});
