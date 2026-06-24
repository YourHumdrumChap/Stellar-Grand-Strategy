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
  const menuVisible = await page.locator("#mainMenu").isVisible();
  await page.selectOption("#menuShape", viewport.width < 500 ? "elliptical" : "rift");
  await page.selectOption("#menuSize", "standard");
  await page.fill("#menuSeed", viewport.width < 500 ? "22000625" : "22000624");
  await page.fill("#menuAiCount", viewport.width < 500 ? "5" : "6");
  await page.selectOption("#menuDifficulty", viewport.width < 500 ? "cadet" : "veteran");
  await page.click("#startMenuBtn");
  await page.waitForFunction(() => document.getElementById("mainMenu").hidden, { timeout: 5000 });
  await page.waitForTimeout(350);
  await page.click('[data-action="toggle-icon-key"]');

  const result = await page.evaluate((menuVisible) => {
    const canvas = document.getElementById("galaxyCanvas");
    const context = canvas.getContext("2d");
    const before = document.getElementById("dateLabel").textContent;

    const target = state.systems.find((system) => system.known && !system.surveyedBy.player);
    let surveyOrderButton = false;
    let autoSurveyToggle = false;
    let autoSurveyLimitControls = 0;
    let autoSurveyLimitApplied = false;
    let autoSurveyTargetFound = false;
    let autoSurveyCanStart = false;
    let autoSurveyHeldOff = false;
    if (target) {
      state.selectedSystemId = target.id;
      state.selectedFleetId = "sci-meridian";
      updateUI();
      const scienceFleet = selectedFleet();
      autoSurveyToggle = Boolean(document.querySelector('.fleet-order-card [data-action="toggle-auto-survey"]'));
      autoSurveyLimitControls = document.querySelectorAll('.fleet-order-card [data-action="toggle-auto-survey-limit"]').length;
      commandToggleAutoSurveyLimit(scienceFleet.id, "localRange", true);
      autoSurveyLimitApplied = getAutoSurveySettings(scienceFleet).limits.localRange === true;
      commandToggleAutoSurveyLimit(scienceFleet.id, "localRange", false);
      autoSurveyTargetFound = Boolean(chooseAutoSurveyTarget(scienceFleet));
      commandToggleAutoSurvey(scienceFleet.id, true);
      autoSurveyCanStart =
        getAutoSurveySettings(scienceFleet).enabled === true && scienceFleet.order === "survey" && scienceFleet.target !== null;
      commandHoldSelectedFleet();
      autoSurveyHeldOff = scienceFleet.order === "idle" && getAutoSurveySettings(scienceFleet).enabled === false;
      state.selectedSystemId = target.id;
      state.selectedFleetId = "sci-meridian";
      updateUI();
      surveyOrderButton = Boolean(document.querySelector('.fleet-order-card [data-action="survey-system"]'));
      commandSurvey(target.id);
    }

    for (let i = 0; i < 18; i += 1) {
      tickMonth();
      if (state.modal) resolveDecision(0);
    }
    openSpaceEvent();
    resolveDecision(0);

    const home = state.systems[state.empires.player.homeSystemId];
    state.selectedSystemId = home.id;
    state.selectedFleetId = "fleet-home";
    updateUI();
    const beforeSplitFleets = state.fleets.length;
    commandSplitFleet();
    const splitWorked = state.fleets.length === beforeSplitFleets + 1 && selectedFleet()?.name.includes("Detachment");

    const mainFleet = state.fleets.find((fleet) => fleet.id === "fleet-home");
    const mainShipsBefore = mainFleet.ships;
    mainFleet.location = home.hyperlanes[0];
    completeBuild({
      type: "ship",
      owner: "player",
      systemId: home.id,
      label: "Smoke Corvette",
      strength: 5,
      ships: 1,
    });
    const localShipyardFleet = state.fleets.find(
      (fleet) => fleet.owner === "player" && fleet.role === "navy" && fleet.location === home.id && !fleet.route.length && fleet.ships >= 1
    );
    const shipyardLocalTraining = mainFleet.ships === mainShipsBefore && Boolean(localShipyardFleet);

    selectSystem(home.id, false);
    state.selectedFleetId = "con-dauntless";
    updateUI();
    const sameSystemMiningBefore = home.stations.mining;
    commandBuildStation(home.id, "mining");
    const sameSystemBuild = !sameSystemMiningBefore && home.stations.mining;

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
      aiCount: state.aiTemplates.length,
      shape: state.galaxy.shape,
      difficulty: state.galaxy.difficulty,
      researchables: TECH_LIBRARY.length,
      shipBuilds: Object.keys(SHIP_BUILDS).length,
      planetBuilds: Object.keys(PLANET_BUILDS).length,
      speeds: state.speeds,
      activeModifiers: state.timedModifiers.length,
      eventsHaveModifiers: SPACE_EVENTS.every((event) =>
        event.options.every((option) => option.modifier?.duration > 0 && Object.keys(option.modifier.effects || {}).length > 0)
      ),
      logs: state.logs.length,
      lit,
      selected: document.getElementById("selectedTag").textContent,
      systemBodies: document.querySelectorAll(".system-body").length,
      systemShips: document.querySelectorAll(".system-ship").length,
      shipOrderButtons: document.querySelectorAll(".fleet-order-card [data-action]").length,
      installationIcons: document.querySelectorAll(".install-icon").length,
      progressRows: document.querySelectorAll(".system-progress-row").length,
      progressMeters: document.querySelectorAll(".system-progress-meter > span").length,
      keyRows: document.querySelectorAll("#iconKeyWindow .icon-key-row").length,
      costTitles: [...document.querySelectorAll(".action-button, .ghost-button")].filter((button) => button.title).length,
      splitWorked,
      shipyardLocalTraining,
      sameSystemBuild,
      systemOrderHeading: [...document.querySelectorAll("#inspectorPanel .subhead")].some(
        (item) => item.textContent.trim() === "Orders"
      ),
      surveyOrderButton,
      autoSurveyToggle,
      autoSurveyLimitControls,
      autoSurveyLimitApplied,
      autoSurveyTargetFound,
      autoSurveyCanStart,
      autoSurveyHeldOff,
      territoryLegendRows: document.querySelectorAll("#territoryLegend .territory-legend-row").length,
      infrastructureSystems: state.systems.filter(
        (system) =>
          (system.known || system.surveyedBy.player || system.owner === "player") &&
          systemInfrastructureIcons(system, { includeBuildings: true, includeColonySite: true }).length
      ).length,
      borderCandidates: state.systems.filter(
        (system) =>
          system.owner &&
          system.hyperlanes.some((neighborId) => {
            const neighbor = state.systems[neighborId];
            return neighbor.owner !== system.owner && (neighbor.owner || neighbor.known || neighbor.surveyedBy.player);
          })
      ).length,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      menuVisible,
    };
  }, menuVisible);

  await page.screenshot({
    path: path.resolve(__dirname, "..", `smoke-${viewport.width}x${viewport.height}.png`),
    fullPage: true,
  });
  await page.close();

  if (errors.length) throw new Error(errors.join("\n"));
  if (result.before === result.after) throw new Error("Simulation date did not advance.");
  if (!result.menuVisible) throw new Error("Main menu did not render before game start.");
  if (result.resources < 6) throw new Error("Resource bar did not render.");
  if (result.systems < 80 || result.fleets < 5) throw new Error("Galaxy generation is incomplete.");
  if (result.aiCount !== (viewport.width < 500 ? 5 : 6)) throw new Error("AI empire counter was not applied.");
  if (result.difficulty !== (viewport.width < 500 ? "cadet" : "veteran")) throw new Error("AI difficulty was not applied.");
  if (result.researchables < 20) throw new Error("Expanded research deck did not load.");
  if (result.shipBuilds < 5) throw new Error("Expanded ship builds did not load.");
  if (result.planetBuilds < 8) throw new Error("Expanded planet buildings did not load.");
  if (!result.eventsHaveModifiers || result.activeModifiers < 1) throw new Error("Space events did not apply modifiers.");
  if (result.speeds[0] !== 0.5 || result.speeds[2] !== 2) throw new Error("Slower speed presets were not applied.");
  if (result.territoryLegendRows < 1) throw new Error("Territory legend did not render.");
  if (result.borderCandidates < 1) throw new Error("Faction border candidates were not found.");
  if (!["rift", "elliptical"].includes(result.shape)) throw new Error("Menu galaxy shape was not applied.");
  if (result.systemBodies < 2) throw new Error("Solar system map did not render bodies.");
  if (result.systemShips < 1) throw new Error("Interactive ship tokens did not render in the system map.");
  if (result.shipOrderButtons < 3) throw new Error("Ship order controls did not render.");
  if (result.installationIcons < 6) throw new Error("Infrastructure icons did not render in the system map.");
  if (result.progressRows < 10 || result.progressMeters !== result.progressRows) {
    throw new Error("System progress bars did not render for the selected system.");
  }
  if (result.keyRows < result.planetBuilds + 9) throw new Error("Icon key window did not render every icon family.");
  if (result.costTitles < 6) throw new Error("Hover cost titles did not render on action buttons.");
  if (!result.splitWorked) throw new Error("Fleet splitting did not create a detachment.");
  if (!result.shipyardLocalTraining) throw new Error("Shipyard training joined a fleet outside the shipyard system.");
  if (!result.sameSystemBuild) throw new Error("Constructor could not build a station in its current system.");
  if (result.infrastructureSystems < 1) throw new Error("Galaxy infrastructure icon data was not generated.");
  if (result.systemOrderHeading) throw new Error("System inspector still renders a generic Orders section.");
  if (!result.surveyOrderButton) throw new Error("Science ship survey order did not render.");
  if (!result.autoSurveyToggle || result.autoSurveyLimitControls < 5) throw new Error("Auto-survey controls did not render.");
  if (!result.autoSurveyLimitApplied) throw new Error("Auto-survey limit toggle did not apply.");
  if (!result.autoSurveyTargetFound) throw new Error("Auto-survey could not find a valid target.");
  if (!result.autoSurveyCanStart) throw new Error("Auto-survey did not assign a science ship target.");
  if (!result.autoSurveyHeldOff) throw new Error("Hold did not disable science ship auto-survey.");
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
