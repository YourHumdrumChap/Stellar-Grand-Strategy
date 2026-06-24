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
  await page.evaluate(() => {
    const size = document.getElementById("menuSize");
    size.value = "108";
    size.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.fill("#menuSeed", viewport.width < 500 ? "22000625" : "22000624");
  await page.evaluate((aiCount) => {
    const input = document.getElementById("menuAiCount");
    input.value = aiCount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, viewport.width < 500 ? "5" : "6");
  await page.selectOption("#menuDifficulty", viewport.width < 500 ? "cadet" : "veteran");
  await page.selectOption("#menuScenario", viewport.width < 500 ? "frontier" : "relic");
  await page.click('[data-action="open-multiplayer"]');
  const multiplayerMenuVisible = await page.locator("#multiplayerMenu").isVisible();
  const multiplayerStatusText = await page.locator("#multiplayerStatus").textContent();
  await page.evaluate(() => document.querySelector('[data-action="show-create-lobby"]').click());
  const createLobbyVisible = await page.locator("#createLobbyMenu").isVisible();
  await page.click("#startMenuBtn");
  await page.waitForFunction(() => document.getElementById("mainMenu").hidden, { timeout: 5000 });
  await page.waitForTimeout(350);
  await page.click('[data-action="toggle-icon-key"]');

  const result = await page.evaluate((meta) => {
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
    let surveyDelayedAfterArrival = false;
    let surveyCompletesAfterWork = false;
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
      const manualSurveyFleet = selectedFleet();
      for (let i = 0; i < 30 && manualSurveyFleet.route.length; i += 1) updateFleets();
      surveyDelayedAfterArrival =
        manualSurveyFleet.location === target.id &&
        manualSurveyFleet.order === "survey" &&
        !target.surveyedBy.player &&
        manualSurveyFleet.workTotal > 0;
      for (let i = 0; i < 10 && !target.surveyedBy.player; i += 1) {
        updateFleets();
        if (state.modal) resolveDecision(0);
      }
      surveyCompletesAfterWork = surveyDelayedAfterArrival && target.surveyedBy.player;
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
    const miningFleet = selectedFleet();
    const sameSystemBuildDelayed =
      !sameSystemMiningBefore &&
      !home.stations.mining &&
      miningFleet.order === "build-mining" &&
      miningFleet.location === home.id &&
      miningFleet.workTotal > 0;
    for (let i = 0; i < 10 && !home.stations.mining; i += 1) updateFleets();
    const sameSystemBuild = sameSystemBuildDelayed && home.stations.mining && miningFleet.order === "idle";
    const moveTarget = state.systems[home.hyperlanes[0]];
    selectSystem(moveTarget.id, false);
    state.selectedFleetId = "con-dauntless";
    commandMoveSelectedFleet(moveTarget.id);
    const cancelHadOrder = selectedFleet()?.order === "move";
    commandCancelFleetOrders("con-dauntless");
    const cancelWorked = cancelHadOrder && selectedFleet()?.order === "idle" && !selectedFleet()?.route.length;

    const noShipyardTarget = state.systems.find((system) => system.known && !system.stations.shipyard && system.id !== home.id) || moveTarget;
    selectSystem(noShipyardTarget.id, false);
    updateUI();
    const shipyardUiHiddenAway = document.querySelectorAll('[data-action="build-ship"]').length === 0;
    const queueBeforeInvalidShip = state.buildQueue.length;
    commandBuildShip("scienceVessel", noShipyardTarget.id);
    const shipBuildBlockedWithoutShipyard = state.buildQueue.length === queueBeforeInvalidShip;

    claimSystem(moveTarget.id, "player", { reveal: true });
    moveTarget.stations.shipyard = false;
    const constructor = state.fleets.find((fleet) => fleet.id === "con-dauntless");
    constructor.location = moveTarget.id;
    constructor.route = [];
    constructor.order = "idle";
    state.selectedFleetId = constructor.id;
    selectSystem(moveTarget.id, false);
    const shipyardBeforeBuild = moveTarget.stations.shipyard;
    commandBuildStation(moveTarget.id, "shipyard");
    const shipyardBuildStarted =
      !shipyardBeforeBuild &&
      !moveTarget.stations.shipyard &&
      constructor.order === "build-shipyard" &&
      constructor.location === moveTarget.id &&
      constructor.workTotal > 0;
    for (let i = 0; i < 12 && !moveTarget.stations.shipyard; i += 1) updateFleets();
    const constructorBuiltShipyard = shipyardBuildStarted && moveTarget.stations.shipyard && constructor.order === "idle";
    updateUI();
    const shipyardUiVisible = document.querySelectorAll('[data-action="build-ship"]').length >= Object.keys(SHIP_BUILDS).length;
    const queueBeforeValidShip = state.buildQueue.length;
    commandBuildShip("scienceVessel", moveTarget.id);
    const shipBuildQueuedAtShipyard =
      state.buildQueue.length === queueBeforeValidShip + 1 &&
      state.buildQueue.at(-1).type === "ship" &&
      state.buildQueue.at(-1).systemId === moveTarget.id;
    updateUI();
    const shipyardQueueRows = document.querySelectorAll("#inspectorPanel .shipyard-queue .queue-row").length;
    const shipyardQueueShowsShip = [...document.querySelectorAll("#inspectorPanel .shipyard-queue .queue-row")].some((row) =>
      row.textContent.includes("Science Vessel")
    );

    const scienceCountBefore = state.fleets.filter((fleet) => fleet.owner === "player" && fleet.role === "science").length;
    const constructorCountBefore = state.fleets.filter((fleet) => fleet.owner === "player" && fleet.role === "constructor").length;
    completeBuild({
      type: "ship",
      owner: "player",
      systemId: home.id,
      label: "Smoke Surveyor",
      role: "science",
      speed: 1.25,
      strength: 0,
      ships: 1,
    });
    completeBuild({
      type: "ship",
      owner: "player",
      systemId: home.id,
      label: "Smoke Builder",
      role: "constructor",
      speed: 1,
      strength: 0,
      ships: 1,
    });
    const civilianShipsBuilt =
      state.fleets.filter((fleet) => fleet.owner === "player" && fleet.role === "science").length === scienceCountBefore + 1 &&
      state.fleets.filter((fleet) => fleet.owner === "player" && fleet.role === "constructor").length === constructorCountBefore + 1;

    const politicalIdeologyButtons = document.querySelectorAll('[data-action="set-ideology"][data-category="political"]').length;
    const economicIdeologyButtons = document.querySelectorAll('[data-action="set-ideology"][data-category="economic"]').length;
    const influenceOutputBefore = state.modifiers.influenceOutput;
    commandSetIdeology("economic", "frontier");
    const ideologyApplied = state.ideologies.economic === "frontier" && state.modifiers.influenceOutput > influenceOutputBefore;
    const queueCandidate = TECH_LIBRARY.find(
      (tech) => !state.tech.known.includes(tech.id) && state.tech.active?.id !== tech.id && !state.tech.queue.includes(tech.id)
    );
    if (queueCandidate) commandQueueResearch(queueCandidate.id);
    const researchQueued = queueCandidate ? state.tech.queue.includes(queueCandidate.id) : state.tech.queue.length === 0;
    const researchQueueButtons = document.querySelectorAll('#researchPanel [data-action="choose-tech"][title]').length;
    const allResearchHaveModifiers = TECH_LIBRARY.every((tech) => Object.keys(tech.effects || {}).length > 0);
    const previousBureaus = home.colony.buildings.bureau || 0;
    const influenceBeforeBureau = computeIncome("player").influence;
    home.colony.buildings.bureau = previousBureaus + 1;
    const bureauInfluenceWorks = computeIncome("player").influence > influenceBeforeBureau;
    home.colony.buildings.bureau = previousBureaus;
    selectSystem(home.id, false);
    updateUI();
    const civicHover = document.querySelector('[data-action="build-planet"][data-building="bureau"]')?.title || "";
    const savedBuildings = { ...home.colony.buildings };
    home.colony.buildings.city = colonyBuildingLimit(home);
    const buildingCapWorks = !canBuildPlanet(home, "city");
    home.colony.buildings = savedBuildings;
    const farSystem = state.systems
      .filter((system) => system.id !== home.id)
      .sort((a, b) => capitalJumpDistance(b) - capitalJumpDistance(a))[0];
    const distanceCostsWork =
      farSystem &&
      getOutpostCost(farSystem).influence > getOutpostCost(home).influence &&
      getColonizeCost(farSystem).influence > getColonizeCost(home).influence;

    const mergeFleet = state.fleets.find((fleet) => fleet.owner === "player" && fleet.role === "navy" && fleet.location === home.id && !fleet.route.length);
    state.fleets.push({
      id: "smoke-merge-fleet",
      name: "Smoke Merge Wing",
      owner: "player",
      role: "navy",
      location: mergeFleet.location,
      route: [],
      progress: 0,
      segmentMonths: 1,
      order: "idle",
      target: null,
      strength: 3,
      maxStrength: 3,
      ships: 1,
      speed: 1,
      autoAttack: createAutoAttackSettings(),
    });
    state.selectedFleetId = mergeFleet.id;
    const beforeMergeCount = state.fleets.length;
    commandMergeFleet();
    const mergeWorked = state.fleets.length === beforeMergeCount - 1 && !state.fleets.some((fleet) => fleet.id === "smoke-merge-fleet");

    const attackFleet = selectedFleet();
    const pirateTarget = {
      id: "smoke-pirate-target",
      name: "Smoke Raider",
      owner: "pirates",
      role: "navy",
      location: moveTarget.id,
      route: [],
      progress: 0,
      segmentMonths: 1,
      order: "idle",
      target: null,
      strength: 2,
      maxStrength: 2,
      ships: 1,
      speed: 1,
    };
    state.fleets.push(pirateTarget);
    const matchupPowerWorks =
      fleetCombatPower({ owner: "player", role: "navy", strength: 42, maxStrength: 42, ships: 1, hulls: { carrier: 1 } }, pirateTarget) >
      fleetCombatPower({ owner: "player", role: "navy", strength: 5, maxStrength: 5, ships: 1, hulls: { corvette: 1 } }, pirateTarget);
    state.selectedSystemId = moveTarget.id;
    updateUI();
    const attackFleetButtons = document.querySelectorAll('[data-action="attack-fleet"]').length;
    state.selectedFleetId = "sci-meridian";
    commandAttackFleet(pirateTarget.id);
    const assignedAttackFleet = state.fleets.find((fleet) => fleet.owner === "player" && fleet.role === "navy" && fleet.attackTargetFleetId === pirateTarget.id);
    const attackFleetOrderWorked =
      assignedAttackFleet?.order === "hunt-pirates" ||
      !state.fleets.some((fleet) => fleet.id === pirateTarget.id) ||
      state.logs.some((entry) => /raiders|engagement/i.test(entry.text));
    commandCancelFleetOrders(assignedAttackFleet?.id || attackFleet.id);
    if (!state.fleets.some((fleet) => fleet.owner === "pirates" && fleet.location === moveTarget.id)) {
      state.fleets.push({
        ...pirateTarget,
        id: "smoke-pirate-auto-target",
        name: "Smoke Auto Raider",
        strength: 2,
        maxStrength: 2,
        ships: 1,
        hulls: { corvette: 1 },
      });
    }
    const autoAttackToggle = Boolean(document.querySelector('.fleet-order-card [data-action="toggle-auto-attack"]'));
    const autoAttackLimitControls = document.querySelectorAll('.fleet-order-card [data-action="toggle-auto-attack-limit"]').length;
    commandToggleAutoAttack(attackFleet.id, true);
    const autoAttackCanStart =
      getAutoAttackSettings(attackFleet).enabled === true &&
      (attackFleet.order === "hunt-pirates" ||
        !state.fleets.some((fleet) => fleet.id === "smoke-pirate-auto-target") ||
        state.logs.some((entry) => /auto-attacks|raiders|engagement/i.test(entry.text)));
    commandCancelFleetOrders(attackFleet.id);

    const panelTabs = document.querySelectorAll("[data-panel-menu]").length;
    selectSystem(home.id, false);
    state.selectedFleetId = attackFleet.id;
    updateUI();
    const strategicRatings = getEmpireRatings("player");
    const strategicProgramButtons = document.querySelectorAll('[data-action="enact-program"]').length;
    const programModifiersBefore = state.timedModifiers.length;
    state.resources.energy += 500;
    state.resources.unity += 500;
    commandEnactProgram("program-frontier-survey");
    const programApplied =
      state.timedModifiers.length === programModifiersBefore + 1 &&
      state.timedModifiers.some((modifier) => modifier.id.startsWith("program-frontier-survey-"));
    const scenarioSummaryVisible = document.querySelector("#menuScenarioSummary")?.textContent.length > 20;

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
      buttonsWithoutTitles: [...document.querySelectorAll("button")].filter((button) => !button.title).length,
      systems: state.systems.length,
      fleets: state.fleets.length,
      aiCount: state.aiTemplates.length,
      requestedSystems: state.galaxy.count,
      systemNamePool: SYSTEM_NAMES.length,
      uniqueSystemNames: new Set(SYSTEM_NAMES).size,
      shape: state.galaxy.shape,
      difficulty: state.galaxy.difficulty,
      scenario: state.galaxy.scenario,
      scenarioSummaryVisible,
      researchables: TECH_LIBRARY.length,
      events: SPACE_EVENTS.length,
      allResearchHaveModifiers,
      researchQueued,
      researchQueueButtons,
      shipBuilds: Object.keys(SHIP_BUILDS).length,
      planetBuilds: Object.keys(PLANET_BUILDS).length,
      civicBuildAvailable: Boolean(PLANET_BUILDS.bureau),
      bureauInfluenceWorks,
      civicHoverIncludesInfluence: /influence/.test(civicHover),
      buildingCapWorks,
      distanceCostsWork,
      civilianShipsBuilt,
      shipyardUiHiddenAway,
      shipBuildBlockedWithoutShipyard,
      surveyDelayedAfterArrival,
      surveyCompletesAfterWork,
      sameSystemBuildDelayed,
      shipyardBuildStarted,
      constructorBuiltShipyard,
      shipyardUiVisible,
      shipBuildQueuedAtShipyard,
      shipyardQueueRows,
      shipyardQueueShowsShip,
      cancelWorked,
      mergeWorked,
      attackFleetButtons,
      attackFleetOrderWorked,
      autoAttackToggle,
      autoAttackLimitControls,
      autoAttackCanStart,
      matchupPowerWorks,
      panelTabs,
      strategicRatings,
      strategicProgramButtons,
      programApplied,
      politicalIdeologyButtons,
      economicIdeologyButtons,
      ideologyApplied,
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
      menuVisible: meta.menuVisible,
      multiplayerMenuVisible: meta.multiplayerMenuVisible,
      multiplayerStatusText: meta.multiplayerStatusText,
      createLobbyVisible: meta.createLobbyVisible,
    };
  }, { menuVisible, multiplayerMenuVisible, multiplayerStatusText, createLobbyVisible });

  await page.screenshot({
    path: path.resolve(__dirname, "..", `smoke-${viewport.width}x${viewport.height}.png`),
    fullPage: true,
  });
  await page.close();

  if (errors.length) throw new Error(errors.join("\n"));
  if (result.before === result.after) throw new Error("Simulation date did not advance.");
  if (!result.menuVisible) throw new Error("Main menu did not render before game start.");
  if (!result.multiplayerMenuVisible || !result.createLobbyVisible || !/(anon key|publishable key)/i.test(result.multiplayerStatusText || "")) {
    throw new Error("Multiplayer lobby menu did not render its Supabase setup flow.");
  }
  if (result.resources < 6) throw new Error("Resource bar did not render.");
  if (result.buttonsWithoutTitles > 0) throw new Error("Some rendered buttons are missing hover descriptions.");
  if (result.systems < 80 || result.fleets < 5) throw new Error("Galaxy generation is incomplete.");
  if (result.requestedSystems !== 108) throw new Error("Galaxy size slider was not applied.");
  if (result.systemNamePool < 1500 || result.uniqueSystemNames !== result.systemNamePool) {
    throw new Error("Procedural system name pool does not contain 1500 unique names.");
  }
  if (result.aiCount !== (viewport.width < 500 ? 5 : 6)) throw new Error("AI empire counter was not applied.");
  if (result.difficulty !== (viewport.width < 500 ? "cadet" : "veteran")) throw new Error("AI difficulty was not applied.");
  if (result.scenario !== (viewport.width < 500 ? "frontier" : "relic") || !result.scenarioSummaryVisible) {
    throw new Error("Scenario selector did not apply or describe the selected scenario.");
  }
  if (result.researchables < 30) throw new Error("Expanded research deck did not load.");
  if (result.events < 36) throw new Error("Expanded event deck did not load.");
  if (!result.allResearchHaveModifiers) throw new Error("Every research must declare at least one modifier.");
  if (!result.researchQueued || result.researchQueueButtons < 3) throw new Error("Research queue controls did not work.");
  if (result.shipBuilds < 7) throw new Error("Expanded ship builds did not load.");
  if (result.planetBuilds < 9 || !result.civicBuildAvailable || !result.bureauInfluenceWorks) {
    throw new Error("Influence building path did not load or affect income.");
  }
  if (!result.civicHoverIncludesInfluence) throw new Error("Civic Bureau hover text does not describe influence production.");
  if (!result.buildingCapWorks) throw new Error("Colony building cap did not prevent overbuilding.");
  if (!result.distanceCostsWork) throw new Error("Distance-scaled influence costs did not apply.");
  if (!result.civilianShipsBuilt) throw new Error("Science or construction ship builds did not create civilian fleets.");
  if (!result.surveyDelayedAfterArrival || !result.surveyCompletesAfterWork) {
    throw new Error("Science ship surveys complete instantly instead of after on-site work.");
  }
  if (!result.cancelWorked) throw new Error("Cancel orders did not clear a ship order.");
  if (!result.mergeWorked) throw new Error("Fleet merge did not combine local combat fleets.");
  if (result.attackFleetButtons < 1 || !result.attackFleetOrderWorked) throw new Error("Fleet target attack controls did not work.");
  if (!result.matchupPowerWorks) throw new Error("Ship-specific combat matchups did not affect fleet power.");
  if (!result.autoAttackToggle || result.autoAttackLimitControls < 5 || !result.autoAttackCanStart) {
    throw new Error("Auto-attack controls did not render or assign a target.");
  }
  if (
    !result.strategicRatings ||
    result.strategicRatings.cohesion <= 0 ||
    result.strategicRatings.logistics <= 0 ||
    result.strategicRatings.security <= 0 ||
    result.strategicProgramButtons < 4 ||
    !result.programApplied
  ) {
    throw new Error("Strategic ratings or programs did not render/apply.");
  }
  if (!result.shipyardUiHiddenAway || !result.shipBuildBlockedWithoutShipyard) {
    throw new Error("Shipyard UI/builds are available without a shipyard.");
  }
  if (!result.shipyardBuildStarted || !result.constructorBuiltShipyard || !result.shipyardUiVisible || !result.shipBuildQueuedAtShipyard) {
    throw new Error("Buildable shipyard or shipyard-gated ship construction failed.");
  }
  if (result.shipyardQueueRows < 1 || !result.shipyardQueueShowsShip) {
    throw new Error("Selected shipyard did not render its ship-building queue.");
  }
  if (result.panelTabs < 7) throw new Error("Separate panel menu tabs did not render.");
  if (result.politicalIdeologyButtons < 4 || result.economicIdeologyButtons < 4 || !result.ideologyApplied) {
    throw new Error("Ideology menus did not render or apply modifiers.");
  }
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
  if (result.keyRows < result.planetBuilds + 10) throw new Error("Icon key window did not render every icon family.");
  if (result.costTitles < 6) throw new Error("Hover cost titles did not render on action buttons.");
  if (!result.splitWorked) throw new Error("Fleet splitting did not create a detachment.");
  if (!result.shipyardLocalTraining) throw new Error("Shipyard training joined a fleet outside the shipyard system.");
  if (!result.sameSystemBuildDelayed || !result.sameSystemBuild) {
    throw new Error("Constructor same-system station work did not delay and complete correctly.");
  }
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
