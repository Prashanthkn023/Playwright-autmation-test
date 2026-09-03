import { Locator, Page } from '@playwright/test';
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
    await this.navigate('https://gctp.in/');
  }

  async openContactUs() {
    await this.contactUsLink.click();
  }
}
