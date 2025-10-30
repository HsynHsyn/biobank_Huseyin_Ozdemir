module.exports = {
  default: {
    paths: ["test/features/**/*.feature"],
    require: ["test/steps/**/*.js", "hooks/**/*.js"],
    format: [
      "@cucumber/pretty-formatter", // For console output
      "allure-cucumberjs/reporter", // For Allure reporting
    ],
    formatOptions: {
      resultsDir: "allure-results", // Path where Allure results will be saved
    },

  },
};