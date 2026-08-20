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

        for (let i = 0; i < count; i++) {

            const src = await images.nth(i).getAttribute('src');

            if (!src) {
                console.log(`SKIPPED Image ${i + 1} - No src attribute`);
                continue;
            }

            try {

                const response = await this.page.request.head(src);

                if (response.ok()) {
                    console.log(`PASS : ${src}`);
                } else {
                    console.log(`FAIL : ${src} - ${response.status()}`);
                    brokenImages.push(src);
                }

            } catch (error) {

                console.log(`ERROR : ${src}`);

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