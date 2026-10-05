import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { loginToCms as loginToConfiguredCms } from '../utils/cmsLogin';

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

    this.contactUsLink = page
      .locator('nav')
      .getByRole('link', {
        name: 'Contact Us',
        exact: true,
      });

    this.contactDetailsHeading = page.getByText(
      'GCTP CONTACT DETAILS',
    );

    this.serialNumberHeader = page.getByRole('columnheader', {
      name: 'S.No.',
    });

    this.officerNameHeader = page.getByRole('columnheader', {
      name: 'Officer Name',
    });

    this.rankHeader = page.getByRole('columnheader', {
      name: 'Designation',
    });

    this.officePhoneNumbersHeader = page.getByRole('columnheader', {
      name: 'Office Phone Numbers',
    });

    this.officerCells = [
      page.getByRole('cell', { name: 'Dr. A. AMALRAJ, I.P.S' }),
      page.getByRole('cell', {
        name: 'Commissioner Of Police',
        exact: true,
      }),
      page.getByRole('cell', { name: '044-23452320' }),
      page.getByRole('cell', { name: 'TR.P. BALAJI' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (North)' }),
      page.getByRole('cell', { name: '044-2345270' }),
      page.getByRole('cell', {
        name: 'TR.K.K. FEROZE KHAN ABDULLAH, I.P.S',
      }),
      page.getByRole('cell', { name: 'DCoP - Traffic (West)' }),
      page.getByRole('cell', { name: '9498133663' }),
      page.getByRole('cell', { name: 'TMT. MEGALINA IDEN' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (East)' }),
      page.getByRole('cell', { name: '044-2345434' }),
      page.getByRole('cell', { name: 'TR. P. PAKALAVAN, I.P.S' }),
      page.getByRole('cell', {
        name: 'Joint Commissioner Of Police - Traffic (South)',
      }),
      page.getByRole('cell', { name: '044-2345266' }),
      page.getByRole('cell', { name: 'TR. MUTHUKUMAR' }),
      page.getByRole('cell', { name: 'DCoP - Traffic (South)' }),
      page.getByRole('cell', { name: '044-2345264' }),
      page.getByRole('cell', { name: 'VACANT' }),
      page.getByRole('cell', {
        name: 'Joint Commissioner Of Police - Traffic (North)',
      }),
      page.getByRole('cell', { name: '044-2345262' }),
      page.getByRole('cell', {
        name: 'DR. B. SHAMOONDESWARI, I.P.S',
      }),
      page.getByRole('cell', {
        name: 'Additional Commissioner Of Police Traffic',
      }),
      page.getByRole('cell', { name: '044-25615081' }),
    ];
  }

  async openHomePage(): Promise<void> {
    await this.navigate('https://gctp.in/chennai-home');
  }

  async loginToCms(
    cmsUrl: string,
    username: string,
    password: string,
  ): Promise<void> {
    await loginToConfiguredCms(this.page, cmsUrl, username, password);
  }

  async openCmsContactUs(): Promise<void> {
    await this.closeContactUsPopup();

    const cmsContactUsLink = this.page
      .locator('nav')
      .getByText('Contact Us', {
        exact: true,
      });

    await expect(cmsContactUsLink).toBeVisible({
      timeout: 30000,
    });

    await cmsContactUsLink.click();

    await this.page.waitForLoadState('domcontentloaded');

    await this.closeContactUsPopup();

    await expect(
      this.page.locator('table').first(),
    ).toBeVisible({
      timeout: 30000,
    });
  }

  async getContactRecords(
    source: 'cms' | 'public',
  ): Promise<
    Array<{
      name: string;
      designation: string;
      phone: string;
    }>
  > {
    const rows = this.page
      .locator('table')
      .first()
      .locator('tbody tr');

    const records: Array<{
      name: string;
      designation: string;
      phone: string;
    }> = [];

    await expect(rows.first()).toBeVisible({
      timeout: 30000,
    });

    const rowCount = await rows.count();

    for (let index = 0; index < rowCount; index++) {
      const cells = await rows
        .nth(index)
        .locator('td')
        .allTextContents();

      const normalizedCells = cells.map((cell) =>
        cell.replace(/\s+/g, ' ').trim(),
      );

      if (source === 'cms') {
        if (normalizedCells.includes('APPROVED')) {
          if (normalizedCells.length >= 6) {
            records.push({
              name: normalizedCells[1],
              designation: normalizedCells[2],
              phone: normalizedCells[5],
            });
          }
        } else if (normalizedCells.length >= 3) {
          records.push({
            name: normalizedCells[0],
            designation: normalizedCells[1],
            phone: normalizedCells[2],
          });
        }

        continue;
      }

      if (normalizedCells.length >= 3) {
        records.push({
          name: normalizedCells[0],
          designation: normalizedCells[1],
          phone: normalizedCells[2],
        });
      }
    }

    return records;
  }

  async closeContactUsPopup(): Promise<void> {
    const popup = this.page
      .locator('.flash-popup-overlay')
      .first();

    const popupVisible = await popup
      .waitFor({
        state: 'visible',
        timeout: 5000,
      })
      .then(() => true)
      .catch(() => false);

    if (!popupVisible) {
      return;
    }

    const closeButton = popup
      .locator('.flash-close-btn')
      .first();

    await expect(
      closeButton,
      'The popup close button should be visible',
    ).toBeVisible({
      timeout: 10000,
    });

    await closeButton.click({
      timeout: 10000,
    });

    await expect(popup).toBeHidden({
      timeout: 10000,
    });
  }

  async openContactUs(): Promise<void> {
    await this.closeContactUsPopup();

    await expect(this.contactUsLink).toBeVisible({
      timeout: 30000,
    });

    await this.contactUsLink.click();

    await expect(
      this.page.locator('table').first(),
    ).toBeVisible({
      timeout: 30000,
    });
  }
}