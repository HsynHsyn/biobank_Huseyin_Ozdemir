const { expect } = require("@playwright/test");
const { BrowserUtility } = require("../utilities/BrowserUtility.js");

class GridPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.gridRootContainer = page
      .locator("div")
      .filter({ hasText: ".logomark .aqua { fill: #" })
      .nth(2);

    this.rows = page.locator(".ag-center-cols-container .ag-row");

    this.rowCount = page.getByText("Rows :");

    
  }

  async goToBasePage() {
    console.log("Navigating to base page...");
    await this.page.goto(process.env.BASEURL);
    BrowserUtility.verify_title(this.page, "Demo - Performance Grid");
    await this.page.waitForTimeout(700);
  }
}

module.exports = GridPage;
