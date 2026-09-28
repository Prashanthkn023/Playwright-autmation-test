import { expect, test } from '@playwright/test';
import { CmsNewsPage } from '../pages/CmsNewsPage';

test('verify the live GCTP news updates content', async ({ page }) => {
  const newsPage = new CmsNewsPage(page);

  await newsPage.openNewsPage();
  await expect(page).toHaveURL(/chennai-news-updates/i);

  await expect(newsPage.trafficDiversionHeading).toBeVisible();
  await expect(newsPage.trafficDiversionDescription).toBeVisible();
  await expect(newsPage.trafficDiversionDescription).toContainText(
    'To reduce traffic congestion and improve vehicular movement'
  );
  await expect(newsPage.trafficDiversionImage).toBeVisible();
  await expect(newsPage.trafficDiversionReadMoreButton).toBeVisible();

  await newsPage.openTrafficDiversionDetails();
  await expect(page.getByRole('heading', {
    name: /Traffic Diversion and U-Turn Restrictions in OMR and Thuraipakkam Area/i,
  })).toBeVisible();
  await expect(page.getByText(/To reduce traffic congestion and improve vehicular movement/i)).toBeVisible();
  await expect(page.getByRole('img', {
    name: /Traffic Diversion and U-Turn Restrictions in OMR and Thuraipakkam Area/i,
  })).toBeVisible();

  await newsPage.goBackFromNewsDetail();
  await expect(page).toHaveURL(/chennai-news-updates/i);

  await expect(newsPage.pendingEChallanHeading).toBeVisible();
  await expect(newsPage.pendingEChallanDescription).toBeVisible();
  await expect(newsPage.pendingEChallanDescription).toContainText(
    'Verify and clear your pending e-Challans'
  );
  await expect(newsPage.pendingEChallanImage).toBeVisible();
  await expect(newsPage.pendingEChallanReadMoreButton).toBeVisible();

  await newsPage.openPendingEChallanDetails();
  await expect(page.getByRole('heading', {
    name: /Pending E-Challan Fine Verification/i,
  })).toBeVisible();
  await expect(page.getByText(/Verify and clear your pending e-Challans/i)).toBeVisible();
  await expect(page.getByRole('img', {
    name: /Pending E-Challan Fine Verification/i,
  })).toBeVisible();

  await newsPage.goBackFromNewsDetail();
  await expect(page).toHaveURL(/chennai-news-updates/i);

  await expect(newsPage.megaBikeRallyHeading).toBeVisible();
  await expect(newsPage.megaBikeRallyDescription).toBeVisible();
  await expect(newsPage.megaBikeRallyDescription).toContainText('Mega Bike Rally for Road Safety');
  await expect(newsPage.megaBikeRallyDescription).toContainText('scheduled for early 2026');
  await expect(newsPage.megaBikeRallyImage).toBeVisible();
  await expect(newsPage.megaBikeRallyReadMoreButton).toBeVisible();

  await newsPage.openMegaBikeRallyDetails();
  await expect(page.getByRole('heading', {
    name: /Mega Bike Rally for Road Safety/i,
  })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: /Mega Bike Rally for Road Safety.*scheduled for early 2026/i })).toBeVisible();
  await expect(page.getByRole('img', {
    name: /Mega Bike Rally for Road Safety/i,
  })).toBeVisible();

  await newsPage.goBackFromNewsDetail();
  await expect(page).toHaveURL(/chennai-news-updates/i);
});
