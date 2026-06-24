"use strict";

const canvas = document.getElementById("galaxyCanvas");
const ctx = canvas.getContext("2d");

const els = {
  pauseBtn: document.getElementById("pauseBtn"),
  speedBtn: document.getElementById("speedBtn"),
  stepBtn: document.getElementById("stepBtn"),
  dateLabel: document.getElementById("dateLabel"),
  resourceStrip: document.getElementById("resourceStrip"),
  empirePanel: document.getElementById("empirePanel"),
  fleetPanel: document.getElementById("fleetPanel"),
  researchPanel: document.getElementById("researchPanel"),
  inspectorPanel: document.getElementById("inspectorPanel"),
  selectedTag: document.getElementById("selectedTag"),
  diplomacyPanel: document.getElementById("diplomacyPanel"),
  logPanel: document.getElementById("logPanel"),
  toast: document.getElementById("toast"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalKicker: document.getElementById("modalKicker"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  modalOptions: document.getElementById("modalOptions"),
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const RESOURCE_ORDER = ["energy", "minerals", "alloys", "influence", "unity", "research"];
const RESOURCE_META = {
  energy: { label: "Energy", color: "#f2b84b" },
  minerals: { label: "Minerals", color: "#9bd389" },
  alloys: { label: "Alloys", color: "#c5d5dc" },
  influence: { label: "Influence", color: "#ad8cff" },
  unity: { label: "Unity", color: "#df709b" },
  research: { label: "R&D", color: "#4fd1d8" },
};

const STAR_CLASSES = [
  { code: "M", color: "#ff8466", radius: 3.8 },
  { code: "K", color: "#ffb36b", radius: 4.1 },
  { code: "G", color: "#ffe29a", radius: 4.7 },
  { code: "F", color: "#f5f9ff", radius: 4.9 },
  { code: "A", color: "#a8c9ff", radius: 5.2 },
  { code: "B", color: "#8aa6ff", radius: 5.6 },
  { code: "Pulsar", color: "#9ee8ff", radius: 4.4 },
  { code: "Dwarf", color: "#dcb8ff", radius: 3.4 },
];

const SYSTEM_NAMES = [
  "Apolune",
  "Asteron",
  "Aurelia",
  "Bastion",
  "Bellatrix",
  "Borealis",
  "Cairn",
  "Caldera",
  "Calypso",
  "Candescent",
  "Carinae",
  "Cobalt",
  "Concord",
  "Cradle",
  "Cygnus",
  "Dawnmere",
  "Delphi",
  "Drift",
  "Eidolon",
  "Elys",
  "Emberfall",
  "Eos",
  "Erebus",
  "Eventide",
  "Farspring",
  "Fen",
  "Ferrum",
  "Galen",
  "Halcyon",
  "Hearth",
  "Helike",
  "Horizon",
  "Icarus",
  "Idris",
  "Ilion",
  "Juno",
  "Kadesh",
  "Kepler",
  "Kestrel",
  "Lacuna",
  "Lapis",
  "Lumen",
  "Lyra",
  "Madrigal",
  "Manticore",
  "Marrow",
  "Medea",
  "Meridian",
  "Mirage",
  "Nadir",
  "Naraka",
  "Nereid",
  "New Vale",
  "Nimbus",
  "Nysa",
  "Obsidian",
  "Oculus",
  "Orison",
  "Pale Crown",
  "Paragon",
  "Peregrine",
  "Pillar",
  "Praxis",
  "Prominence",
  "Quarry",
  "Ravel",
  "Redoubt",
  "Reliquary",
  "Rhea",
  "Rift",
  "Sable",
  "Sanctum",
  "Saros",
  "Sepulcher",
  "Serrin",
  "Seyfert",
  "Silverrun",
  "Solace",
  "Sunder",
  "Talon",
  "Tessera",
  "Thalassa",
  "Tidefall",
  "Tor",
  "Tranquil",
  "Umbra",
  "Vantage",
  "Vela",
  "Verdigris",
  "Vigil",
  "Viridian",
  "Voss",
  "Waymark",
  "Wellspring",
  "Wreath",
  "Xeric",
  "Yarrow",
  "Zenith",
  "Zephyr",
];

const EMPIRE_TEMPLATES = [
  {
    id: "helion",
    name: "Helion Combine",
    adjective: "Helion",
    color: "#eeb95b",
    attitude: -12,
    expansion: 7,
    aggression: 0.74,
    home: "Candescent",
  },
  {
    id: "verdant",
    name: "Verdant Choir",
    adjective: "Choir",
    color: "#73d38a",
    attitude: 16,
    expansion: 9,
    aggression: 0.34,
    home: "Viridian",
  },
  {
    id: "voss",
    name: "Voss Synthate",
    adjective: "Voss",
    color: "#8cb7ff",
    attitude: -2,
    expansion: 8,
    aggression: 0.52,
    home: "Voss",
  },
  {
    id: "karth",
    name: "Karth Compact",
    adjective: "Karth",
    color: "#df709b",
    attitude: -24,
    expansion: 6,
    aggression: 0.82,
    home: "Redoubt",
  },
];

const TECH_LIBRARY = [
  {
    id: "survey-drones",
    name: "Autonomous Survey Drones",
    field: "Physics",
    cost: 95,
    text: "Science ships survey faster and uncover safer anomaly options.",
    apply() {
      state.modifiers.surveySpeed += 0.35;
      state.modifiers.anomalySafety += 0.15;
    },
  },
  {
    id: "fusion-grid",
    name: "Fusion Grid Tapping",
    field: "Engineering",
    cost: 120,
    text: "Energy stations produce more and ship upkeep falls slightly.",
    apply() {
      state.modifiers.stationEnergy += 0.35;
      state.modifiers.shipUpkeep -= 0.08;
    },
  },
  {
    id: "deep-core",
    name: "Deep Core Refining",
    field: "Industry",
    cost: 130,
    text: "Mining stations and mining districts become more productive.",
    apply() {
      state.modifiers.stationMinerals += 0.3;
      state.modifiers.miningDistricts += 0.2;
    },
  },
  {
    id: "orbital-labs",
    name: "Orbital Lab Networks",
    field: "Society",
    cost: 150,
    text: "Research stations and labs produce more research.",
    apply() {
      state.modifiers.stationResearch += 0.3;
      state.modifiers.labs += 0.25;
    },
  },
  {
    id: "colonial-charter",
    name: "Colonial Charter Offices",
    field: "Society",
    cost: 170,
    text: "Colonies are cheaper and grow faster.",
    apply() {
      state.modifiers.colonyCost -= 0.22;
      state.modifiers.growth += 0.25;
    },
  },
  {
    id: "hyperlane-cadence",
    name: "Hyperlane Cadence Engines",
    field: "Physics",
    cost: 160,
    text: "All fleets cross hyperlanes faster.",
    apply() {
      state.modifiers.shipSpeed += 0.3;
    },
  },
  {
    id: "starhold",
    name: "Starhold Logistics",
    field: "Engineering",
    cost: 180,
    text: "Outposts gain defenses and cost less alloy to build.",
    apply() {
      state.modifiers.starbaseDefense += 4;
      state.modifiers.outpostCost -= 0.18;
    },
  },
  {
    id: "fleet-patterns",
    name: "Layered Fleet Patterns",
    field: "Military",
    cost: 190,
    text: "Warships gain combat power and destroyers become available.",
    apply() {
      state.modifiers.fleetPower += 0.22;
      state.unlocks.destroyer = true;
    },
  },
  {
    id: "civic-archives",
    name: "Civic Memory Archives",
    field: "Governance",
    cost: 145,
    text: "Unity production improves and diplomatic actions cost less.",
    apply() {
      state.modifiers.unity += 0.35;
      state.modifiers.diplomacyCost -= 0.2;
    },
  },
  {
    id: "interstellar-bureaus",
    name: "Interstellar Bureaus",
    field: "Governance",
    cost: 155,
    text: "Influence income rises and empire sprawl hurts less.",
    apply() {
      state.modifiers.influence += 1;
      state.modifiers.sprawl += 0.18;
    },
  },
  {
    id: "shield-harmonics",
    name: "Shield Harmonics",
    field: "Military",
    cost: 210,
    text: "Fleets and starbases take fewer combat losses.",
    apply() {
      state.modifiers.combatSurvival += 0.18;
    },
  },
  {
    id: "terraforming-seeds",
    name: "Atmospheric Seeding",
    field: "Society",
    cost: 220,
    text: "Marginal worlds become more attractive colony targets.",
    apply() {
      state.modifiers.habitability += 0.18;
    },
  },
];

const PLANET_BUILDS = {
  generator: {
    label: "Generator",
    cost: { minerals: 120 },
    months: 6,
    text: "Energy output",
  },
  mining: {
    label: "Mining",
    cost: { minerals: 140 },
    months: 7,
    text: "Mineral output",
  },
  lab: {
    label: "Lab",
    cost: { minerals: 160, energy: 40 },
    months: 8,
    text: "Research output",
  },
  foundry: {
    label: "Foundry",
    cost: { minerals: 180, energy: 55 },
    months: 9,
    text: "Alloy output",
  },
  city: {
    label: "City",
    cost: { minerals: 135, unity: 25 },
    months: 7,
    text: "Growth and unity",
  },
};

const SHIP_BUILDS = {
  corvette: {
    label: "Corvette",
    cost: { alloys: 90, energy: 20 },
    months: 4,
    strength: 5,
    ships: 1,
    requires: null,
  },
  destroyer: {
    label: "Destroyer",
    cost: { alloys: 190, energy: 55 },
    months: 7,
    strength: 12,
    ships: 1,
    requires: "destroyer",
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = (value) => Math.floor(value).toLocaleString("en-US");
const oneDecimal = (value) => (Math.round(value * 10) / 10).toFixed(1);

let state;
let lastFrame = 0;
let dpr = 1;
let viewport = { width: 1, height: 1 };
let pointer = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeRng(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(min, max) {
  return min + state.rng() * (max - min);
}

function pick(list) {
  return list[Math.floor(state.rng() * list.length)];
}

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = state.rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function createEmptyResources(values = {}) {
  return {
    energy: values.energy || 0,
    minerals: values.minerals || 0,
    alloys: values.alloys || 0,
    influence: values.influence || 0,
    unity: values.unity || 0,
    research: values.research || 0,
  };
}

function newGame(seed = Date.now()) {
  state = {
    seed,
    rng: makeRng(seed),
    running: false,
    speedIndex: 0,
    speeds: [1, 2, 4],
    month: 0,
    autoTimer: 0,
    mapMode: "political",
    selectedSystemId: null,
    selectedFleetId: "fleet-home",
    camera: { x: 0, y: 0, zoom: 0.46 },
    systems: [],
    fleets: [],
    backgroundStars: [],
    resources: createEmptyResources({
      energy: 360,
      minerals: 320,
      alloys: 210,
      influence: 150,
      unity: 75,
      research: 0,
    }),
    lastIncome: createEmptyResources(),
    buildQueue: [],
    logs: [],
    modal: null,
    victory: null,
    modifiers: {
      stationEnergy: 0,
      stationMinerals: 0,
      stationResearch: 0,
      miningDistricts: 0,
      labs: 0,
      colonyCost: 0,
      growth: 0,
      shipSpeed: 0,
      starbaseDefense: 0,
      outpostCost: 0,
      fleetPower: 0,
      combatSurvival: 0,
      unity: 0,
      influence: 0,
      sprawl: 0,
      diplomacyCost: 0,
      habitability: 0,
      anomalySafety: 0,
      shipUpkeep: 0,
      surveySpeed: 0,
    },
    unlocks: { destroyer: false },
    tech: { known: [], active: null, progress: 0, choices: [] },
    empires: {},
    contacts: {},
    piratesSpawned: 0,
  };

  state.empires.player = {
    id: "player",
    name: "Aureate Commonwealth",
    adjective: "Commonwealth",
    color: "#4fd1d8",
    homeSystemId: null,
    stockpile: state.resources,
  };

  for (const template of EMPIRE_TEMPLATES) {
    state.empires[template.id] = {
      ...template,
      homeSystemId: null,
      stockpile: createEmptyResources({
        energy: 280,
        minerals: 260,
        alloys: 170,
        influence: 130,
        unity: 60,
        research: 0,
      }),
      aiTimer: Math.floor(state.rng() * 6),
      warTimer: 0,
    };
    state.contacts[template.id] = {
      met: false,
      relation: template.attitude,
      war: false,
      exhaustion: 0,
      playerClaims: 0,
      truce: 0,
    };
  }

  generateGalaxy();
  state.tech.choices = drawTechChoices();
  chooseTech(state.tech.choices[0]?.id, true);
  addLog("The Commonwealth Senate authorizes a full extrasolar expansion program.", "major");
  addLog("Science Vessel Meridian and Constructor Dauntless await orders.", "science");
  updateKnownFromBorders();
  discoverContacts();
  updateUI();
}

function generateGalaxy() {
  const usedNames = new Set();
  const systems = [];

  function nextName(preferred) {
    if (preferred && !usedNames.has(preferred)) {
      usedNames.add(preferred);
      return preferred;
    }
    for (let attempts = 0; attempts < 200; attempts++) {
      const name = pick(SYSTEM_NAMES);
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
    }
    const fallback = `S-${systems.length + 1}`;
    usedNames.add(fallback);
    return fallback;
  }

  systems.push(createSystem(0, nextName("Aurelia"), 0, 0, true));

  const count = 98;
  for (let i = 1; i < count; i++) {
    const arm = i % 4;
    const radius = 150 + Math.pow(state.rng(), 0.72) * 1480;
    const twist = radius / 460;
    const theta = arm * (Math.PI / 2) + twist + randRange(-0.56, 0.56);
    const jitter = randRange(-72, 72);
    const x = Math.cos(theta) * radius + Math.cos(theta + Math.PI / 2) * jitter;
    const y = Math.sin(theta) * radius + Math.sin(theta + Math.PI / 2) * jitter;
    systems.push(createSystem(i, nextName(), x, y, false));
  }

  state.systems = systems;
  connectGalaxy();
  assignHomeworlds();
  createFleets();
  createBackgroundStars();
  state.selectedSystemId = state.empires.player.homeSystemId;
}

function createSystem(id, name, x, y, isHome) {
  const star = isHome
    ? STAR_CLASSES[2]
    : weightedPick([
        { value: STAR_CLASSES[0], weight: 27 },
        { value: STAR_CLASSES[1], weight: 24 },
        { value: STAR_CLASSES[2], weight: 18 },
        { value: STAR_CLASSES[3], weight: 12 },
        { value: STAR_CLASSES[4], weight: 8 },
        { value: STAR_CLASSES[5], weight: 4 },
        { value: STAR_CLASSES[6], weight: 3 },
        { value: STAR_CLASSES[7], weight: 4 },
      ]);

  const hasPlanet = isHome || state.rng() < 0.36;
  const habitability = isHome ? 0.82 : hasPlanet ? randRange(0.28, 0.86) : 0;
  const deposits = {
    energy: isHome ? 3 : Math.floor(Math.pow(state.rng(), 1.3) * 6),
    minerals: isHome ? 4 : Math.floor(Math.pow(state.rng(), 1.15) * 7),
    research: isHome ? 2 : Math.floor(Math.pow(state.rng(), 1.45) * 6),
  };

  if (!isHome && deposits.energy + deposits.minerals + deposits.research < 2 && state.rng() < 0.74) {
    deposits[pick(["energy", "minerals", "research"])] += 2;
  }

  const anomalyTypes = [
    "precursor vault",
    "living crystal reef",
    "subspace echo",
    "derelict habitat",
    "singularity trace",
    "orbital ossuary",
  ];

  return {
    id,
    name,
    x,
    y,
    star,
    deposits,
    planet: hasPlanet
      ? {
          name: `${name} ${isHome ? "Prime" : pick(["I", "II", "III", "Reach", "Bastion"])}`,
          habitability,
          size: isHome ? 18 : Math.floor(randRange(9, 24)),
          type: isHome
            ? "Continental"
            : pick(["Arid", "Alpine", "Ocean", "Tundra", "Savanna", "Continental", "Relic", "Barren"]),
        }
      : null,
    colony: null,
    owner: null,
    starbase: null,
    stations: { mining: false, research: false },
    surveyedBy: {},
    known: false,
    hyperlanes: [],
    anomaly: state.rng() < 0.24 ? pick(anomalyTypes) : null,
    anomalyResolved: false,
    danger: state.rng() < 0.08 ? Math.floor(randRange(4, 12)) : 0,
  };
}

function connectGalaxy() {
  const systems = state.systems;
  const connected = new Set([0]);
  while (connected.size < systems.length) {
    let best = null;
    for (const a of connected) {
      for (let b = 0; b < systems.length; b++) {
        if (connected.has(b)) continue;
        const distance = systemDistance(systems[a], systems[b]);
        if (!best || distance < best.distance) best = { a, b, distance };
      }
    }
    connectSystems(best.a, best.b);
    connected.add(best.b);
  }

  for (const system of systems) {
    const nearest = systems
      .filter((other) => other.id !== system.id)
      .map((other) => ({ id: other.id, distance: systemDistance(system, other) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    for (const link of nearest) {
      if (link.distance < 470 || system.hyperlanes.length < 3) connectSystems(system.id, link.id);
    }
  }
}

function connectSystems(a, b) {
  const one = state.systems[a];
  const two = state.systems[b];
  if (!one.hyperlanes.includes(b)) one.hyperlanes.push(b);
  if (!two.hyperlanes.includes(a)) two.hyperlanes.push(a);
}

function assignHomeworlds() {
  const playerHome = state.systems[0];
  playerHome.name = "Aurelia";
  playerHome.planet.name = "Aurelia Prime";
  claimSystem(playerHome.id, "player", { home: true, reveal: true });
  playerHome.colony = createColony("player", playerHome.planet, true);
  state.empires.player.homeSystemId = playerHome.id;

  const angles = [0.42, 2.08, 3.68, 5.12];
  EMPIRE_TEMPLATES.forEach((template, index) => {
    const target = {
      x: Math.cos(angles[index]) * 1180,
      y: Math.sin(angles[index]) * 1180,
    };
    const home = state.systems
      .filter((system) => !system.owner && systemDistance(system, target) < 700)
      .sort((a, b) => systemDistance(a, target) - systemDistance(b, target))[0];
    const fallback = state.systems
      .filter((system) => !system.owner)
      .sort((a, b) => Math.abs(systemDistance(a, target) - 0) - Math.abs(systemDistance(b, target) - 0))[0];
    const chosen = home || fallback;
    chosen.name = template.home;
    chosen.planet =
      chosen.planet ||
      {
        name: `${template.home} Prime`,
        habitability: 0.76,
        size: 17,
        type: pick(["Arid", "Ocean", "Alpine", "Continental"]),
      };
    chosen.planet.name = `${template.home} Prime`;
    claimSystem(chosen.id, template.id, { home: true, reveal: false });
    chosen.colony = createColony(template.id, chosen.planet, true);
    state.empires[template.id].homeSystemId = chosen.id;

    const frontier = chosen.hyperlanes
      .map((id) => state.systems[id])
      .filter((system) => !system.owner)
      .sort((a, b) => scoreSystemForEmpire(b) - scoreSystemForEmpire(a))
      .slice(0, 1);
    for (const system of frontier) {
      claimSystem(system.id, template.id, { reveal: false });
    }
  });
}

function createColony(owner, planet, mature = false) {
  return {
    owner,
    name: planet.name,
    pops: mature ? 8 : 1,
    growth: mature ? 0.2 : 0,
    stability: mature ? 72 : 54,
    buildings: {
      generator: mature ? 1 : 0,
      mining: mature ? 1 : 0,
      lab: mature ? 1 : 0,
      foundry: mature ? 1 : 0,
      city: mature ? 1 : 0,
    },
  };
}

function createFleets() {
  const home = state.empires.player.homeSystemId;
  state.fleets.push({
    id: "sci-meridian",
    name: "Meridian",
    owner: "player",
    role: "science",
    location: home,
    route: [],
    progress: 0,
    segmentMonths: 1,
    order: "idle",
    target: null,
    strength: 0,
    ships: 1,
    speed: 1.25,
  });
  state.fleets.push({
    id: "con-dauntless",
    name: "Dauntless",
    owner: "player",
    role: "constructor",
    location: home,
    route: [],
    progress: 0,
    segmentMonths: 1,
    order: "idle",
    target: null,
    strength: 0,
    ships: 1,
    speed: 1.0,
  });
  state.fleets.push({
    id: "fleet-home",
    name: "First Expeditionary",
    owner: "player",
    role: "navy",
    location: home,
    route: [],
    progress: 0,
    segmentMonths: 1,
    order: "idle",
    target: null,
    strength: 14,
    ships: 3,
    speed: 1.05,
  });

  for (const template of EMPIRE_TEMPLATES) {
    state.fleets.push({
      id: `fleet-${template.id}`,
      name: `${template.adjective} Spear`,
      owner: template.id,
      role: "navy",
      location: state.empires[template.id].homeSystemId,
      route: [],
      progress: 0,
      segmentMonths: 1,
      order: "idle",
      target: null,
      strength: Math.floor(randRange(13, 21)),
      ships: 4,
      speed: 1.0,
    });
  }
}

function createBackgroundStars() {
  for (let i = 0; i < 560; i++) {
    const radius = Math.sqrt(state.rng()) * 2100;
    const theta = state.rng() * Math.PI * 2;
    state.backgroundStars.push({
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
      size: randRange(0.35, 1.45),
      alpha: randRange(0.25, 0.95),
    });
  }
}

function claimSystem(systemId, owner, options = {}) {
  const system = state.systems[systemId];
  system.owner = owner;
  system.starbase = {
    owner,
    level: options.home ? 2 : 1,
    defense: options.home ? 10 : 5,
  };
  system.surveyedBy[owner] = true;
  if (owner === "player" || options.reveal) {
    system.known = true;
    system.surveyedBy.player = true;
    for (const neighbor of system.hyperlanes) state.systems[neighbor].known = true;
  }
}

function systemDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function dateLabel(month = state.month) {
  return `${MONTHS[month % 12]} ${2200 + Math.floor(month / 12)}`;
}

function addLog(text, type = "") {
  state.logs.unshift({ text, type, month: state.month });
  if (state.logs.length > 90) state.logs.pop();
}

function toast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2400);
}

function updateKnownFromBorders() {
  for (const system of state.systems) {
    if (system.owner === "player") {
      system.known = true;
      system.surveyedBy.player = true;
      for (const neighbor of system.hyperlanes) state.systems[neighbor].known = true;
    }
  }
}

function discoverContacts() {
  for (const system of state.systems) {
    if (!system.owner || system.owner === "player" || system.owner === "pirates") continue;
    const visible =
      system.known ||
      system.surveyedBy.player ||
      system.hyperlanes.some((neighbor) => state.systems[neighbor].owner === "player");
    if (visible) makeContact(system.owner);
  }
}

function makeContact(empireId) {
  const contact = state.contacts[empireId];
  if (!contact || contact.met) return;
  contact.met = true;
  contact.relation += Math.floor(randRange(-8, 9));
  addLog(`First contact established with the ${state.empires[empireId].name}.`, "major");
  toast(`First contact: ${state.empires[empireId].name}`);
}

function drawTechChoices() {
  const taken = new Set(state.tech.known);
  if (state.tech.active) taken.add(state.tech.active.id);
  const pool = TECH_LIBRARY.filter((tech) => !taken.has(tech.id));
  const choices = [];
  while (pool.length && choices.length < 3) {
    const index = Math.floor(state.rng() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

function chooseTech(id, silent = false) {
  const tech = TECH_LIBRARY.find((item) => item.id === id);
  if (!tech || state.tech.known.includes(id)) return;
  state.tech.active = tech;
  state.tech.progress = 0;
  state.tech.choices = state.tech.choices.filter((choice) => choice.id !== id);
  if (!silent) addLog(`Research begins: ${tech.name}.`, "science");
  updateUI();
}

function tickMonth() {
  if (state.modal || state.victory?.ended) return;
  state.month += 1;

  processIncome();
  processResearch();
  processBuildQueue();
  updateFleets();
  processAI();
  updateKnownFromBorders();
  discoverContacts();
  processRandomEvents();
  checkVictory();
  updateUI();
}

function processIncome() {
  const income = computeIncome("player");
  state.lastIncome = income;
  for (const key of RESOURCE_ORDER) {
    if (key === "research") continue;
    state.resources[key] = Math.max(0, state.resources[key] + income[key]);
  }

  for (const empire of Object.values(state.empires)) {
    if (empire.id === "player") continue;
    const aiIncome = computeIncome(empire.id);
    for (const key of RESOURCE_ORDER) {
      if (key === "research") continue;
      empire.stockpile[key] = Math.max(0, empire.stockpile[key] + aiIncome[key]);
    }
  }
}

function computeIncome(owner) {
  const isPlayer = owner === "player";
  const income = createEmptyResources({
    energy: isPlayer ? 12 : 10,
    minerals: isPlayer ? 10 : 9,
    alloys: isPlayer ? 5 : 4,
    influence: isPlayer ? 3 + state.modifiers.influence : 2.8,
    unity: isPlayer ? 4 : 3,
    research: isPlayer ? 9 : 8,
  });

  const systems = state.systems.filter((system) => system.owner === owner);
  for (const system of systems) {
    if (system.starbase) income.energy -= system.starbase.level === 2 ? 1.5 : 0.6;
    if (system.stations.mining) {
      income.energy += system.deposits.energy * 2.2 * (1 + (isPlayer ? state.modifiers.stationEnergy : 0));
      income.minerals += system.deposits.minerals * 2.4 * (1 + (isPlayer ? state.modifiers.stationMinerals : 0));
    }
    if (system.stations.research) {
      income.research += system.deposits.research * 2.6 * (1 + (isPlayer ? state.modifiers.stationResearch : 0));
    }
    if (system.colony && system.colony.owner === owner) {
      const colony = system.colony;
      const habitability = getHabitability(system);
      income.energy += colony.pops * 0.8 + colony.buildings.generator * 5.5;
      income.minerals +=
        colony.pops * 0.72 + colony.buildings.mining * 5.7 * (1 + (isPlayer ? state.modifiers.miningDistricts : 0));
      income.alloys += colony.buildings.foundry * 3.4 + Math.max(0, colony.pops - 5) * 0.18;
      income.research += colony.buildings.lab * 4.4 * (1 + (isPlayer ? state.modifiers.labs : 0));
      income.unity += colony.buildings.city * 2.1 + colony.pops * 0.24;
      income.energy -= (1 - habitability) * colony.pops * 0.3;
    }
  }

  const fleets = state.fleets.filter((fleet) => fleet.owner === owner);
  const upkeepMod = isPlayer ? state.modifiers.shipUpkeep : 0;
  for (const fleet of fleets) {
    if (fleet.role === "navy") {
      income.energy -= fleet.ships * (0.45 + upkeepMod);
      income.alloys -= fleet.ships * 0.06;
    } else {
      income.energy -= 0.65;
    }
  }

  const sprawl = getEmpireSprawl(owner);
  if (isPlayer && sprawl > 36) {
    const penalty = 1 - Math.min(0.34, (sprawl - 36) / 190) * (1 - state.modifiers.sprawl);
    income.research *= penalty;
    income.unity *= penalty;
  }

  if (isPlayer) income.unity *= 1 + state.modifiers.unity;

  for (const key of RESOURCE_ORDER) {
    income[key] = Math.round(income[key] * 10) / 10;
  }
  return income;
}

function getEmpireSprawl(owner) {
  const owned = state.systems.filter((system) => system.owner === owner).length;
  const colonies = state.systems.filter((system) => system.colony?.owner === owner).length;
  return owned * 2 + colonies * 6;
}

function getHabitability(system) {
  return clamp((system.planet?.habitability || 0) + state.modifiers.habitability, 0, 0.95);
}

function processResearch() {
  const active = state.tech.active;
  if (!active) return;
  state.tech.progress += Math.max(0, state.lastIncome.research);
  state.resources.research = state.tech.progress;
  if (state.tech.progress >= active.cost) {
    active.apply();
    state.tech.known.push(active.id);
    addLog(`Research complete: ${active.name}.`, "science");
    state.tech.active = null;
    state.tech.progress = 0;
    state.resources.research = 0;
    state.tech.choices = drawTechChoices();
    if (state.tech.choices.length) {
      openDecision({
        kicker: "Research",
        title: "Research Completed",
        text: `${active.name} is now active across the Commonwealth. Select a new focus.`,
        options: state.tech.choices.map((choice) => ({
          label: choice.name,
          text: `${choice.field}: ${choice.text}`,
          effect: () => chooseTech(choice.id),
        })),
      });
    }
  }
}

function processBuildQueue() {
  const complete = [];
  for (const item of state.buildQueue) {
    item.remaining -= 1;
    if (item.remaining <= 0) complete.push(item);
  }
  state.buildQueue = state.buildQueue.filter((item) => item.remaining > 0);
  for (const item of complete) completeBuild(item);
}

function completeBuild(item) {
  const system = state.systems[item.systemId];
  if (item.type === "planet") {
    if (!system?.colony || system.colony.owner !== item.owner) return;
    system.colony.buildings[item.building] += 1;
    addLog(`${PLANET_BUILDS[item.building].label} district completed on ${system.colony.name}.`);
  }
  if (item.type === "colony") {
    if (!system || system.owner !== item.owner || system.colony) return;
    system.colony = createColony(item.owner, system.planet, false);
    addLog(`${system.planet.name} is now a Commonwealth colony.`, "major");
  }
  if (item.type === "ship") {
    const fleet = getPlayerNavy();
    fleet.strength += item.strength * (1 + state.modifiers.fleetPower);
    fleet.ships += item.ships;
    addLog(`${item.label} joins ${fleet.name}.`);
  }
}

function updateFleets() {
  for (const fleet of state.fleets) {
    if (!fleet.route.length) continue;
    fleet.progress += fleet.speed * (1 + (fleet.owner === "player" ? state.modifiers.shipSpeed : 0));
    if (fleet.role === "science" && fleet.owner === "player") fleet.progress += state.modifiers.surveySpeed;
    while (fleet.route.length && fleet.progress >= fleet.segmentMonths) {
      fleet.progress -= fleet.segmentMonths;
      fleet.location = fleet.route.shift();
      if (fleet.route.length) {
        fleet.segmentMonths = segmentTime(fleet.location, fleet.route[0], fleet);
      } else {
        fleet.progress = 0;
        finishFleetOrder(fleet);
      }
    }
  }
}

function finishFleetOrder(fleet) {
  const target = state.systems[fleet.target ?? fleet.location];
  const order = fleet.order;
  fleet.order = "idle";
  fleet.target = null;

  if (!target) return;

  if (order === "survey") finishSurvey(fleet, target);
  if (order === "build-outpost") finishOutpost(target);
  if (order === "build-mining") finishStation(target, "mining");
  if (order === "build-research") finishStation(target, "research");
  if (order === "attack") resolvePlayerAttack(fleet, target);
  if (order === "hunt-pirates") resolvePirateHunt(fleet, target);
  if (order === "ai-attack") resolveAIAttack(fleet, target);
}

function finishSurvey(fleet, system) {
  system.known = true;
  system.surveyedBy.player = true;
  for (const neighbor of system.hyperlanes) state.systems[neighbor].known = true;
  addLog(`${fleet.name} completes a survey of ${system.name}.`, "science");

  if (system.anomaly && !system.anomalyResolved && state.rng() < 0.72) {
    openAnomaly(system);
  }
}

function openAnomaly(system) {
  system.anomalyResolved = true;
  const riskyBonus = Math.floor(randRange(85, 155));
  const safeBonus = Math.floor(riskyBonus * 0.56);
  openDecision({
    kicker: "Anomaly",
    title: `${system.name}: ${capitalize(system.anomaly)}`,
    text: anomalyText(system.anomaly),
    options: [
      {
        label: "Conservative Study",
        text: `Gain ${safeBonus} research.`,
        effect: () => {
          state.tech.progress += safeBonus;
          state.resources.research = state.tech.progress;
          addLog(`The ${system.name} anomaly yields a controlled research cache.`, "science");
        },
      },
      {
        label: "Aggressive Exploitation",
        text: `Gain more, with risk.`,
        effect: () => {
          const safe = state.rng() < 0.58 + state.modifiers.anomalySafety;
          if (safe) {
            state.tech.progress += riskyBonus;
            state.resources.minerals += Math.floor(riskyBonus * 0.32);
            addLog(`A bold anomaly project in ${system.name} pays off.`, "science");
          } else {
            const fleet = getFleetByRole("science");
            fleet.progress = 0;
            fleet.order = "idle";
            state.resources.energy = Math.max(0, state.resources.energy - 65);
            addLog(`The ${system.name} anomaly lashes the survey team and drains emergency reserves.`, "war");
          }
        },
      },
    ],
  });
}

function anomalyText(type) {
  const text = {
    "precursor vault":
      "A sealed orbital archive answers to no living language, but its power systems still respond to careful prompts.",
    "living crystal reef":
      "Mineral structures in the outer belt pulse like a nervous system and react to active scanners.",
    "subspace echo":
      "A repeating signal arrives before it is sent, folding local time into a narrow wake.",
    "derelict habitat":
      "A silent ring habitat drifts above a dead world, its life support cycling in patient darkness.",
    "singularity trace":
      "A tiny gravitational scar suggests that something massive passed through this system very quickly.",
    "orbital ossuary":
      "Thousands of identical capsules orbit the star in ceremonial formation.",
  };
  return text[type] || "The survey team has found something that refuses to fit existing catalogues.";
}

function finishOutpost(system) {
  if (system.owner) {
    addLog(`Construction crews arrive at ${system.name}, but the system is no longer open.`);
    return;
  }
  claimSystem(system.id, "player", { reveal: true });
  addLog(`Outpost established in ${system.name}.`, "major");
}

function finishStation(system, kind) {
  if (system.owner !== "player" || system.stations[kind]) return;
  system.stations[kind] = true;
  addLog(`${kind === "mining" ? "Mining" : "Research"} station online in ${system.name}.`);
}

function segmentTime(fromId, toId, fleet) {
  const distance = systemDistance(state.systems[fromId], state.systems[toId]);
  const roleMod = fleet.role === "science" ? 0.82 : fleet.role === "navy" ? 0.95 : 1;
  return clamp((distance / 235) * roleMod, 0.85, 3.8);
}

function setFleetCourse(fleet, targetId, order) {
  const route = routeBetween(fleet.location, targetId, fleet.owner);
  if (!route || route.length < 2) {
    toast("No known route.");
    return false;
  }
  fleet.route = route.slice(1);
  fleet.target = targetId;
  fleet.order = order;
  fleet.progress = 0;
  fleet.segmentMonths = segmentTime(fleet.location, fleet.route[0], fleet);
  return true;
}

function routeBetween(startId, endId, owner = "player") {
  if (startId === endId) return [startId];
  const queue = [startId];
  const seen = new Set([startId]);
  const parent = new Map();
  while (queue.length) {
    const current = queue.shift();
    for (const next of state.systems[current].hyperlanes) {
      if (seen.has(next)) continue;
      const nextSystem = state.systems[next];
      const allowed =
        owner !== "player" ||
        next === endId ||
        nextSystem.known ||
        nextSystem.surveyedBy.player ||
        nextSystem.owner === "player";
      if (!allowed) continue;
      seen.add(next);
      parent.set(next, current);
      if (next === endId) {
        const path = [endId];
        let cursor = endId;
        while (parent.has(cursor)) {
          cursor = parent.get(cursor);
          path.push(cursor);
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

function processAI() {
  for (const empire of Object.values(state.empires)) {
    if (empire.id === "player") continue;
    empire.aiTimer -= 1;
    if (empire.aiTimer <= 0) {
      aiTakeTurn(empire);
      empire.aiTimer = Math.max(3, Math.round(empire.expansion + randRange(-2, 3)));
    }
    processDiplomaticDrift(empire);
  }
}

function aiTakeTurn(empire) {
  const contact = state.contacts[empire.id];
  const fleet = state.fleets.find((item) => item.owner === empire.id && item.role === "navy");

  if (fleet && fleet.order === "idle" && contact?.war && state.rng() < 0.7) {
    aiLaunchAttack(empire, fleet);
    return;
  }

  if (empire.stockpile.alloys > 170 && fleet) {
    empire.stockpile.alloys -= 115;
    fleet.strength += randRange(4, 8);
    fleet.ships += 1;
  }

  const frontier = getEmpireFrontier(empire.id);
  if (frontier.length && empire.stockpile.influence > 50 && empire.stockpile.alloys > 75) {
    const target = frontier.sort((a, b) => scoreSystemForEmpire(b) - scoreSystemForEmpire(a))[0];
    empire.stockpile.influence -= 50;
    empire.stockpile.alloys -= 75;
    claimSystem(target.id, empire.id, { reveal: false });
    if (target.planet && !target.colony && state.rng() < 0.2 + target.planet.habitability * 0.45) {
      target.colony = createColony(empire.id, target.planet, false);
    }
    if (target.known || target.hyperlanes.some((id) => state.systems[id].owner === "player")) {
      addLog(`${empire.name} plants an outpost in ${target.name}.`);
      makeContact(empire.id);
    }
  }
}

function processDiplomaticDrift(empire) {
  const contact = state.contacts[empire.id];
  if (!contact?.met) return;
  if (contact.truce > 0) contact.truce -= 1;

  const border = borderFriction(empire.id);
  const playerPower = getFleetPower("player") + getOwnedDefense("player") * 0.2;
  const aiPower = getFleetPower(empire.id) + getOwnedDefense(empire.id) * 0.2;
  const powerFear = aiPower > playerPower * 1.25 ? -0.3 : 0.18;
  contact.relation = clamp(contact.relation + empire.attitude * 0.01 - border * 0.12 + powerFear, -100, 100);

  if (contact.war) {
    contact.exhaustion = clamp(contact.exhaustion + 0.65 + border * 0.1, 0, 100);
    return;
  }

  const wantsWar =
    contact.truce <= 0 &&
    contact.relation < -72 &&
    border > 0 &&
    aiPower > playerPower * (0.72 + empire.aggression * 0.34) &&
    state.rng() < empire.aggression * 0.08;
  if (wantsWar) declareWar(empire.id, false);
}

function aiLaunchAttack(empire, fleet) {
  const playerSystems = state.systems.filter((system) => system.owner === "player");
  if (!playerSystems.length) return;
  const enemySystems = state.systems.filter((system) => system.owner === empire.id);
  const target = playerSystems
    .map((system) => ({
      system,
      score:
        (system.colony ? 35 : 0) +
        (system.starbase?.level || 0) * 7 -
        Math.min(...enemySystems.map((own) => systemDistance(system, own))) / 80,
    }))
    .sort((a, b) => b.score - a.score)[0]?.system;
  if (target && setFleetCourse(fleet, target.id, "ai-attack")) {
    if (target.known) addLog(`${empire.name} dispatches a strike force toward ${target.name}.`, "war");
  }
}

function getEmpireFrontier(owner) {
  const frontier = new Map();
  for (const system of state.systems) {
    if (system.owner !== owner) continue;
    for (const neighbor of system.hyperlanes) {
      const target = state.systems[neighbor];
      if (!target.owner) frontier.set(target.id, target);
    }
  }
  return [...frontier.values()];
}

function scoreSystemForEmpire(system) {
  const deposits = system.deposits.energy + system.deposits.minerals * 1.15 + system.deposits.research * 1.2;
  const planet = system.planet ? 8 + system.planet.size * 0.35 + system.planet.habitability * 13 : 0;
  const danger = system.danger * 0.6;
  return deposits + planet - danger;
}

function borderFriction(empireId) {
  let friction = 0;
  for (const system of state.systems) {
    if (system.owner !== "player") continue;
    for (const neighbor of system.hyperlanes) {
      if (state.systems[neighbor].owner === empireId) friction += 1;
    }
  }
  return friction;
}

function processRandomEvents() {
  growColonies();
  if (state.month > 20 && state.month % 15 === 0 && state.piratesSpawned < 4 && state.rng() < 0.5) {
    spawnPirates();
  }
}

function growColonies() {
  for (const system of state.systems) {
    if (!system.colony) continue;
    const colony = system.colony;
    const habitability = system.owner === "player" ? getHabitability(system) : system.planet.habitability;
    const growthRate = (0.19 + habitability * 0.18 + colony.buildings.city * 0.035) * (1 + state.modifiers.growth);
    colony.growth += growthRate;
    if (colony.growth >= 1) {
      colony.growth -= 1;
      colony.pops += 1;
      colony.stability = clamp(colony.stability + 1, 35, 90);
      if (system.owner === "player") addLog(`${colony.name} gains a new pop.`);
    }
  }
}

function spawnPirates() {
  const candidates = state.systems.filter(
    (system) =>
      system.known &&
      system.owner !== "player" &&
      !state.fleets.some((fleet) => fleet.owner === "pirates" && fleet.location === system.id)
  );
  if (!candidates.length) return;
  const system = candidates.sort((a, b) => distanceToPlayer(a) - distanceToPlayer(b))[Math.floor(randRange(0, Math.min(8, candidates.length)))];
  const strength = Math.floor(randRange(7, 15) + state.month / 18);
  state.fleets.push({
    id: `pirates-${state.month}-${state.piratesSpawned}`,
    name: "Freebooter Pack",
    owner: "pirates",
    role: "navy",
    location: system.id,
    route: [],
    progress: 0,
    segmentMonths: 1,
    order: "idle",
    target: null,
    strength,
    ships: Math.max(2, Math.round(strength / 4)),
    speed: 0.95,
  });
  state.piratesSpawned += 1;
  addLog(`Raiders are detected near ${system.name}.`, "war");
}

function distanceToPlayer(system) {
  const owned = state.systems.filter((item) => item.owner === "player");
  return Math.min(...owned.map((item) => systemDistance(system, item)));
}

function checkVictory() {
  if (state.victory) return;
  const playerSystems = state.systems.filter((system) => system.owner === "player").length;
  const playerColonies = state.systems.filter((system) => system.colony?.owner === "player").length;
  const rivalsWithCapitals = EMPIRE_TEMPLATES.filter((template) => {
    const homeId = state.empires[template.id].homeSystemId;
    return state.systems[homeId]?.owner === template.id;
  });

  if (playerSystems >= 34 || playerColonies >= 8 || rivalsWithCapitals.length === 0) {
    state.victory = { ended: false };
    state.running = false;
    openDecision({
      kicker: "Victory",
      title: "The Commonwealth Ascendant",
      text: "Your polity has become the central power of this spiral arm through expansion, colonization, and force projection.",
      options: [
        {
          label: "Continue",
          text: "Remain in command.",
          effect: () => {
            state.victory.ended = false;
          },
        },
      ],
    });
  }

  const home = state.systems[state.empires.player.homeSystemId];
  if (home.owner !== "player") {
    state.victory = { ended: true };
    state.running = false;
    openDecision({
      kicker: "Defeat",
      title: "Capital Lost",
      text: "Aurelia has fallen. The Senate evacuates into the void, and the Commonwealth fractures.",
      options: [
        {
          label: "New Galaxy",
          text: "Begin again.",
          effect: () => newGame(),
        },
      ],
    });
  }
}

function canAfford(cost, owner = "player") {
  const stockpile = owner === "player" ? state.resources : state.empires[owner].stockpile;
  return Object.entries(cost).every(([key, value]) => stockpile[key] >= value);
}

function spend(cost, owner = "player") {
  if (!canAfford(cost, owner)) return false;
  const stockpile = owner === "player" ? state.resources : state.empires[owner].stockpile;
  for (const [key, value] of Object.entries(cost)) stockpile[key] -= value;
  return true;
}

function scaledCost(cost, modifier) {
  const scaled = {};
  for (const [key, value] of Object.entries(cost)) scaled[key] = Math.max(1, Math.round(value * modifier));
  return scaled;
}

function costText(cost) {
  return Object.entries(cost)
    .map(([key, value]) => `${fmt(value)} ${RESOURCE_META[key].label}`)
    .join(", ");
}

function getFleetByRole(role) {
  return state.fleets.find((fleet) => fleet.owner === "player" && fleet.role === role);
}

function getPlayerNavy() {
  return getFleetByRole("navy");
}

function selectedSystem() {
  return state.systems[state.selectedSystemId] || null;
}

function selectedFleet() {
  return state.fleets.find((fleet) => fleet.id === state.selectedFleetId) || null;
}

function canSurvey(system) {
  const fleet = getFleetByRole("science");
  return Boolean(
    system &&
      system.known &&
      !system.surveyedBy.player &&
      fleet &&
      fleet.order === "idle" &&
      routeBetween(fleet.location, system.id, "player")
  );
}

function canBuildOutpost(system) {
  const fleet = getFleetByRole("constructor");
  const cost = getOutpostCost();
  return Boolean(
    system &&
      system.surveyedBy.player &&
      !system.owner &&
      adjacentToPlayer(system) &&
      fleet &&
      fleet.order === "idle" &&
      canAfford(cost) &&
      routeBetween(fleet.location, system.id, "player")
  );
}

function getOutpostCost() {
  return scaledCost({ influence: 58, alloys: 82 }, 1 + state.modifiers.outpostCost);
}

function adjacentToPlayer(system) {
  return system.hyperlanes.some((id) => state.systems[id].owner === "player");
}

function commandSurvey(systemId) {
  const system = state.systems[systemId];
  const fleet = getFleetByRole("science");
  if (!canSurvey(system)) return toast("Science ship is not ready for that survey.");
  if (setFleetCourse(fleet, system.id, "survey")) {
    addLog(`${fleet.name} departs to survey ${system.name}.`, "science");
  }
  updateUI();
}

function commandBuildOutpost(systemId) {
  const system = state.systems[systemId];
  const fleet = getFleetByRole("constructor");
  const cost = getOutpostCost();
  if (!canBuildOutpost(system)) return toast("Outpost requirements are not met.");
  spend(cost);
  if (setFleetCourse(fleet, system.id, "build-outpost")) {
    addLog(`${fleet.name} begins an outpost mission to ${system.name}.`);
  }
  updateUI();
}

function commandBuildStation(systemId, kind) {
  const system = state.systems[systemId];
  const fleet = getFleetByRole("constructor");
  const cost = kind === "mining" ? { minerals: 86 } : { minerals: 104 };
  const hasDeposits =
    kind === "mining" ? system.deposits.energy + system.deposits.minerals > 0 : system.deposits.research > 0;
  if (
    !system ||
    system.owner !== "player" ||
    !system.surveyedBy.player ||
    system.stations[kind] ||
    !hasDeposits ||
    !fleet ||
    fleet.order !== "idle" ||
    !canAfford(cost)
  ) {
    return toast("Station requirements are not met.");
  }
  spend(cost);
  if (setFleetCourse(fleet, system.id, kind === "mining" ? "build-mining" : "build-research")) {
    addLog(`${fleet.name} is assigned to ${system.name}.`);
  }
  updateUI();
}

function commandColonize(systemId) {
  const system = state.systems[systemId];
  const cost = scaledCost({ energy: 110, minerals: 185, influence: 36 }, 1 + state.modifiers.colonyCost);
  if (!system || system.owner !== "player" || !system.planet || system.colony || !canAfford(cost)) {
    return toast("Colony mission requirements are not met.");
  }
  spend(cost);
  state.buildQueue.push({
    id: `colony-${system.id}-${state.month}`,
    type: "colony",
    owner: "player",
    systemId: system.id,
    label: `Colony ship to ${system.planet.name}`,
    remaining: 12,
    total: 12,
  });
  addLog(`A colony ship is launched toward ${system.planet.name}.`, "major");
  updateUI();
}

function commandBuildPlanet(systemId, building) {
  const system = state.systems[systemId];
  const build = PLANET_BUILDS[building];
  if (!system?.colony || system.colony.owner !== "player" || !build || !canAfford(build.cost)) {
    return toast("Planetary project requirements are not met.");
  }
  spend(build.cost);
  state.buildQueue.push({
    id: `planet-${building}-${system.id}-${state.month}`,
    type: "planet",
    owner: "player",
    systemId: system.id,
    building,
    label: `${build.label} on ${system.colony.name}`,
    remaining: build.months,
    total: build.months,
  });
  addLog(`${build.label} district queued on ${system.colony.name}.`);
  updateUI();
}

function commandBuildShip(shipKey) {
  const ship = SHIP_BUILDS[shipKey];
  if (!ship || (ship.requires && !state.unlocks[ship.requires]) || !canAfford(ship.cost)) {
    return toast("Shipyard requirements are not met.");
  }
  spend(ship.cost);
  state.buildQueue.push({
    id: `ship-${shipKey}-${state.month}-${state.buildQueue.length}`,
    type: "ship",
    owner: "player",
    systemId: state.empires.player.homeSystemId,
    label: ship.label,
    remaining: ship.months,
    total: ship.months,
    strength: ship.strength,
    ships: ship.ships,
  });
  addLog(`${ship.label} laid down at Aurelia Shipyard.`);
  updateUI();
}

function commandAttack(systemId) {
  const system = state.systems[systemId];
  const fleet = getPlayerNavy();
  if (!system || !fleet || fleet.order !== "idle") return toast("Fleet is not ready.");

  const pirateFleet = state.fleets.find((item) => item.owner === "pirates" && item.location === system.id);
  if (pirateFleet) {
    if (setFleetCourse(fleet, system.id, "hunt-pirates")) addLog(`${fleet.name} moves to clear raiders at ${system.name}.`, "war");
    updateUI();
    return;
  }

  if (!system.owner || system.owner === "player") return toast("No hostile target selected.");
  const contact = state.contacts[system.owner];
  if (!contact?.war) return toast("War has not been declared.");
  if (setFleetCourse(fleet, system.id, "attack")) {
    addLog(`${fleet.name} receives attack orders for ${system.name}.`, "war");
  }
  updateUI();
}

function declareWar(empireId, playerStarted = true) {
  const contact = state.contacts[empireId];
  if (!contact || contact.war || contact.truce > 0) return;
  contact.met = true;
  contact.war = true;
  contact.exhaustion = 0;
  contact.relation = clamp(contact.relation - (playerStarted ? 28 : 18), -100, 100);
  addLog(
    `${playerStarted ? "The Commonwealth declares war on" : state.empires[empireId].name + " declares war on"} ${
      playerStarted ? state.empires[empireId].name : "the Commonwealth"
    }.`,
    "war"
  );
  toast(`War: ${state.empires[empireId].name}`);
  updateUI();
}

function improveRelations(empireId) {
  const cost = scaledCost({ influence: 28, unity: 35 }, 1 + state.modifiers.diplomacyCost);
  const contact = state.contacts[empireId];
  if (!contact?.met || contact.war || !canAfford(cost)) return toast("Embassy requirements are not met.");
  spend(cost);
  contact.relation = clamp(contact.relation + 18 + randRange(0, 8), -100, 100);
  addLog(`Envoys open a durable channel with the ${state.empires[empireId].name}.`);
  updateUI();
}

function rivalEmpire(empireId) {
  const contact = state.contacts[empireId];
  if (!contact?.met || contact.war) return;
  contact.relation = clamp(contact.relation - 24, -100, 100);
  state.resources.influence += 35;
  addLog(`The Senate names the ${state.empires[empireId].name} a strategic rival.`, "major");
  updateUI();
}

function negotiateTruce(empireId) {
  const contact = state.contacts[empireId];
  if (!contact?.war) return;
  const playerPower = getFleetPower("player");
  const theirPower = getFleetPower(empireId);
  if (contact.exhaustion < 38 && playerPower < theirPower * 1.4) return toast("They are not ready to bargain.");
  contact.war = false;
  contact.truce = 36;
  contact.relation = clamp(contact.relation - 8, -100, 100);
  contact.exhaustion = 0;
  addLog(`A truce is signed with the ${state.empires[empireId].name}.`, "major");
  updateUI();
}

function resolvePlayerAttack(fleet, system) {
  if (!system.owner || system.owner === "player") return;
  const contact = state.contacts[system.owner];
  if (!contact?.war) return;
  const defender = system.owner;
  const defense = getSystemDefense(system, defender);
  const attackRoll = fleet.strength * randRange(0.78, 1.25);
  const defenseRoll = defense * randRange(0.82, 1.22);
  if (attackRoll >= defenseRoll) {
    const oldOwner = system.owner;
    const lossFactor = clamp((defenseRoll / Math.max(attackRoll, 1)) * (0.34 - state.modifiers.combatSurvival), 0.04, 0.42);
    fleet.strength = Math.max(2, fleet.strength * (1 - lossFactor));
    claimCapturedSystem(system, "player");
    contact.exhaustion = clamp(contact.exhaustion + 18 + (system.colony ? 16 : 0), 0, 100);
    addLog(`${fleet.name} captures ${system.name} from the ${state.empires[oldOwner].name}.`, "war");
  } else {
    fleet.strength = Math.max(1, fleet.strength * randRange(0.46, 0.68));
    fleet.ships = Math.max(1, Math.round(fleet.ships * 0.72));
    retreatFleet(fleet);
    contact.exhaustion = clamp(contact.exhaustion + 8, 0, 100);
    addLog(`${fleet.name} is forced back from ${system.name}.`, "war");
  }
}

function resolveAIAttack(fleet, system) {
  if (system.owner !== "player") return;
  const contact = state.contacts[fleet.owner];
  if (!contact?.war) return;
  const defense = getSystemDefense(system, "player");
  const attackRoll = fleet.strength * randRange(0.78, 1.25);
  const defenseRoll = defense * randRange(0.82, 1.24);
  if (attackRoll >= defenseRoll) {
    const lossFactor = clamp(defenseRoll / Math.max(attackRoll, 1) * 0.33, 0.06, 0.44);
    fleet.strength = Math.max(2, fleet.strength * (1 - lossFactor));
    claimCapturedSystem(system, fleet.owner);
    contact.exhaustion = clamp(contact.exhaustion + 10, 0, 100);
    addLog(`${state.empires[fleet.owner].name} captures ${system.name}.`, "war");
  } else {
    fleet.strength = Math.max(2, fleet.strength * randRange(0.52, 0.76));
    retreatFleet(fleet);
    contact.exhaustion = clamp(contact.exhaustion + 14, 0, 100);
    addLog(`${state.empires[fleet.owner].name} is repelled at ${system.name}.`, "war");
  }
}

function resolvePirateHunt(fleet, system) {
  const pirate = state.fleets.find((item) => item.owner === "pirates" && item.location === system.id);
  if (!pirate) return addLog(`${fleet.name} finds no raiders in ${system.name}.`);
  const attackRoll = fleet.strength * randRange(0.78, 1.26);
  const pirateRoll = pirate.strength * randRange(0.82, 1.2);
  if (attackRoll >= pirateRoll) {
    fleet.strength = Math.max(2, fleet.strength - pirate.strength * 0.16);
    state.resources.unity += 24;
    state.resources.energy += 42;
    state.fleets = state.fleets.filter((item) => item.id !== pirate.id);
    addLog(`${fleet.name} destroys raiders at ${system.name}.`, "war");
  } else {
    fleet.strength = Math.max(1, fleet.strength * 0.62);
    pirate.strength = Math.max(2, pirate.strength * 0.74);
    retreatFleet(fleet);
    addLog(`${fleet.name} takes heavy losses against raiders in ${system.name}.`, "war");
  }
}

function claimCapturedSystem(system, owner) {
  const previous = system.owner;
  system.owner = owner;
  if (system.starbase) system.starbase.owner = owner;
  else system.starbase = { owner, level: 1, defense: 5 };
  system.surveyedBy[owner] = true;
  if (owner === "player") {
    system.known = true;
    system.surveyedBy.player = true;
  }
  if (system.colony) {
    system.colony.owner = owner;
    system.colony.stability = Math.max(35, system.colony.stability - 18);
  }
  if (previous === "player" && owner !== "player") {
    system.stations.mining = false;
    system.stations.research = false;
  }
}

function retreatFleet(fleet) {
  const home = state.empires[fleet.owner]?.homeSystemId ?? state.empires.player.homeSystemId;
  const owned = state.systems.filter((system) => system.owner === fleet.owner);
  const destination = owned.length
    ? owned.sort((a, b) => systemDistance(a, state.systems[fleet.location]) - systemDistance(b, state.systems[fleet.location]))[0].id
    : home;
  fleet.location = destination;
  fleet.route = [];
  fleet.progress = 0;
  fleet.target = null;
  fleet.order = "idle";
}

function getSystemDefense(system, owner) {
  let defense = 0;
  if (system.starbase?.owner === owner) {
    defense += system.starbase.defense + system.starbase.level * 3 + (owner === "player" ? state.modifiers.starbaseDefense : 0);
  }
  if (system.colony?.owner === owner) {
    defense += 4 + system.colony.pops * 1.6 + system.colony.buildings.city * 2;
  }
  for (const fleet of state.fleets) {
    if (fleet.owner === owner && fleet.role === "navy" && fleet.location === system.id && !fleet.route.length) {
      defense += fleet.strength;
    }
  }
  return Math.max(1, defense);
}

function getOwnedDefense(owner) {
  return state.systems
    .filter((system) => system.owner === owner)
    .reduce((sum, system) => sum + getSystemDefense(system, owner), 0);
}

function getFleetPower(owner) {
  return state.fleets
    .filter((fleet) => fleet.owner === owner && fleet.role === "navy")
    .reduce((sum, fleet) => sum + fleet.strength, 0);
}

function updateUI() {
  els.pauseBtn.textContent = state.running ? "II" : ">";
  els.speedBtn.textContent = `${state.speeds[state.speedIndex]}x`;
  els.dateLabel.textContent = dateLabel();
  renderResources();
  renderEmpirePanel();
  renderFleetPanel();
  renderResearchPanel();
  renderInspector();
  renderDiplomacy();
  renderLog();
  renderModal();
}

function renderResources() {
  els.resourceStrip.innerHTML = RESOURCE_ORDER.map((key) => {
    const meta = RESOURCE_META[key];
    const income = state.lastIncome[key] || 0;
    const value =
      key === "research" && state.tech.active
        ? `${fmt(state.tech.progress)}/${fmt(state.tech.active.cost)}`
        : fmt(state.resources[key]);
    return `
      <div class="resource-pill" title="${meta.label}">
        <span class="resource-dot" style="background:${meta.color}"></span>
        <span class="resource-name">${meta.label}</span>
        <span class="resource-value">${value}</span>
        <span class="resource-income ${income < 0 ? "negative" : ""}">${income >= 0 ? "+" : ""}${oneDecimal(income)}</span>
      </div>
    `;
  }).join("");
}

function renderEmpirePanel() {
  const systems = state.systems.filter((system) => system.owner === "player").length;
  const colonies = state.systems.filter((system) => system.colony?.owner === "player").length;
  const pops = state.systems
    .filter((system) => system.colony?.owner === "player")
    .reduce((sum, system) => sum + system.colony.pops, 0);
  const sprawl = getEmpireSprawl("player");
  const victory = Math.max(systems / 34, colonies / 8);
  const home = state.systems[state.empires.player.homeSystemId];
  const queue = state.buildQueue.slice(0, 5);

  els.empirePanel.innerHTML = `
    <div class="stat-grid">
      ${stat("Systems", systems)}
      ${stat("Colonies", colonies)}
      ${stat("Pops", pops)}
      ${stat("Sprawl", sprawl)}
    </div>
    <div class="subhead">Ascendancy</div>
    <div class="meter" title="Victory progress"><span style="width:${clamp(victory * 100, 4, 100)}%"></span></div>
    <div class="small-note" style="margin-top:7px">Control 34 systems, settle 8 colonies, or take every rival capital.</div>
    <div class="subhead">Shipyard</div>
    <div class="action-grid">
      ${shipButton("corvette")}
      ${shipButton("destroyer")}
    </div>
    <div class="subhead">Queue</div>
    <div class="queue-list">
      ${
        queue.length
          ? queue
              .map(
                (item) => `
          <div class="queue-row">
            <strong>${escapeHtml(item.label)}</strong>
            <div class="meter"><span style="width:${clamp(((item.total - item.remaining) / item.total) * 100, 2, 100)}%"></span></div>
            <div class="queue-meta">${item.remaining} months remaining</div>
          </div>
        `
              )
              .join("")
          : `<div class="empty-state">No active projects.</div>`
      }
    </div>
    <div class="subhead">Capital</div>
    <button class="fleet-chip" data-action="select-system" data-system="${home.id}">
      <span class="fleet-dot" style="background:${state.empires.player.color}"></span>
      <span><span class="fleet-name">${escapeHtml(home.name)}</span><span class="fleet-status">${escapeHtml(home.colony.name)}</span></span>
      <span class="mini-tag">Seat</span>
    </button>
  `;
}

function stat(label, value) {
  return `
    <div class="stat">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function shipButton(key) {
  const ship = SHIP_BUILDS[key];
  const locked = ship.requires && !state.unlocks[ship.requires];
  const disabled = locked || !canAfford(ship.cost);
  return `
    <button class="action-button" data-action="build-ship" data-ship="${key}" ${disabled ? "disabled" : ""} title="${escapeHtml(costText(ship.cost))}">
      ${escapeHtml(ship.label)}
    </button>
  `;
}

function renderFleetPanel() {
  const fleets = state.fleets.filter((fleet) => fleet.owner === "player");
  els.fleetPanel.innerHTML = `
    <div class="fleet-list">
      ${fleets
        .map((fleet) => {
          const loc = state.systems[fleet.location];
          const target = fleet.target !== null ? state.systems[fleet.target] : null;
          const status =
            fleet.order === "idle"
              ? `At ${loc.name}`
              : `${orderLabel(fleet.order)}${target ? `: ${target.name}` : ""}`;
          const color = fleet.role === "science" ? "#4fd1d8" : fleet.role === "constructor" ? "#d7c36a" : "#ec6a64";
          return `
            <button class="fleet-chip ${fleet.id === state.selectedFleetId ? "is-selected" : ""}" data-action="select-fleet" data-fleet="${fleet.id}">
              <span class="fleet-dot" style="background:${color}"></span>
              <span><span class="fleet-name">${escapeHtml(fleet.name)}</span><span class="fleet-status">${escapeHtml(status)}</span></span>
              <span class="mini-tag">${fleet.role === "navy" ? fmt(fleet.strength) : fleet.role}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function orderLabel(order) {
  return {
    "build-outpost": "Outpost",
    "build-mining": "Mining",
    "build-research": "Station",
    "hunt-pirates": "Raiders",
    "ai-attack": "Strike",
    attack: "Attack",
    survey: "Survey",
    idle: "Idle",
  }[order] || order;
}

function renderResearchPanel() {
  const active = state.tech.active;
  const activeHtml = active
    ? `
      <div class="system-header">
        <div class="system-title">${escapeHtml(active.name)}</div>
        <div class="system-subtitle">${escapeHtml(active.field)} - ${fmt(state.tech.progress)} / ${fmt(active.cost)}</div>
        <div class="meter"><span style="width:${clamp((state.tech.progress / active.cost) * 100, 3, 100)}%"></span></div>
      </div>
    `
    : `<div class="empty-state">No active focus.</div>`;

  const choices = state.tech.choices.length ? state.tech.choices : drawTechChoices();
  els.researchPanel.innerHTML = `
    ${activeHtml}
    <div class="subhead">Alternatives</div>
    <div class="choice-list">
      ${
        choices.length
          ? choices
              .map(
                (choice) => `
          <button class="choice-button" data-action="choose-tech" data-tech="${choice.id}">
            <span class="choice-title">${escapeHtml(choice.name)}</span>
            <span class="choice-text">${escapeHtml(choice.field)} - ${escapeHtml(choice.text)}</span>
          </button>
        `
              )
              .join("")
          : `<div class="empty-state">The research deck is complete.</div>`
      }
    </div>
  `;
}

function renderInspector() {
  const system = selectedSystem();
  if (!system) {
    els.selectedTag.textContent = "None";
    els.inspectorPanel.innerHTML = `<div class="empty-state">Select a star system.</div>`;
    return;
  }

  const known = system.known || system.surveyedBy.player || system.owner === "player";
  els.selectedTag.textContent = known ? system.name : "Uncharted";
  if (!known) {
    els.inspectorPanel.innerHTML = `
      <div class="system-header">
        <div class="system-title">Deep Space Signature</div>
        <div class="system-subtitle">Long-range observatories identify a stellar mass beyond surveyed lanes.</div>
      </div>
    `;
    return;
  }

  const owner = system.owner ? state.empires[system.owner] : null;
  const ownerName = owner ? owner.name : "Unclaimed";
  const surveyed = system.surveyedBy.player;
  const deposits = surveyed
    ? `${system.deposits.energy} energy, ${system.deposits.minerals} minerals, ${system.deposits.research} research`
    : "Unknown";
  const planet = system.planet
    ? `${system.planet.type}, size ${system.planet.size}, ${Math.round(getHabitability(system) * 100)}% habitability`
    : "No major colony site";
  const pirate = state.fleets.find((fleet) => fleet.owner === "pirates" && fleet.location === system.id);

  els.inspectorPanel.innerHTML = `
    <div class="system-header">
      <div class="system-title">${escapeHtml(system.name)}</div>
      <div class="system-subtitle">${escapeHtml(system.star.code)} class star - ${escapeHtml(planet)}</div>
      <div class="owner-line">
        <span class="mini-tag">${escapeHtml(ownerName)}</span>
        <span class="mini-tag">${surveyed ? "Surveyed" : "Unsurveyed"}</span>
        ${system.anomaly && !system.anomalyResolved ? `<span class="mini-tag">Anomaly</span>` : ""}
        ${pirate ? `<span class="mini-tag">Raiders ${fmt(pirate.strength)}</span>` : ""}
      </div>
      <div class="inline-stats">
        <span class="mini-tag">Deposits: ${escapeHtml(deposits)}</span>
        <span class="mini-tag">Defense: ${system.owner ? fmt(getSystemDefense(system, system.owner)) : "0"}</span>
      </div>
    </div>
    ${renderColonyBlock(system)}
    <div class="subhead">Orders</div>
    <div class="action-grid">
      ${actionButton("Survey", "survey-system", { system: system.id }, !canSurvey(system), "primary")}
      ${actionButton("Outpost", "build-outpost", { system: system.id }, !canBuildOutpost(system), "primary")}
      ${actionButton(
        "Mining Station",
        "build-mining",
        { system: system.id },
        !canBuildMining(system),
        ""
      )}
      ${actionButton(
        "Research Station",
        "build-research",
        { system: system.id },
        !canBuildResearch(system),
        ""
      )}
      ${actionButton("Colonize", "colonize", { system: system.id }, !canColonize(system), "primary")}
      ${actionButton("Attack", "attack-system", { system: system.id }, !canAttack(system), "danger")}
    </div>
  `;
}

function renderColonyBlock(system) {
  if (!system.colony || system.colony.owner !== "player") {
    if (system.colony) {
      return `
        <div class="subhead">Colony</div>
        <div class="colony-row">
          <strong>${escapeHtml(system.colony.name)}</strong>
          <div class="queue-meta">Foreign colony - ${fmt(system.colony.pops)} pops</div>
        </div>
      `;
    }
    return "";
  }
  const colony = system.colony;
  return `
    <div class="subhead">Colony</div>
    <div class="colony-row">
      <strong>${escapeHtml(colony.name)}</strong>
      <div class="inline-stats">
        <span class="mini-tag">${fmt(colony.pops)} pops</span>
        <span class="mini-tag">${fmt(colony.stability)} stability</span>
        <span class="mini-tag">${Math.round(colony.growth * 100)}% growth</span>
      </div>
      <div class="action-grid">
        ${Object.entries(PLANET_BUILDS)
          .map(([key, build]) =>
            actionButton(build.label, "build-planet", { system: system.id, building: key }, !canAfford(build.cost), "")
          )
          .join("")}
      </div>
    </div>
  `;
}

function actionButton(label, action, data, disabled, tone = "") {
  const attrs = Object.entries(data)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(" ");
  return `<button class="action-button ${tone}" data-action="${action}" ${attrs} ${disabled ? "disabled" : ""}>${escapeHtml(label)}</button>`;
}

function canBuildMining(system) {
  const fleet = getFleetByRole("constructor");
  return Boolean(
    system &&
      system.owner === "player" &&
      system.surveyedBy.player &&
      !system.stations.mining &&
      system.deposits.energy + system.deposits.minerals > 0 &&
      fleet?.order === "idle" &&
      canAfford({ minerals: 86 })
  );
}

function canBuildResearch(system) {
  const fleet = getFleetByRole("constructor");
  return Boolean(
    system &&
      system.owner === "player" &&
      system.surveyedBy.player &&
      !system.stations.research &&
      system.deposits.research > 0 &&
      fleet?.order === "idle" &&
      canAfford({ minerals: 104 })
  );
}

function canColonize(system) {
  const cost = scaledCost({ energy: 110, minerals: 185, influence: 36 }, 1 + state.modifiers.colonyCost);
  return Boolean(system && system.owner === "player" && system.planet && !system.colony && canAfford(cost));
}

function canAttack(system) {
  const fleet = getPlayerNavy();
  if (!system || !fleet || fleet.order !== "idle") return false;
  if (state.fleets.some((item) => item.owner === "pirates" && item.location === system.id)) return true;
  if (!system.owner || system.owner === "player") return false;
  return Boolean(state.contacts[system.owner]?.war);
}

function renderDiplomacy() {
  const contacts = Object.values(state.contacts).filter((contact) => contact.met);
  els.diplomacyPanel.innerHTML = `
    <div class="contact-list">
      ${
        contacts.length
          ? contacts
              .map((contact) => {
                const empire = state.empires[Object.keys(state.contacts).find((id) => state.contacts[id] === contact)];
                const relation = Math.round(contact.relation);
                const color = contact.war ? "#ec6a64" : relation > 20 ? "#67d38f" : relation < -35 ? "#f2b84b" : "#c5d5dc";
                return `
          <div class="contact-row">
            <div>
              <div class="contact-name" style="color:${empire.color}">${escapeHtml(empire.name)}</div>
              <div class="contact-meta">Relations ${relation} - Power ${fmt(getFleetPower(empire.id))} - ${
                contact.war ? `War exhaustion ${fmt(contact.exhaustion)}%` : contact.truce ? `Truce ${contact.truce}m` : "Open channel"
              }</div>
            </div>
            <span class="mini-tag" style="border-color:${color}; color:${color}">${contact.war ? "War" : relation > 20 ? "Warm" : relation < -35 ? "Tense" : "Neutral"}</span>
            <div class="contact-actions">
              <button class="ghost-button" data-action="embassy" data-empire="${empire.id}" ${contact.war ? "disabled" : ""}>Embassy</button>
              <button class="ghost-button" data-action="rival" data-empire="${empire.id}" ${contact.war ? "disabled" : ""}>Rival</button>
              ${
                contact.war
                  ? `<button class="ghost-button" data-action="truce" data-empire="${empire.id}">Truce</button>`
                  : `<button class="ghost-button" data-action="declare-war" data-empire="${empire.id}" ${
                      contact.truce ? "disabled" : ""
                    }>War</button>`
              }
            </div>
          </div>
        `;
              })
              .join("")
          : `<div class="empty-state">No confirmed contacts.</div>`
      }
    </div>
  `;
}

function renderLog() {
  els.logPanel.innerHTML = state.logs
    .slice(0, 18)
    .map(
      (entry) => `
      <div class="log-entry ${escapeHtml(entry.type)}">
        <strong>${dateLabel(entry.month)}</strong> - ${escapeHtml(entry.text)}
      </div>
    `
    )
    .join("");
}

function openDecision(decision) {
  state.modal = decision;
  state.running = false;
  updateUI();
}

function renderModal() {
  if (!state.modal) {
    els.modalBackdrop.hidden = true;
    return;
  }
  els.modalBackdrop.hidden = false;
  els.modalKicker.textContent = state.modal.kicker || "Event";
  els.modalTitle.textContent = state.modal.title;
  els.modalText.textContent = state.modal.text;
  els.modalOptions.innerHTML = state.modal.options
    .map(
      (option, index) => `
      <button class="choice-button" data-decision="${index}">
        <span class="choice-title">${escapeHtml(option.label)}</span>
        <span class="choice-text">${escapeHtml(option.text || "")}</span>
      </button>
    `
    )
    .join("");
}

function resolveDecision(index) {
  const option = state.modal?.options[index];
  if (!option) return;
  state.modal = null;
  option.effect?.();
  updateUI();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const nextDpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * nextDpr));
  const height = Math.max(1, Math.floor(rect.height * nextDpr));
  if (canvas.width !== width || canvas.height !== height || dpr !== nextDpr) {
    canvas.width = width;
    canvas.height = height;
    dpr = nextDpr;
  }
  viewport.width = rect.width;
  viewport.height = rect.height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGalaxy(time) {
  resizeCanvas();
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackdrop(time);
  drawHyperlanes();
  drawTerritory();
  drawSystems(time);
  drawFleets(time);
  drawSelection();
}

function drawBackdrop(time) {
  const gradient = ctx.createRadialGradient(
    viewport.width * 0.52,
    viewport.height * 0.44,
    40,
    viewport.width * 0.52,
    viewport.height * 0.44,
    Math.max(viewport.width, viewport.height) * 0.75
  );
  gradient.addColorStop(0, "#0b1219");
  gradient.addColorStop(0.5, "#05070b");
  gradient.addColorStop(1, "#020306");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  for (const star of state.backgroundStars) {
    const p = worldToScreen(star.x, star.y);
    if (p.x < -20 || p.y < -20 || p.x > viewport.width + 20 || p.y > viewport.height + 20) continue;
    const twinkle = 0.75 + Math.sin(time / 900 + star.x * 0.01) * 0.15;
    ctx.globalAlpha = star.alpha * twinkle;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(p.x, p.y, Math.max(0.6, star.size * state.camera.zoom), Math.max(0.6, star.size * state.camera.zoom));
  }
  ctx.globalAlpha = 1;
}

function drawHyperlanes() {
  ctx.lineCap = "round";
  for (const system of state.systems) {
    for (const neighborId of system.hyperlanes) {
      if (neighborId < system.id) continue;
      const neighbor = state.systems[neighborId];
      const aKnown = system.known || system.surveyedBy.player || system.owner === "player";
      const bKnown = neighbor.known || neighbor.surveyedBy.player || neighbor.owner === "player";
      const bothKnown = aKnown && bKnown;
      if (!bothKnown && state.mapMode !== "science") continue;
      const a = worldToScreen(system.x, system.y);
      const b = worldToScreen(neighbor.x, neighbor.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = bothKnown ? "rgba(151, 191, 198, 0.18)" : "rgba(151, 191, 198, 0.045)";
      ctx.lineWidth = bothKnown ? 1.1 : 0.7;
      ctx.stroke();
    }
  }
}

function drawTerritory() {
  if (state.mapMode === "science") return;
  for (const system of state.systems) {
    if (!system.owner || (!system.known && system.owner !== "player")) continue;
    const empire = state.empires[system.owner];
    if (!empire) continue;
    const p = worldToScreen(system.x, system.y);
    const radius = (system.colony ? 44 : 34) * state.camera.zoom;
    const gradient = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius);
    gradient.addColorStop(0, `${hexToRgba(empire.color, 0.18)}`);
    gradient.addColorStop(1, `${hexToRgba(empire.color, 0)}`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSystems(time) {
  for (const system of state.systems) {
    const known = system.known || system.surveyedBy.player || system.owner === "player";
    const surveyed = system.surveyedBy.player;
    const p = worldToScreen(system.x, system.y);
    if (p.x < -80 || p.y < -80 || p.x > viewport.width + 80 || p.y > viewport.height + 80) continue;
    const baseRadius = system.star.radius * clamp(state.camera.zoom * 1.75, 0.7, 1.7);
    const pulse = 1 + Math.sin(time / 800 + system.id) * 0.08;
    const radius = baseRadius * pulse;

    if (!known) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#79818a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.4, radius * 0.45), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }

    if (system.owner && state.mapMode === "political") {
      const empire = state.empires[system.owner];
      if (empire) {
        ctx.strokeStyle = empire.color;
        ctx.lineWidth = system.owner === "player" ? 1.9 : 1.3;
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    if (state.mapMode === "economy" && surveyed) {
      const value = system.deposits.energy + system.deposits.minerals + system.deposits.research;
      ctx.strokeStyle = value >= 10 ? "#67d38f" : value >= 6 ? "#f2b84b" : "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 6 + value * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.mapMode === "science" && system.anomaly && !system.anomalyResolved && surveyed) {
      ctx.strokeStyle = "#4fd1d8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (state.mapMode === "military") {
      const defense = system.owner ? getSystemDefense(system, system.owner) : system.danger;
      if (defense > 0) {
        ctx.strokeStyle = defense > 24 ? "#ec6a64" : defense > 11 ? "#f2b84b" : "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 5 + Math.min(18, defense * 0.45), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
    glow.addColorStop(0, hexToRgba(system.star.color, surveyed ? 0.9 : 0.46));
    glow.addColorStop(1, hexToRgba(system.star.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = surveyed ? system.star.color : "#9ca5aa";
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (system.colony) {
      ctx.fillStyle = system.colony.owner === "player" ? "#ecf4f7" : state.empires[system.colony.owner]?.color || "#ecf4f7";
      ctx.fillRect(p.x - 3, p.y + radius + 5, 6, 6);
    }

    if (state.camera.zoom > 0.42 || system.owner === "player" || system.id === state.selectedSystemId) {
      ctx.font = "11px Inter, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = surveyed ? "rgba(236,244,247,0.86)" : "rgba(200,214,217,0.56)";
      ctx.fillText(system.name, p.x, p.y - radius - 9);
    }
  }
}

function drawFleets(time) {
  for (const fleet of state.fleets) {
    const visible =
      fleet.owner === "player" ||
      fleet.owner === "pirates" ||
      state.contacts[fleet.owner]?.met ||
      state.systems[fleet.location]?.known;
    if (!visible) continue;
    const pos = fleetPosition(fleet);
    const p = worldToScreen(pos.x, pos.y);
    if (p.x < -40 || p.y < -40 || p.x > viewport.width + 40 || p.y > viewport.height + 40) continue;
    const color =
      fleet.owner === "player"
        ? fleet.role === "science"
          ? "#4fd1d8"
          : fleet.role === "constructor"
            ? "#d7c36a"
            : "#ec6a64"
        : fleet.owner === "pirates"
          ? "#f2b84b"
          : state.empires[fleet.owner]?.color || "#ffffff";
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(time / 700 + fleet.id.length) * 0.12);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (fleet.role === "science") {
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
    } else if (fleet.role === "constructor") {
      ctx.rect(-6, -6, 12, 12);
    } else {
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (fleet.id === state.selectedFleetId) {
      ctx.strokeStyle = "#f7fbff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function fleetPosition(fleet) {
  if (!fleet.route.length) return state.systems[fleet.location];
  const from = state.systems[fleet.location];
  const to = state.systems[fleet.route[0]];
  const t = clamp(fleet.progress / fleet.segmentMonths, 0, 1);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

function drawSelection() {
  const system = selectedSystem();
  if (!system) return;
  const p = worldToScreen(system.x, system.y);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function worldToScreen(x, y) {
  return {
    x: viewport.width / 2 + (x - state.camera.x) * state.camera.zoom,
    y: viewport.height / 2 + (y - state.camera.y) * state.camera.zoom,
  };
}

function screenToWorld(x, y) {
  return {
    x: (x - viewport.width / 2) / state.camera.zoom + state.camera.x,
    y: (y - viewport.height / 2) / state.camera.zoom + state.camera.y,
  };
}

function zoomAt(screenX, screenY, factor) {
  const before = screenToWorld(screenX, screenY);
  state.camera.zoom = clamp(state.camera.zoom * factor, 0.24, 1.7);
  const after = screenToWorld(screenX, screenY);
  state.camera.x += before.x - after.x;
  state.camera.y += before.y - after.y;
}

function selectNearest(screenX, screenY) {
  const world = screenToWorld(screenX, screenY);
  let best = null;
  for (const system of state.systems) {
    const distance = Math.hypot(system.x - world.x, system.y - world.y);
    if (!best || distance < best.distance) best = { system, distance };
  }
  const threshold = 34 / state.camera.zoom;
  if (best && best.distance <= threshold) {
    state.selectedSystemId = best.system.id;
    updateUI();
  }
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function capitalize(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function handleAction(action, target) {
  const data = target.dataset;
  if (action === "new-game") {
    newGame();
    return;
  }
  if (action === "center-home") {
    const home = state.systems[state.empires.player.homeSystemId];
    state.camera.x = home.x;
    state.camera.y = home.y;
    state.camera.zoom = Math.max(state.camera.zoom, 0.52);
    state.selectedSystemId = home.id;
    updateUI();
    return;
  }
  if (action === "zoom-in") return zoomAt(viewport.width / 2, viewport.height / 2, 1.18);
  if (action === "zoom-out") return zoomAt(viewport.width / 2, viewport.height / 2, 0.84);
  if (action === "select-fleet") {
    state.selectedFleetId = data.fleet;
    const fleet = selectedFleet();
    if (fleet) {
      const position = fleetPosition(fleet);
      state.camera.x = position.x;
      state.camera.y = position.y;
    }
    updateUI();
    return;
  }
  if (action === "select-system") {
    state.selectedSystemId = Number(data.system);
    const system = selectedSystem();
    state.camera.x = system.x;
    state.camera.y = system.y;
    updateUI();
    return;
  }
  if (action === "survey-system") return commandSurvey(Number(data.system));
  if (action === "build-outpost") return commandBuildOutpost(Number(data.system));
  if (action === "build-mining") return commandBuildStation(Number(data.system), "mining");
  if (action === "build-research") return commandBuildStation(Number(data.system), "research");
  if (action === "colonize") return commandColonize(Number(data.system));
  if (action === "build-planet") return commandBuildPlanet(Number(data.system), data.building);
  if (action === "build-ship") return commandBuildShip(data.ship);
  if (action === "attack-system") return commandAttack(Number(data.system));
  if (action === "choose-tech") return chooseTech(data.tech);
  if (action === "embassy") return improveRelations(data.empire);
  if (action === "rival") return rivalEmpire(data.empire);
  if (action === "declare-war") return declareWar(data.empire, true);
  if (action === "truce") return negotiateTruce(data.empire);
}

function bindEvents() {
  els.pauseBtn.addEventListener("click", () => {
    state.running = !state.running;
    updateUI();
  });
  els.stepBtn.addEventListener("click", () => tickMonth());
  els.speedBtn.addEventListener("click", () => {
    state.speedIndex = (state.speedIndex + 1) % state.speeds.length;
    updateUI();
  });

  document.addEventListener("click", (event) => {
    const decision = event.target.closest("[data-decision]");
    if (decision) {
      resolveDecision(Number(decision.dataset.decision));
      return;
    }
    const mode = event.target.closest("[data-map-mode]");
    if (mode) {
      state.mapMode = mode.dataset.mapMode;
      document.querySelectorAll("[data-map-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.mapMode === state.mapMode);
      });
      updateUI();
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action && !action.disabled) handleAction(action.dataset.action, action);
  });

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      cameraX: state.camera.x,
      cameraY: state.camera.y,
      dragging: false,
    };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 4) pointer.dragging = true;
    state.camera.x -= dx / state.camera.zoom;
    state.camera.y -= dy / state.camera.zoom;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!pointer.dragging) {
      const rect = canvas.getBoundingClientRect();
      selectNearest(event.clientX - rect.left, event.clientY - rect.top);
    }
    pointer = null;
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = event.deltaY < 0 ? 1.12 : 0.89;
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === "Space") {
      event.preventDefault();
      state.running = !state.running;
      updateUI();
    }
    if (event.key === ".") tickMonth();
    if (event.key === "1" || event.key === "2" || event.key === "3") {
      state.speedIndex = Number(event.key) - 1;
      updateUI();
    }
  });
}

function frame(time) {
  if (!lastFrame) lastFrame = time;
  const dt = time - lastFrame;
  lastFrame = time;
  if (state.running && !state.modal) {
    const interval = 900 / state.speeds[state.speedIndex];
    state.autoTimer += dt;
    while (state.autoTimer >= interval) {
      tickMonth();
      state.autoTimer -= interval;
    }
  }
  drawGalaxy(time);
  requestAnimationFrame(frame);
}

bindEvents();
newGame(22000624);
requestAnimationFrame(frame);
