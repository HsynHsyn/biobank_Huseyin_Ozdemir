const { expect } = require("@playwright/test");
const { BrowserUtility } = require("../utilities/BrowserUtility.js");

class BasePage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;

    this.moreLink = page.locator("a.morelink");
    this.performanceHeading = page.getByRole('heading', { name: 'Performance' });
  }

  async goToBasePage() {
    console.log("Navigating to base page...");

    await this.page.goto(process.env.BASEURL);

    BrowserUtility.verify_title(this.page, "Demo - Performance Grid");

    await this.page.waitForTimeout(700);
  }
}

module.exports = { BasePage };
