import { test } from '../fixtures/baseTest';

test('TC_001 Validate Home Page Images', async ({ home, image }) => {

    await home.openHomePage();

    await image.validateHomePageImages();

});
