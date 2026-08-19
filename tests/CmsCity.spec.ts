import{test, expect} from '@playwright/test';
const baseurl = 'https://gctp.in/chennai-home';
test('verify the cms City profile page content', async({page}) =>{
    await page.goto(baseurl);
    await page.getByRole('link', { name: 'City Profile' }).click();
    await expect(page.getByText('CITY PROFILE', { exact: true })).toBeVisible();
    await expect(page.getByText('Chennai is not just a metropolis; it is a living museum of culture, temples, and traditions that breathe beauty into modern life.')).toBeVisible();
    await expect(page.getByText('TOP ATTRACTIONS')).toBeVisible();
    await expect(page.locator('.home-hero-card-imgGTGC > img').first()).toBeVisible();
    await expect(page.getByText("Children's Road Safety  and Traffic Park")).toBeVisible();
    await expect(page.getByText('The Children’s Traffic Park is a historically significant road‑safety learning space in Chennai,')).toBeVisible();
    await expect(page.locator('div:nth-child(2) > .home-hero-card-imgGTGC > img')).toBeVisible();
    await expect(page.getByText('Police Memorial')).toBeVisible();
    await expect(page.getByText('The memorial is the focal point of Police Commemoration Day, observed annually on 21 October.')).toBeVisible();
    await expect(page.locator('div:nth-child(3) > .home-hero-card-imgGTGC > img')).toBeVisible();
    await expect(page.getByText('Tamil Nadu State Police Museum')).toBeVisible();
    await expect(page.getByText('The museum operates from the')).toBeVisible();
    await expect(page.locator('.GCTPImg')).toBeVisible();
});