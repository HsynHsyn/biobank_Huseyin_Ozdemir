// Page Object for AG Grid demo (Playwright + Cucumber friendly)
class GridPage {
  constructor(page) {
    this.page = page;
    this.consoleErrors = [];
    // capture console errors so tests can fail early if JS errors occur
    this.page.on("console", (msg) => {
      if (msg.type && msg.type() === "error") {
        this.consoleErrors.push(msg.text());
      }
    });
  }

  async goto() {
    await this.page.goto("https://www.ag-grid.com/example/");
  }

  // Waits for the grid to be present and perform smoke checks
  // Throws if console errors were captured or checks fail
  async waitForGridLoad(timeout = 15000) {
    // 1) Grid root present
    await this.page.waitForSelector(".ag-root", { timeout });

    // 2) Header visible
    await this.page.waitForSelector(".ag-header", { timeout });

    // 3) At least one data row rendered
    await this.page.waitForFunction(
      () => {
        const rows = document.querySelectorAll(
          ".ag-center-cols-container .ag-row"
        );
        return rows && rows.length > 0;
      },
      { timeout }
    );

    // 4) Optional: footer with row summary visible (if the demo has it)
    // If demo doesn't have, this selector will not block because it's optional; wrap in try/catch
    try {
      await this.page.waitForSelector("text=Rows:", { timeout: 2000 });
    } catch (e) {
      // footer not critical, ignore if not found quickly
    }

    // 5) Fail early if console errors captured
    if (this.consoleErrors.length > 0) {
      throw new Error(
        `Console errors detected while loading grid:\n${this.consoleErrors.join(
          "\n"
        )}`
      );
    }

    // 6) Optionally, small wait for stability (avoid race conditions)
    await this.page.waitForTimeout(150);
  }
}

module.exports = GridPage;
