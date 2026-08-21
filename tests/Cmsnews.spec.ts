import{test, expect} from '@playwright/test';
const baseurl = 'https://gctp.in/chennai-home'
test('verfiy the cms news page content',async({ page })=>{
await page.goto('baseurl')
  await page.getByRole('link', { name: 'News' }).click();
  await page.locator('section').filter({ hasText: 'Mega Bike Rally for Road' }).getByRole('button').click();
  await expect(page.getByRole('heading', { name: 'Mega Bike Rally for Road' })).toBeVisible();
  await page.getByText('Mega Bike Rally for Road Safety, is scheduled for early 2026, organized by the').click();
  await expect(page.getByRole('heading', { name: 'Mega Bike Rally for Road' })).toBeVisible();
  await expect(page.getByText('Mega Bike Rally for Road Safety, is scheduled for early 2026, organized by the')).toBeVisible();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.locator('section').filter({ hasText: 'Zero Accident Day’ Drive' }).getByRole('button').click();
  await expect(page.getByRole('heading', { name: 'Zero Accident Day’ Drive' })).toBeVisible();
  await page.getByText('This comes in the backdrop of').click();
  await expect(page.getByRole('img', { name: 'Zero Accident Day’ Drive' })).toBeVisible();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();


})