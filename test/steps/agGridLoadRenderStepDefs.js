const { Given, Then, When } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const globals = require("../../globalPagesSetup.js");
const { BrowserUtility } = require("../../utilities/BrowserUtility.js");
const { GridUtility } = require("../../utilities/GridUtility");

Given("user opens the AG Grid {string} demo page", async function (demoType) {
  const gridPage = globals.gridPage || this.gridPage;
  if (!gridPage) {
    throw new Error(
      "gridPage is not initialized. Ensure hooks/hooks.js initializes the browser and calls initElements before steps run."
    );
  }
  // Navigate to the AG Grid demo page
  await gridPage.goToBasePage();
});

When("user sees the AG Grid root container", async function () {
  const gridPage = globals.gridPage || this.gridPage;
  GridUtility.waitForGridLoad(gridPage.page);
  expect(gridPage.gridRootContainer.isVisible()).toBeTruthy();
});

Then("user sees at least one data row rendered in the grid", async function () {
  const gridPage = globals.gridPage || this.gridPage;
  await expect(gridPage.rows.first()).toBeVisible();
});

Then("user sees a footer showing row summary containing {string}",
  async function (expectedText) {
    const gridPage = globals.gridPage || this.gridPage;
    const page = (gridPage && gridPage.page) || this.page;
    if (!page) throw new Error("No Playwright page available in step context");

    this.rowCount = page.getByText("Rows :");

    await expect(this.rowCount).toBeVisible();

    const footerText = (await this.rowCount.innerText()).trim();
    const normalize = (s) =>
      (s || "")
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[:]/g, "");
    if (!normalize(footerText).includes(normalize(expectedText))) {
      throw new Error(
        `Footer text does not contain "${expectedText}". Found: "${footerText}"`
      );
    }

    // Parse the number (also strips thousand separators like "1,000" or "1.000")
    const m = footerText.match(/(\d[\d,\.]*)/);
    const footerNumber = m ? parseInt(m[1].replace(/[,.]/g, ""), 10) : null;

    this.footerRowCount = footerNumber;
    console.log(
      `Footer locator text: "${footerText}" -> parsed count: ${footerNumber}`
    );

    if (footerNumber === null) {
      throw new Error(
        `Could not parse a numeric row count from footer text: "${footerText}"`
      );
    }
  }
);

Then("user sees the following column headers:", async function (dataTable) {
  const gridPage = globals.gridPage || this.gridPage;
  const page = (gridPage && gridPage.page) || this.page;
  if (!page)
    throw new Error(
      "No Playwright page available in step context (expected gridPage.page or this.page)"
    );

  const expected = dataTable
    .raw()
    .map((row) => (row[0] || "").trim())
    .filter(Boolean);
  if (expected.length === 0)
    throw new Error("No headers provided in the DataTable");

  // Scope searches to the header area to avoid duplicate matches elsewhere on the page
  const headerScope = page.locator(".ag-header");

  for (const headerText of expected) {
    // Use exact match inside the header scope so "Name" does not match "Game Name"
    const loc = headerScope.getByText(headerText, { exact: true });
    await expect(loc).toBeVisible();
    console.log(`Header visible: "${headerText}"`);
  }
});

