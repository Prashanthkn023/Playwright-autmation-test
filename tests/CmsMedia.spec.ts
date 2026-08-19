import{test, expect} from '@playwright/test';
const baseurl = "https://gctp.in"
test('verfiy the cms media page content',async({page})=> {

    await page.goto(baseurl)
    await page.getByRole('link',{name:"media"}).click();
    await expect(page.getByRole('navigation').getByText('media')).toBeVisible();
    await expect(page.getByText('photos')).toBeVisible(); 
    await expect(page.locator('.home-hero-card-imgGTGC img.imageStyle1').first()).toBeVisible();
    await expect(page.getByText('Helmet Awareness Drive')).toBeVisible();
    await page.getByText('Read More').first().click();
    await expect(page.getByText('Greater Chennai Traffic Police conducted a “No Helmet – No Fuel” awareness campaign at Retteri.')).toBeVisible();
    await expect(page.locator('.home-hero-card-imgGTGC img.imageStyle1').nth(1)).toBeVisible();
    await expect(page.getByText('Road Safety Awareness Quiz 2025')).toBeVisible();
    await page.getByText('Read More').first().click();
    await expect(page.getByText(/Students actively participated in the road safety awareness session by identifying traffic signs/)).toBeVisible();
    await expect(page.locator('.home-hero-card-imgGTGC img.imageStyle1').nth(2)).toBeVisible();
    await expect(page.getByText('Ride for Road Safety')).toBeVisible();
    await page.getByText('Read More').first().click();
    await expect(page.getByText(/Hundreds joined the Road Safety Cyclothon 2026 to spread awareness about safe driving./)).toBeVisible();
    await page.getByText('VIDEOS').click();
    const video = page.locator('video')
    await expect(video).toBeVisible();
    await expect(page.getByText('Strap Your Helmet. Save Your Life.')).toBeVisible();
    await expect(page.getByText('A loose strap is no protection-secure it every single ride.')).toBeVisible();
    const iframes = page.locator('iframe');
    await expect(iframes).toHaveCount(3);
    await expect(iframes.nth(1)).toBeVisible();
    const src = await iframes.nth(1).getAttribute('src');
    expect(src).toContain('youtube.com/embed');
    await expect(page.getByText('Air Conditioned Helmet',{exact:true})).toBeVisible();
    await expect(page.getByText('Chennai Traffic Cops Get Air Conditioned helmet to beat the heat')).toBeVisible();


});