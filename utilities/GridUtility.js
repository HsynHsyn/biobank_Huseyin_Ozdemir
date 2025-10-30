

const { expect } = require("@playwright/test");
const { BrowserUtility } = require("./BrowserUtility.js");

class GridUtility {
  /**
   * Wait for the grid to load: root present, header present, and at least one row.
   * @param {import('playwright').Page} page
   * @param {number} timeout
   */
  static async waitForGridLoad(page, timeout = 15000) {
    await page.waitForSelector(".ag-root", { timeout });
    await page.waitForSelector(".ag-header", { timeout });
    // wait until there is at least one rendered row
    await page.waitForFunction(
      () => {
        const rows = document.querySelectorAll(
          ".ag-center-cols-container .ag-row"
        );
        return rows && rows.length > 0;
      },
      { timeout }
    );
    // small stabilization pause
    await page.waitForTimeout(150);
  }

  /**
   * Return an array of header texts (simple and clear).
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  static async getHeaderLabels(page) {
    const headerCells = page.locator(".ag-header .ag-header-cell");
    const count = await headerCells.count();
    const labels = [];
    for (let i = 0; i < count; i++) {
      const text = (await headerCells.nth(i).innerText()).trim();
      labels.push(text);
    }
    return labels;
  }

  /**
   * Find column index by a case-insensitive partial match on the header label.
   * Throws a clear error if not found.
   * @param {import('playwright').Page} page
   * @param {string} namePart
   * @returns {Promise<number>}
   */
  static async getColumnIndexByName(page, namePart) {
    const labels = await this.getHeaderLabels(page);
    const lower = labels.map((l) => (l || "").toLowerCase());
    const idx = lower.findIndex((t) => t.includes(namePart.toLowerCase()));
    if (idx === -1) {
      throw new Error(
        `Column with name containing "${namePart}" not found. Found: ${labels.join(
          ", "
        )}`
      );
    }
    return idx;
  }

  /**
   * Click a header cell by column name (uses index lookup).
   * @param {import('playwright').Page} page
   * @param {string} columnName
   */
  static async clickHeaderByName(page, columnName) {
    const idx = await this.getColumnIndexByName(page, columnName);
    const headerCell = page.locator(".ag-header .ag-header-cell").nth(idx);
    await headerCell.scrollIntoViewIfNeeded();
    await headerCell.click();
    await page.waitForTimeout(200);
  }

  /**
   * Get visible values for a given column index (reads only currently rendered rows).
   * @param {import('playwright').Page} page
   * @param {number} columnIndex
   * @param {number} limit
   * @returns {Promise<string[]>}
   */
  static async getVisibleColumnValues(page, columnIndex, limit = 50) {
    const rows = page.locator(".ag-center-cols-container .ag-row");
    const count = Math.min(limit, await rows.count());
    const values = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator(".ag-cell").nth(columnIndex);
      const txt = (await cell.innerText()).trim();
      values.push(txt);
    }
    return values;
  }

  /**
   * Find the floating filter input for a column (returns Locator or null).
   * @param {import('playwright').Page} page
   * @param {string} columnName
   * @returns {Promise<import('playwright').Locator|null>}
   */
  static async findFloatingFilterInput(page, columnName) {
    const idx = await this.getColumnIndexByName(page, columnName);
    const headerCell = page.locator(".ag-header .ag-header-cell").nth(idx);
    const input = headerCell.locator("input").first();
    if ((await input.count()) === 0) return null;
    return input;
  }

  /**
   * Open the Columns side panel (simple, best-effort).
   * @param {import('playwright').Page} page
   */
  static async openColumnsPanel(page) {
    const tab = page.locator('button[aria-label="Columns"], text=Columns');
    if ((await tab.count()) > 0) {
      await tab.first().click();
      await page.waitForTimeout(200);
      return;
    }
    // fallback: try a known side button
    const sideButton = page.locator(".ag-side-button").first();
    if ((await sideButton.count()) > 0) {
      await sideButton.click();
      await page.waitForTimeout(200);
    }
  }

  /**
   * Toggle column visibility via the side panel checkbox.
   * Uses BrowserUtility.check/uncheck for clarity.
   * @param {import('playwright').Page} page
   * @param {string} columnName
   * @param {boolean} shouldBeChecked
   */
  static async toggleColumnVisibility(page, columnName, shouldBeChecked) {
    const panel = page.locator(".ag-side-bar, .ag-tool-panel");
    await expect(panel).toBeVisible();
    const label = panel.locator(`text=${columnName}`).first();
    await expect(label).toBeVisible();
    // assume checkbox is sibling in parent node
    const checkbox = label
      .locator("xpath=..")
      .locator('input[type="checkbox"]')
      .first();
    if ((await checkbox.count()) === 0) {
      throw new Error(
        `Checkbox for column "${columnName}" not found in Columns panel`
      );
    }
    if (shouldBeChecked) {
      await BrowserUtility.check(checkbox);
    } else {
      await BrowserUtility.uncheck(checkbox);
    }
    await page.waitForTimeout(200);
  }

  /**
   * Select the first visible row (checkbox or row click).
   * @param {import('playwright').Page} page
   */
  static async selectFirstRow(page) {
    const firstRow = page.locator(".ag-center-cols-container .ag-row").first();
    const checkbox = firstRow.locator('input[type="checkbox"]').first();
    if ((await checkbox.count()) > 0) {
      await checkbox.click();
    } else {
      await firstRow.click();
    }
    await page.waitForTimeout(150);
  }

  /**
   * Check if first row has selection state (simple class check).
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  static async isFirstRowSelected(page) {
    const firstRow = page.locator(".ag-center-cols-container .ag-row").first();
    const classAttr = await firstRow.getAttribute("class");
    return /ag-row-selected/.test(classAttr || "");
  }

  /**
   * Get the checked state of the "Bought" checkbox in a row.
   * Returns null if checkbox element is not found.
   * @param {import('playwright').Page} page
   * @param {number} rowIndex
   * @returns {Promise<boolean|null>}
   */
  static async getBoughtCheckboxStateForRow(page, rowIndex = 0) {
    const rows = page.locator(".ag-center-cols-container .ag-row");
    const row = rows.nth(rowIndex);
    const idx = await this.getColumnIndexByName(page, "Bought");
    const cell = row.locator(".ag-cell").nth(idx);
    const checkbox = cell.locator('input[type="checkbox"]').first();
    if ((await checkbox.count()) === 0) return null;
    return await checkbox.isChecked();
  }

  /**
   * Toggle the "Bought" checkbox for a row. Best-effort.
   * @param {import('playwright').Page} page
   * @param {number} rowIndex
   */
  static async toggleBoughtInRow(page, rowIndex = 0) {
    const rows = page.locator(".ag-center-cols-container .ag-row");
    const row = rows.nth(rowIndex);
    const idx = await this.getColumnIndexByName(page, "Bought");
    const cell = row.locator(".ag-cell").nth(idx);
    const checkbox = cell.locator('input[type="checkbox"]').first();
    if ((await checkbox.count()) === 0) {
      await cell.click();
    } else {
      await checkbox.click();
    }
    await page.waitForTimeout(150);
  }
}

module.exports = { GridUtility };
