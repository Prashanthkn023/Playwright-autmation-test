import { test, expect } from "@playwright/test"
const baseurl = 'https://gctp.in/'
test('verify the cms contact_us page', async ({ page }) => {
    page.goto(baseurl);
    await page.getByRole('link', { name: 'Contact Us' }).click();
    await expect(page.getByText('GCTP CONTACT DETAILS')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'S.No.' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Officer Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Rank' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Office Phone Numbers' })).toBeVisible();
    await expect(page.getByRole('cell', { name: ' Dr. A. AMALRAJ, I.P.S' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Commissioner Of Police', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-23452320' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TR.P. BALAJI' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DCoP -Traffic(North)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-2345270' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TR.K.K. FEROZE KHAN ABDULLAH, I.P.S' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DCoP -Traffic (West)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '9498133663' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TMT. MEGALINA IDEN' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DCoP - Traffic (East)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-2345434' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TR. P. PAKALAVAN, I.P.S' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Joint Commissioner Of Police -Traffic (South)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-2345266' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TR. MUTHUKUMAR' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DCoP -Traffic (South)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-2345264' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'VACCANT' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Joint Commissioner Of Police - Traffic (North)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-2345262' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DR. B. SHAMOONDESWARI, I.P.S' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Additional Commissioner Of Police Traffic' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '044-25615081' })).toBeVisible();

});
