const { BasePage } = require("./pages/BasePage.js");

// Store the page and basePage instances internally
let _page = null;
let _basePage = null;

/**
 * Initializes the global page elements and instances for the automation framework.
 *
 * @param {import('playwright').Page} argPage - The Playwright Page instance to be used for interacting with the web pages.
 * @returns {void} This function does not return any value.
 */
const initElements = (argPage) => {
  _page = argPage; // ensures that the same object is used throughout the test
  _basePage = new BasePage(_page);
};

// Export getters so consumers always read the latest value at runtime
Object.defineProperty(exports, "page", {
  get: function () {
    return _page;
  },
  enumerable: true,
});

Object.defineProperty(exports, "basePage", {
  get: function () {
    return _basePage;
  },
  enumerable: true,
});

exports.initElements = initElements;
