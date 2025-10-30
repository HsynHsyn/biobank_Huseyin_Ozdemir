const dotenv = require("dotenv");

const getEnv = () => {
  if (process.env.ENV) {
    dotenv.config({
      override: true,
      path: `env/.env.${process.env.ENV}`,
    });
  } else {
    console.error("NO ENV PASSED!");
  }
  return process.env.ENV;
};

module.exports = { getEnv };
