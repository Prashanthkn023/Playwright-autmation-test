import { test } from '../fixtures/baseTest';

test.beforeEach(async ({ cms }) => {
  await cms.navigate();
});

test('Important Links', async ({ cms }) => {
  await cms.verifyImportantLinks();
});

test('Helpline', async ({ cms }) => {
  await cms.verifyHelpline();
});

test('Traffic Updates', async ({ cms }) => {
  await cms.verifyTrafficUpdates();
});

test('Empanelment', async ({ cms }) => {
  await cms.verifyEmpanelment();
});

test('Home Page Sliders', async ({ cms }) => {
  await cms.verifyHomePageSliders();
});

test('FAQ', async ({ cms }) => {
  await cms.verifyFAQ();
});

test('Footer Links', async ({ cms }) => {
  await cms.verifyFooterLinks();
});