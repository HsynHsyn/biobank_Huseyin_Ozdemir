const { When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { GridUtility } = require("../../utilities/GridUtility");

When(
  "user sees the Columns side panel and sees the {string} column toggle control",
  async function (columnName) {
    const page = this.page;
    // Open panel (best-effort)
    await GridUtility.openColumnsPanel(page);

    const panel = page.locator(".ag-side-bar, .ag-tool-panel");
    await expect(panel).toBeVisible();

    const label = panel.locator(`text=${columnName}`).first();
    await expect(label).toBeVisible();
  }
);

When(
  "user unchecks the {string} column toggle in the panel",
  async function (columnName) {
    const page = this.page;
    // Ensure panel is open and toggle the checkbox off
    await GridUtility.openColumnsPanel(page);
    await GridUtility.toggleColumnVisibility(page, columnName, false);
  }
);

Then(
  "user sees the {string} header is not present in the grid",
  async function (columnName) {
    const page = this.page;
    const labels = await GridUtility.getHeaderLabels(page);
    const found = labels.some((l) =>
      (l || "").toLowerCase().includes(columnName.toLowerCase())
    );
    if (found) {
      throw new Error(
        `Expected column "${columnName}" to be hidden but it is still present. Found headers: ${labels.join(
          ", "
        )}`
      );
    }
  }
);

When(
  "user checks the {string} column toggle in the panel again",
  async function (columnName) {
    const page = this.page;
    // Ensure panel is open and toggle the checkbox on
    await GridUtility.openColumnsPanel(page);
    await GridUtility.toggleColumnVisibility(page, columnName, true);
  }
);

Then(
  "user sees the {string} header is visible again in the grid",
  async function (columnName) {
    const page = this.page;
    const labels = await GridUtility.getHeaderLabels(page);
    const found = labels.some((l) =>
      (l || "").toLowerCase().includes(columnName.toLowerCase())
    );
    if (!found) {
      throw new Error(
        `Expected column "${columnName}" to be visible but it is not present. Found headers: ${labels.join(
          ", "
        )}`
      );
    }
  }
);
