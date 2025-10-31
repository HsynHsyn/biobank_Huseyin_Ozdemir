const GridPage = require("./pages/GridPage.js");

// Store the page and gridPage instances internally
let _page = null;
let _gridPage = null;

/**
 * Initializes the global page elements and instances for the automation framework.
 *
 * @param {import('playwright').Page} argPage - The Playwright Page instance to be used for interacting with the web pages.
 * @returns {void} This function does not return any value.
 */
const initElements = (argPage) => {
  _page = argPage; // ensures that the same object is used throughout the test
  _gridPage = new GridPage(_page);
};

// Export getters so consumers always read the latest value at runtime
Object.defineProperty(exports, "page", {
  get: function () {
    return _page;
  },
  enumerable: true,
});

Object.defineProperty(exports, "gridPage", {
  get: function () {
    return _gridPage;
  },
  enumerable: true,
});

exports.initElements = initElements;
