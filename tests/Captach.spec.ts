import { test, expect } from "@playwright/test";
import Tesseract from "tesseract.js";

test("Validate the feedback form", async ({ page }) => {
  await page.goto("https://gctp.in/chennai-feedback");

  // Select a rating
  await page.locator(".star-rating .star").nth(4).click();

  // Enter a message
  await page
    .getByPlaceholder("Your Message*")
    .fill("Feedback form validation using Playwright");

  // Capture the CAPTCHA canvas
  await page.locator("#canv").screenshot({
    path: "captcha.png"
  });

  // Read the CAPTCHA
  const result = await Tesseract.recognize(
    "captcha.png",
    "eng"
  );

  const captchaText = result.data.text
    .replace(/\s/g, "")
    .trim();

  console.log(`CAPTCHA: ${captchaText}`);

  // Enter the CAPTCHA
  await page
    .locator('input[name="user_captcha_input"]')
    .fill(captchaText);

  // Submit the form
  await page.getByRole("button", {
    name: "Submit"
  }).click();

  // Verify the success message
  await expect(
    page.getByText(/Feedback submitted successfully/i)
  ).toBeVisible({
    timeout: 10000
  });
});