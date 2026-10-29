import { test, expect } from '../fixtures/baseTest';

test.describe('Tamil Home Module – 01 Content Validation', () => {
  test.beforeEach(async ({ cmsTamil }) => {
    await cmsTamil.navigateToTamil();
  });

  test('Validate Helpline content', async ({ cmsTamil }) => {
    await cmsTamil.verifyHelplineTamil();
  });

  test('Validate Traffic Updates content', async ({ cmsTamil }) => {
    await cmsTamil.verifyTrafficUpdatesTamil();
  });

  test('Validate Important Links content', async ({ cmsTamil }) => {
    await cmsTamil.verifyImportantLinksTamil();
  });

  test('Validate Footer Links content', async ({ cmsTamil }) => {
    await cmsTamil.verifyFooterLinksTamil();
  });
});
