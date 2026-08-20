import { Page, expect } from '@playwright/test';

export class ImageValidationPage {

    constructor(private page: Page) {}

    // Validate all images whose src starts with https://gctp.in/
    async validateHomePageImages() {

        const images = this.page.locator('img[src^="https://gctp.in/"]');
        const count = await images.count();

        console.log("\n======================================");
        console.log(`Total Images Found : ${count}`);
        console.log("======================================");

        const brokenImages: string[] = [];

        // Wait for page to be fully loaded with extended timeout
        await this.page.waitForLoadState('networkidle', { timeout: 120000 });
        
        // Add additional wait time for images to load
        await this.page.waitForTimeout(5000);

        if (count === 0) {
            console.log("WARNING: No images found on the page with src starting with https://gctp.in/");
            console.log("======================================\n");
            return;
        }

        for (let i = 0; i < count; i++) {

            const src = await images.nth(i).getAttribute('src');

            if (!src) {
                console.log(`SKIPPED Image ${i + 1} - No src attribute`);
                continue;
            }

            try {

                // Check if image is actually loaded by verifying naturalWidth
                const isLoaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
                    return img.naturalWidth > 0 && img.naturalHeight > 0 && img.complete;
                }).catch(() => false);

                if (isLoaded) {
                    console.log(`PASS : ${src}`);
                } else {
                    console.log(`FAIL : ${src} - Image not loaded or has zero dimensions`);
                    brokenImages.push(src);
                }

            } catch (error) {

                console.log(`ERROR : ${src} - ${error}`);

                brokenImages.push(src);
            }
        }

        console.log("\n======================================");

        if (brokenImages.length > 0) {

            console.log("Broken Images:");

            brokenImages.forEach(img => console.log(img));

        } else {

            console.log("All Images Loaded Successfully");

        }

        console.log("======================================");

        expect(
            brokenImages,
            `${brokenImages.length} Broken Images Found`
        ).toEqual([]);
    }
}
