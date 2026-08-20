import { Page, expect } from '@playwright/test';

export class ImageValidationPage {

    constructor(private page: Page) {}

    // Validate all images whose src starts with https://gctp.in/
    async validateHomePageImages() {

        const images = this.page.locator('img[src^="https://gctp.in/"]');
        const count = await images.count();

        console.log("\n======================================");
        console.log(`📸 Total Images Found : ${count}`);
        console.log("======================================");

        const brokenImages: string[] = [];
        const loadedImages: string[] = [];

        // Wait for page to be fully loaded with extended timeout
        console.log("⏳ Waiting for networkidle state (up to 120s)...");
        await this.page.waitForLoadState('networkidle', { timeout: 120000 });
        console.log("✓ Page reached networkidle state");
        
        // Add additional wait time for images to load
        console.log("⏳ Additional 5s wait for image rendering...");
        await this.page.waitForTimeout(5000);
        console.log("✓ Ready to validate images");

        if (count === 0) {
            console.log("⚠️  WARNING: No images found on the page with src starting with https://gctp.in/");
            console.log("Check if:");
            console.log("  1. The website is accessible");
            console.log("  2. Images exist with src starting with https://gctp.in/");
            console.log("  3. Images aren't loaded dynamically after page load");
            console.log("======================================\n");
            return;
        }

        for (let i = 0; i < count; i++) {

            const src = await images.nth(i).getAttribute('src');

            if (!src) {
                console.log(`⏭️  Image ${i + 1} - No src attribute`);
                continue;
            }

            try {

                // Check if image is actually loaded by verifying naturalWidth, naturalHeight, and complete state
                const imageDetails = await images.nth(i).evaluate((img: HTMLImageElement) => {
                    return {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        complete: img.complete,
                        currentSrc: img.currentSrc,
                        isLoaded: img.naturalWidth > 0 && img.naturalHeight > 0 && img.complete
                    };
                }).catch(() => null);

                if (imageDetails) {
                    console.log(`\n📍 Image ${i + 1}:`);
                    console.log(`   URL: ${src}`);
                    console.log(`   Dimensions: ${imageDetails.naturalWidth}x${imageDetails.naturalHeight}px`);
                    console.log(`   Complete: ${imageDetails.complete}`);

                    if (imageDetails.isLoaded) {
                        console.log(`   ✅ PASS - Image loaded successfully`);
                        loadedImages.push(src);
                    } else {
                        console.log(`   ❌ FAIL - Image not loaded or has zero dimensions`);
                        brokenImages.push(src);
                    }
                } else {
                    console.log(`\n📍 Image ${i + 1}:`);
                    console.log(`   URL: ${src}`);
                    console.log(`   ❌ ERROR - Could not evaluate image properties`);
                    brokenImages.push(src);
                }

            } catch (error) {

                console.log(`\n📍 Image ${i + 1}:`);
                console.log(`   URL: ${src}`);
                console.log(`   ❌ EXCEPTION: ${error}`);

                brokenImages.push(src);
            }
        }

        console.log("\n======================================");
        console.log(`📊 Summary:`);
        console.log(`   Total Images: ${count}`);
        console.log(`   ✅ Loaded: ${loadedImages.length}`);
        console.log(`   ❌ Broken: ${brokenImages.length}`);

        if (brokenImages.length > 0) {

            console.log(`\n❌ Broken Images (${brokenImages.length}):`);

            brokenImages.forEach((img, idx) => console.log(`   ${idx + 1}. ${img}`));

        } else {

            console.log("\n🎉 All Images Loaded Successfully!");

        }

        console.log("======================================\n");

        // Detailed assertion message for debugging
        expect(
            brokenImages,
            `❌ TEST FAILED: ${brokenImages.length} broken image(s) found out of ${count} total images. ` +
            `Broken images: ${brokenImages.join(', ')}`
        ).toEqual([]);
    }
}
