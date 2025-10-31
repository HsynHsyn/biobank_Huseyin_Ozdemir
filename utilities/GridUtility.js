const { expect } = require("@playwright/test");
const { BrowserUtility } = require("./BrowserUtility.js");

class GridUtility {
  /**
   * Returns the Playwright page object from a Cucumber World or global context.
   * @param {object} world - Cucumber World or step context (this)
   * @returns {import('playwright').Page}
   */
  static getPageFromWorld(world) {
    const gridPage = world.gridPage || world.page;
    if (!gridPage) throw new Error("Playwright page not available on World.");
    return gridPage.page || gridPage;
  }
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



  // parseValue: returns a number if the value can be parsed as a number (commas removed),
  // otherwise returns a lowercased string.
  static async parseValue(v) {
    const raw = String(v ?? "").trim();
    const n = Number(raw.replace(/,/g, ""));
    return Number.isNaN(n) ? raw.toLowerCase() : n;
  }

  // compareValues: compares two tokens. If both are numbers, compares numerically (a - b).
  // Otherwise compares as strings using localeCompare (lexicographic).
  static async compareValues(a, b) {
    return typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b));
  }

  /**
   * Verify that provided allData is sorted in ascending order by field.
   */
  static sortDataAscending(allData, field) {
    if (!allData || allData.length === 0) throw new Error("No data to sort.");

    const tokens = allData.map((it, i) => {
      if (!(field in it)) throw new Error(`Missing ${field} @${i}`);
      return this.parseValue(it[field]);
    });

    for (let i = 1; i < tokens.length; i++) {
      const cmp = this.compareValues(tokens[i - 1], tokens[i]);
      expect(cmp).toBeLessThanOrEqual(
        0,
        `Expected ascending order but found prev="${String(
          tokens[i - 1]
        )}", curr="${String(tokens[i])}" at index ${i - 1}`
      );
    }

    return true;
  }

  /**
   * Verify that provided allData is sorted in descending order by field.
   */
  static sortDataDescending(allData, field) {
    if (!allData || allData.length === 0) throw new Error("No data to sort.");

    const tokens = allData.map((it, i) => {
      if (!(field in it)) throw new Error(`Missing ${field} @${i}`);
      return this.parseValue(it[field]);
    });

    for (let i = 1; i < tokens.length; i++) {
      const cmp = this.compareValues(tokens[i - 1], tokens[i]);
      expect(cmp).toBeGreaterThanOrEqual(
        0,
        `Expected descending order but found prev="${String(
          tokens[i - 1]
        )}", curr="${String(tokens[i])}" at index ${i - 1}`
      );
    }

    return true;
  }

  /**
   * Get the numeric row count from the grid footer/status bar.
   * Minimal utility: waits for a footer element, reads its text and parses the first number.
   * Default selector targets common AG Grid demo class '.ag-status-name-value-value'
   * Returns number or null if parsing failed.
   *
   * @param {import('playwright').Page} page
   * @param {string} selector
   * @param {number} timeout
   * @returns {Promise<number|null>}
   */
  static async getFooterCount(
    page,
    selector = ".ag-status-name-value-value",
    timeout = 3000
  ) {
    const loc = page.locator(selector).first();
    await loc.waitFor({ state: "visible", timeout });
    const txt = (await loc.innerText()).trim();
    const m = txt.match(/(\d[\d,\.]*)/);
    if (!m) return null;
    const raw = m[1].replace(/[,.]/g, "");
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  }

  static async getColumnHeaderLocator(page, namePart) {
    // use a case-insensitive regex so partial matches work regardless of case
    const headerCell = page
      .locator(".ag-header .ag-header-cell", {
        hasText: new RegExp(namePart, "i"),
      })
      .first();
    if ((await headerCell.count()) === 0) {
      // fallback: gather labels for a helpful error message
      const labels = await this.getHeaderLabels(page);
      throw new Error(
        `Column with name containing "${namePart}" not found. Found: ${labels.join(
          ", "
        )}`
      );
    }
    return headerCell;
  }

  /**
   * Get column index by name (zero-based).
   * @param {import('playwright').Page} page
   * @param {string} columnName
   * @returns {Promise<number>}
   */
  static async getColumnIndexByName(page, columnName) {
    const headers = await page.locator(".ag-header .ag-header-cell").all();
    for (let i = 0; i < headers.length; i++) {
      const text = await headers[i].innerText();
      if (text.toLowerCase().includes(columnName.toLowerCase())) {
        return i;
      }
    }
    throw new Error(`Column "${columnName}" not found`);
  }

  /**
   * Get all header labels for debugging.
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  static async getHeaderLabels(page) {
    const headers = await page.locator(".ag-header .ag-header-cell").all();
    const labels = [];
    for (const header of headers) {
      const text = await header.innerText();
      labels.push(text.trim());
    }
    return labels;
  }

  /**
   * Click a header cell by column name (finds header by its visible text, not by index).
   * @param {import('playwright').Page} page
   * @param {string} columnName
   */
  static async clickHeaderByName(page, columnName) {
    console.log(`Clicking header cell for column "${columnName}" (text-match)`);
    const headerCell = await this.getColumnHeaderLocator(page, columnName);

    // ensure it's visible and interactable, then click
    await headerCell.scrollIntoViewIfNeeded();
    await expect(headerCell).toBeVisible();
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
