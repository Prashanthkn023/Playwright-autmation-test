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
        const incompleteImages: string[] = [];
        const loadedImages: string[] = [];

        // Wait for page to be fully loaded
        await this.page.waitForLoadState('networkidle', { timeout: 120000 });

        // Trigger lazy-loading
        console.log("Scrolling page to trigger lazy-loaded images...");
        await this.page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 300;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 150);
            });
        });

        // Condition-based wait for images to complete loading attempts
        console.log("Waiting for all images to complete loading (up to 30s)...");
        try {
            await this.page.waitForFunction(() => {
                const imgs = Array.from(document.querySelectorAll('img[src^="https://gctp.in/"]')) as HTMLImageElement[];
                return imgs.every((img) => img.complete);
            }, { timeout: 30000 });
        } catch (e) {
            console.log("WARNING: Timeout reached while waiting for images to complete. Checking partial results.");
        }

        // Bulk evaluation
        const imageDetailsList = await images.evaluateAll((elements: HTMLImageElement[]) =>
            elements.map((img) => ({
                src: img.getAttribute('src'),
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete,
                isLoaded: img.naturalWidth > 0 && img.naturalHeight > 0 && img.complete,
            }))
        );

        // Process results
        for (let i = 0; i < imageDetailsList.length; i++) {
            const item = imageDetailsList[i];
            const src = item?.src || 'Unknown URL';

            if (!item.complete) {
                console.log(`\nImage ${i + 1}: ${src} - Incomplete loading.`);
                incompleteImages.push(src);
                brokenImages.push(src);
            } else if (item.isLoaded) {
                console.log(`\nImage ${i + 1}: ${src} - PASS`);
                loadedImages.push(src);
            } else {
                console.log(`\nImage ${i + 1}: ${src} - FAIL (Broken or zero dimensions)`);
                brokenImages.push(src);
            }
        }

        console.log("\n======================================");
        console.log(`Summary:`);
        console.log(`   Total Images: ${count}`);
        console.log(`   Loaded: ${loadedImages.length}`);
        console.log(`   Broken: ${brokenImages.length}`);
        if (incompleteImages.length > 0) {
            console.log(`   Incomplete: ${incompleteImages.length}`);
        }

        if (brokenImages.length > 0) {
            console.log(`\nBroken Images (${brokenImages.length}):`);
            brokenImages.forEach((img, idx) => console.log(`   ${idx + 1}. ${img}`));
        } else {
            console.log("\nAll Images Loaded Successfully!");
        }

        console.log("======================================\n");

        expect(
            brokenImages,
            `TEST FAILED: ${brokenImages.length} broken/incomplete image(s) found out of ${count} total images. ` +
            `Broken images: ${brokenImages.join(', ')}`
        ).toEqual([]);
    }
}
