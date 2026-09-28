import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CmsContactUsPage extends BasePage {
  readonly contactUsLink: Locator;
  readonly contactDetailsHeading: Locator;
  readonly serialNumberHeader: Locator;
  readonly officerNameHeader: Locator;
  readonly rankHeader: Locator;
  readonly officePhoneNumbersHeader: Locator;
  readonly officerCells: Locator[];

  constructor(page: Page) {
    super(page);

    this.contactUsLink = page.getByRole('link', { name: 'Contact Us' });
    this.contactDetailsHeading = page.getByText('GCTP CONTACT DETAILS');
    this.serialNumberHeader = page.getByRole('columnheader', { name: 'S.No.' });
    this.officerNameHeader = page.getByRole('columnheader', { name: 'Officer Name' });
    this.rankHeader = page.getByRole('columnheader', { name: 'Designation' });
    this.officePhoneNumbersHeader = page.getByRole('columnheader', {
      name: 'Office Phone Numbers',
    });

    this.officerCells = [
      page.getByRole('cell', { name: 'Dr. A. AMALRAJ, I.P.S' }),
      page.getByRole('cell', { name: 'Commissioner Of Police', exact: true }),
      page.getByRole('cell', { name: '044-23452320' }),
      page.getByRole('cell', { name: 'TR.P. BALAJI' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (North)' }),
      page.getByRole('cell', { name: '044-2345270' }),
      page.getByRole('cell', { name: 'TR.K.K. FEROZE KHAN ABDULLAH, I.P.S' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (West)' }),
      page.getByRole('cell', { name: '9498133663' }),
      page.getByRole('cell', { name: 'TMT. MEGALINA IDEN' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (East)' }),
      page.getByRole('cell', { name: '044-2345434' }),
      page.getByRole('cell', { name: 'TR. P. PAKALAVAN, I.P.S' }),
      page.getByRole('cell', { name: 'Joint Commissioner Of Police - Traffic (South)' }),
      page.getByRole('cell', { name: '044-2345266' }),
      page.getByRole('cell', { name: 'TR. MUTHUKUMAR' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (South)' }),
      page.getByRole('cell', { name: '044-2345264' }),
      page.getByRole('cell', { name: 'VACANT' }),
      page.getByRole('cell', { name: 'Joint Commissioner Of Police - Traffic (North)' }),
      page.getByRole('cell', { name: '044-2345262' }),
      page.getByRole('cell', { name: 'DR. B. SHAMOONDESWARI, I.P.S' }),
      page.getByRole('cell', { name: 'Additional Commissioner Of Police Traffic' }),
      page.getByRole('cell', { name: '044-25615081' }),
    ];
  }

  async openHomePage() {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async loginToCms(cmsUrl: string, username: string, password: string) {
    const usernameInput = this.page.locator(
      'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]'
    );
    const passwordInput = this.page.locator('input[type="password"]');

    let loginFormLoaded = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      await this.page.goto(cmsUrl, { waitUntil: 'domcontentloaded' });

      loginFormLoaded = await usernameInput
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (!loginFormLoaded) {
        const loginTrigger = this.page.getByText('LOGIN', { exact: true });
        if (await loginTrigger.isVisible().catch(() => false)) {
          await loginTrigger.click().catch(() => undefined);
          loginFormLoaded = await usernameInput
            .isVisible({ timeout: 10000 })
            .catch(() => false);
        }
      }

      if (loginFormLoaded) {
        break;
      }
    }

    expect(loginFormLoaded, 'CMS login form should load').toBe(true);
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
    await expect(this.page.getByRole('navigation')).toBeVisible({ timeout: 30000 });
  }

  async openCmsContactUs() {
    const cmsContactUsText = this.page
      .getByRole('navigation')
      .getByText('Contact Us', { exact: true });

    await expect(cmsContactUsText).toBeVisible({ timeout: 30000 });
    await cmsContactUsText.click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('table').first()).toBeVisible({
      timeout: 30000,
    });
  }

  async getContactRecords(source: 'cms' | 'public') {
    const rows = this.page.locator('table').first().locator('tbody tr');
    const records: Array<{
      name: string;
      designation: string;
      phone: string;
    }> = [];

    await expect(rows.first()).toBeVisible({ timeout: 30000 });

    for (let index = 0; index < await rows.count(); index++) {
      const cells = await rows.nth(index).locator('td').allTextContents();
      const normalizedCells = cells.map((cell) => cell.replace(/\s+/g, ' ').trim());

      if (source === 'cms') {
        if (normalizedCells.includes('APPROVED')) {
          records.push({
            name: normalizedCells[1],
            designation: normalizedCells[2],
            phone: normalizedCells[5],
          });
        } else if (normalizedCells.length >= 3) {
          records.push({
            name: normalizedCells[0],
            designation: normalizedCells[1],
            phone: normalizedCells[2],
          });
        }

        continue;
      }

      records.push({
        name: normalizedCells[0],
        designation: normalizedCells[1],
        phone: normalizedCells[2],
      });
    }

    return records;
  }

  async openContactUs() {
    await this.contactUsLink.click();
  }
}
