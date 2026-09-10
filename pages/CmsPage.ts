import { expect, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CmsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto("https://gctp.in/chennai-home");
    await this.closeAnyPopup();
  }

  async verifyImportantLinks() {
    const links = [
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
        name: new RegExp(link.name, "i"),
      }).first();

      await expect(locator).toBeVisible();
      await expect(locator).toHaveAttribute("href", new RegExp(link.url.replace(/\//g, "\\/") + "$"));

      const [popup] = await Promise.all([
        this.page.waitForEvent("popup").catch(() => null),
        locator.click({ force: true }).catch(() => locator.click())
      ]);

      if (popup) {
        await expect(popup).toBeTruthy();
        await popup.close();
      }
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
    await this.closeAnyPopup();

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
    await this.closeAnyPopup();

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
    await this.closeAnyPopup();

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
    const aiTrafficJunctionSlider = this.page
      .locator("section")
      .filter({ hasText: "AI enabled Traffic Junction" });

    await expect(aiTrafficJunctionSlider).toBeVisible();
    await aiTrafficJunctionSlider
      .getByRole("button", { name: "Read More" })
      .click();

    await expect(this.page).toHaveURL(
      "https://gctp.in/chennai-EMPANELMENT"
    );
    await this.closeAnyPopup();

    await expect(
      this.page.getByRole("heading", {
        name: "AI enabled Traffic Junction",
      })
    ).toBeVisible();

    await expect(
      this.page.getByText(
        "An AI-Enabled Traffic Junction uses advanced Artificial Intelligence, smart cameras, and real-time analytics to monitor traffic conditions and improve road safety. The system can detect vehicle density, traffic violations, and abnormal road incidents, providing valuable insights for effective traffic management. By continuously analyzing traffic patterns, it helps reduce congestion, supports quicker incident response, and enhances the overall commuting experience."
      )
    ).toBeVisible();

    const trafficJunctionImage = this.page.getByRole("img", {
      name: "AI enabled Traffic Junction",
    });

    await expect(trafficJunctionImage).toBeVisible();
    await expect(trafficJunctionImage).toHaveAttribute(
      "src",
      "https://gctp.in/api/fusion-cms-web-backend/uploads/images/1788519035502-839196315-Designer (24)_1.png"
    );

    await this.page
      .getByRole("button", {
        name: "Go back",
      })
      .dblclick();
    await this.closeAnyPopup();
  }

  async verifyFAQ() {
    await this.closeAnyPopup();

    await this.page
      .getByRole("link", {
        name: /FAQ/i,
      })
      .first()
      .click();

    await this.page
      .getByText(
        /How can I find information about public transportation options\?/i
      )
      .first()
      .click();

    await expect(
      this.page.getByText(
        /Use the Transport Department, Government of Tamil Nadu/i
      ).first()
    ).toBeVisible();
  }

  async verifyFooterLinks() {
    await this.closeAnyPopup();

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