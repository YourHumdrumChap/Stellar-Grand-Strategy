"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const url = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;
  await page.goto(url, { waitUntil: "load", timeout: 20000 });
  await page.waitForSelector("#galaxyCanvas", { timeout: 10000 });
  await page.waitForTimeout(350);

  const result = await page.evaluate(() => {
    const canvas = document.getElementById("galaxyCanvas");
    const context = canvas.getContext("2d");
    const before = document.getElementById("dateLabel").textContent;

    const target = state.systems.find((system) => system.known && !system.surveyedBy.player);
    if (target) {
      state.selectedSystemId = target.id;
      updateUI();
      commandSurvey(target.id);
    }

    for (let i = 0; i < 18; i += 1) {
      tickMonth();
      if (state.modal) resolveDecision(0);
    }

    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 0; i < data.length; i += 97 * 4) {
      if (data[i] + data[i + 1] + data[i + 2] > 36) lit += 1;
    }

    return {
      before,
      after: document.getElementById("dateLabel").textContent,
      resources: document.querySelectorAll(".resource-pill").length,
      actions: document.querySelectorAll("[data-action]").length,
      systems: state.systems.length,
      fleets: state.fleets.length,
      logs: state.logs.length,
      lit,
      selected: document.getElementById("selectedTag").textContent,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  });

  await page.screenshot({
    path: path.resolve(__dirname, "..", `smoke-${viewport.width}x${viewport.height}.png`),
    fullPage: true,
  });
  await page.close();

  if (errors.length) throw new Error(errors.join("\n"));
  if (result.before === result.after) throw new Error("Simulation date did not advance.");
  if (result.resources < 6) throw new Error("Resource bar did not render.");
  if (result.systems < 80 || result.fleets < 5) throw new Error("Galaxy generation is incomplete.");
  if (result.lit < 120) throw new Error("Canvas appears blank.");
  return result;
}

(async () => {
  const browser = await launchBrowser();
  try {
    const desktop = await runViewport(browser, { width: 1440, height: 900 });
    const mobile = await runViewport(browser, { width: 390, height: 780 });
    console.log(JSON.stringify({ desktop, mobile }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
