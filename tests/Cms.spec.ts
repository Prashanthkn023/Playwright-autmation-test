import { test } from "@playwright/test";
import { CmsPage } from "../pages/CmsPage";

test.beforeEach(async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.navigate();
});

test("Important Links", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyImportantLinks();
});

test("Helpline", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyHelpline();
});

test("Traffic Updates", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyTrafficUpdates();
});

test("Empanelment", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyEmpanelment();
});

test("Home Page Sliders", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyHomePageSliders();
});

test("FAQ", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyFAQ();
});

test("Footer Links", async ({ page }) => {
  const cmsPage = new CmsPage(page);

  await cmsPage.verifyFooterLinks();
});