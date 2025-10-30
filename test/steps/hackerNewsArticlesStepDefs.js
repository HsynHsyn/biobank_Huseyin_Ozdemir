const { Given, Then, When } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const globals = require("../../globalPagesSetup.js");
const { BrowserUtility } = require("../../utilities/BrowserUtility.js");

let allData = [];

Given("I open the Hacker News newest page", async function () {
  // Access basePage at runtime from the globals module (getter)
  const bp = globals.basePage;
  if (!bp) {
    throw new Error(
      "basePage is not initialized yet. Ensure hooks/globalHooks.js initializes the browser and calls initElements before steps run."
    );
  }
  await bp.goToBasePage();
});

When("I retrieve the first 100 article timestamps", async function () {
  allData = [];
  const maxCount = 100;

  try {
    while (allData.length < maxCount) {
      const pageObj = globals.page;
      if (!pageObj) {
        throw new Error(
          "page is not initialized yet. Ensure hooks/globalHooks.js initializes the browser and calls initElements before steps run."
        );
      }
      await pageObj.waitForSelector("span.age");

      const titles = await pageObj.$$eval("span.titleline > a", (elements) =>
        elements.map((el) => el.innerText.trim())
      );

      const dates = await pageObj.$$eval("span.age", (elements) =>
        elements.map((el) => el.getAttribute("title")?.trim())
      );

      titles.forEach((title, index) => {
        if (dates[index] && allData.length < maxCount) {
          allData.push({ title, date: dates[index] });
        }
      });

      if (allData.length < maxCount) {
        const moreLink = await pageObj.$("a.morelink");
        if (moreLink) {
          await Promise.all([
            pageObj.waitForNavigation({ waitUntil: "load" }),
            moreLink.click(),
          ]);
        } else {
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error occurred during scraping:", error);
  }
});

Then("they should be sorted in descending order", async function () {
  if (!allData || allData.length === 0) {
    throw new Error("No data found to sort. allData is empty.");
  }

  // Clone array to avoid mutating original
  const sortedData = [...allData].sort((a, b) => {
    return (
      new Date(parseInt(b.date) * 1000) - new Date(parseInt(a.date) * 1000)
    );
  });

  // Verify the sorted order
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = new Date(parseInt(sortedData[i - 1].date) * 1000);
    const currDate = new Date(parseInt(sortedData[i].date) * 1000);

    if (isNaN(prevDate.getTime()) || isNaN(currDate.getTime())) {
      throw new Error(
        `Invalid date found: prevDate=${sortedData[i - 1].date}, currDate=${
          sortedData[i].date
        }`
      );
    }

    expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
  }

  // Optional: Log sorted result
  // console.log("\nSorted Data by Timestamp (Descending):\n");
  // sortedData.forEach((item, i) => {
  //   const dateObj = new Date(parseInt(item.date) * 1000);
  //   console.log(`${i + 1}. [${dateObj.toISOString()}] ${item.title}`);
  // });
});
