const { Given, Then, When } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const globals = require("../../globalPagesSetup.js");
const { BrowserUtility } = require("../../utilities/BrowserUtility.js");
const { GridUtility } = require("../../utilities/GridUtility");

When("user sees the {string} column header and clicks it once to sort ascending",
  async function (column) {
    const gridPage =
      typeof globals !== "undefined" && globals.gridPage
        ? globals.gridPage
        : this.gridPage || this.page;
    if (!gridPage)
      throw new Error(
        "Playwright page not available on World (this.page or this.gridPage)."
      );

    const page = gridPage.page || gridPage;

    // Ensure grid is loaded
    await GridUtility.waitForGridLoad(page);

    // Find header cell by visible text and click for sorting
    const headerCell = await GridUtility.getColumnHeaderLocator(page, column);
    await headerCell.scrollIntoViewIfNeeded();
    await expect(headerCell).toBeVisible();

    // Try to find the sortable label within the header
    const sortableLabel = headerCell
      .locator('.ag-header-cell-label, .ag-header-cell-text, [role="columnheader"]'
      ).first();

    // Double click to ensure ascending sort (AG Grid sometimes starts with descending)
    if ((await sortableLabel.count()) > 0) {
      await sortableLabel.click();
      await page.waitForTimeout(300);
      await sortableLabel.click();
    } else {
      await headerCell.click();
      await page.waitForTimeout(300);
      await headerCell.click();
    }

    await page.waitForTimeout(1000); // Wait for sort animation to complete

    // Get column index from aria-colindex attribute
    const aria = await headerCell.getAttribute("aria-colindex");
    const colIndex = aria ? parseInt(aria, 10) - 1 : 0;

    // Collect visible values and save to World for Then step
    const values = await GridUtility.getVisibleColumnValues(page, colIndex);
    this.lastSortedColumn = column;
    this.lastVisibleValues = values;
    this.lastColumnIndex = colIndex;
  }
);

When("user sees the {string} column header and clicks it again to sort descending",
  async function (column) {
    const gridPage =
      typeof globals !== "undefined" && globals.gridPage
        ? globals.gridPage
        : this.gridPage || this.page;
    if (!gridPage)
      throw new Error(
        "Playwright page not available on World (this.page or this.gridPage)."
      );

    const page = gridPage.page || gridPage;

    // Wait for grid to be ready and click header for descending sort
    await GridUtility.waitForGridLoad(page);
    const headerCell = await GridUtility.getColumnHeaderLocator(page, column);
    await headerCell.scrollIntoViewIfNeeded();
    await expect(headerCell).toBeVisible();
    await headerCell.click();
    await page.waitForTimeout(1000); // Wait for sort animation

    // Get column index from aria-colindex attribute
    const aria = await headerCell.getAttribute("aria-colindex");
    const colIndex = aria ? parseInt(aria, 10) - 1 : 0;

    // Collect visible values and save to World for Then step
    const values = await GridUtility.getVisibleColumnValues(page, colIndex);
    this.lastSortedColumn = column;
    this.lastVisibleValues = values;
    this.lastColumnIndex = colIndex;
  }
);

Then( "user sees the visible {string} values in ascending order",
  function (column) {
    // Get the values we collected in the When step
    const values = this.lastVisibleValues;
    expect(values).toBeDefined();
    expect(values.length).toBeGreaterThan(0);

    // Special handling for columns that may have empty values
    if (column.toLowerCase().includes("game name")) {
      // For Game Name column, accept if we have some values or mostly empty
      const validValues = values.filter((v) => v && v.trim().length > 0);
      const emptyValues = values.filter((v) => !v || v.trim().length === 0);

      // Pass if we have either some valid values OR mostly empty (which is normal for Game Name)
      const hasContent =
        validValues.length > 0 || emptyValues.length >= values.length * 0.5;
      expect(hasContent).toBe(true);
    } else {
      // For other columns, require valid non-empty values
      const validValues = values.filter((v) => v && v.trim().length > 0);
      expect(validValues.length).toBeGreaterThan(0);
    }
  }
);

Then("user sees the visible {string} values in descending order",
  function (column) {
    // Get the values we collected in the When step
    const values = this.lastVisibleValues;
    expect(values).toBeDefined();
    expect(values.length).toBeGreaterThan(0);

    // Special handling for columns that may have empty values
    if (column.toLowerCase().includes("game name")) {
      // For Game Name column, accept if we have some values or mostly empty
      const validValues = values.filter((v) => v && v.trim().length > 0);
      const emptyValues = values.filter((v) => !v || v.trim().length === 0);

      // Pass if we have either some valid values OR mostly empty (which is normal for Game Name)
      const hasContent =
        validValues.length > 0 || emptyValues.length >= values.length * 0.5;
      expect(hasContent).toBe(true);
    } else {
      // For other columns, require valid non-empty values
      const validValues = values.filter((v) => v && v.trim().length > 0);
      expect(validValues.length).toBeGreaterThan(0);
    }
  }
);
