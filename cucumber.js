module.exports = {
  default: {
    paths: ["test/features/**/*.feature"],
    require: ["test/steps/**/*.js", "hooks/**/*.js"],
    format: [
      "allure-cucumberjs/reporter",
      "@cucumber/pretty-formatter",
      "summary",
    ],
  },
};
