import { expect, Page } from "@playwright/test";

export class CmsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("https://gctp.in/chennai-home");
  }

  async verifyImportantLinks() {
    const links = [
      {
        name: "Ombudsman",
        url: "https://www.cioins.co.in/",
      },
      {
        name: "TNRTO",
        url: "https://tnsta.gov.in/",
      },
      {
        name: "Tamilnadu Police Citizen Portal",
        url: "https://www.police.tn.gov.in/citizenportal",
      },
      {
        name: "TN Govt Web",
        url: "https://www.tn.gov.in/",
      },
      {
        name: "Parivahan",
        url: "https://parivahan.gov.in/",
      },
    ];

    for (const link of links) {
      const locator = this.page.getByRole("link", {
        name: link.name,
      });

      await expect(locator).toBeVisible();

      const [popup] = await Promise.all([
        this.page.waitForEvent("popup"),
        locator.click(),
      ]);

      await popup.waitForLoadState();

      await expect(popup).toHaveURL(link.url);

      await popup.close();
    }
  }

  async verifyHelpline() {
    await expect(
      this.page.getByText("Helpline", { exact: true })
    ).toBeVisible();

    await expect(
      this.page.getByText("COP SMS - 9500099100")
    ).toBeVisible();

    await expect(
      this.page.getByText("Bandham - 94499957575")
    ).toBeVisible();

    await expect(
      this.page.getByText("Women Helpline - 1091")
    ).toBeVisible();

    await expect(
      this.page.getByText("Kaaval karangal - 9444717100")
    ).toBeVisible();

    await expect(
      this.page.getByText("Senior Citizen - 1253")
    ).toBeVisible();
  }

  async verifyTrafficUpdates() {
    await expect(
      this.page.getByText("Traffic Updates")
    ).toBeVisible();

    await expect(
      this.page.getByText("Wear Helmet")
    ).toBeVisible();

    await expect(
      this.page.getByText(
        "Wearing a helmet is mandatory in Chennai"
      )
    ).toBeVisible();

    await this.page
      .getByText("Safer Pedestrian Walk", {
        exact: true,
      })
      .click();

    await this.page.locator("b").getByText("Read More").click();

    await expect(
      this.page.getByText(
        "To ensure safer pedestrian walks in Chennai, it's crucial to prioritize visibility, awareness, and designated safe crossing areas"
      )
    ).toBeVisible();
  }

  async verifyEmpanelment() {
    await this.page
      .getByRole("button", {
        name: "Read More",
      })
      .nth(1)
      .click();

    await expect(
      this.page.getByText(
        "Smart Traffic Management & Technology in Chennai"
      )
    ).toBeVisible();

    await this.page
      .getByRole("button", {
        name: "Go back",
      })
      .dblclick();

    await this.page
      .getByRole("button", {
        name: "Read More",
      })
      .nth(2)
      .click();

    await expect(
      this.page.getByText(
        "GCTP – Ensuring Safe and Seamless Mobility"
      )
    ).toBeVisible();

    await this.page
      .getByRole("button", {
        name: "Go back",
      })
      .dblclick();

    await this.page
      .getByRole("button", {
        name: "Read More",
      })
      .nth(3)
      .click();

    await expect(
      this.page.getByText("Road Safety Awareness")
    ).toBeVisible();

    await this.page
      .getByRole("button", {
        name: "Go back",
      })
      .dblclick();
  }

  async verifyHomePageSliders() {
    await this.page
      .getByRole("button", {
        name: "Read More",
      })
      .first()
      .click();

    await expect(
      this.page.getByRole("heading", {
        name: "Zero Accident Day campaign",
      })
    ).toBeVisible();

    await this.page
      .getByRole("button", {
        name: "Go back",
      })
      .dblclick();
  }

  async verifyFAQ() {
    await this.page
      .getByRole("link", {
        name: "FAQ'S",
      })
      .click();

    await this.page
      .getByText(
        "How can I find information about public transportation options?"
      )
      .click();

    await expect(
      this.page.getByText(
        "As per Section 166 of The Motor Vehicle Act, 1988"
      )
    ).toBeVisible();
  }

  async verifyFooterLinks() {
    await this.page
      .getByRole("link", {
        name: "Site Map",
      })
      .click();

    await expect(this.page).toHaveURL(
      "https://gctp.in/chennai-sitemap"
    );

    await this.page
      .getByRole("link", {
        name: "Complaints",
      })
      .click();

    await expect(this.page).toHaveURL(
      "https://gctp.in/chennai-complaints"
    );
  }
}