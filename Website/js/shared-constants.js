// Default chart styling
if (typeof Chart !== "undefined" && Chart.defaults) {
  Chart.defaults.font.size = 11;
}

// ─── Standard Labels & Dimensions ───────────────────────────────────────────
const natYearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const natUserLabels = ["Car, van, ute", "Motorcyclist", "Cyclist", "Pedestrian", "Heavy transport", "Bus occupant", "Other/unknown"];
const fnYearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const fnUserLabels = ["Car, van, ute", "Motorcyclist", "Pedestrian", "Cyclist", "Other/unknown", "Heavy transport", "Bus occupant"];
const stNames = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"];
const stAnnualYears = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];

// ─── Fixed Color Palettes ───────────────────────────────────────────────────
const RoadUserColors = {
  "Car, van, ute": "#0072B2",
  "Car, van or ute": "#0072B2",
  "Motorcyclist": "#D55E00",
  "Motorcyclists": "#D55E00",
  "Cyclist": "#009E73",
  "Cyclists": "#009E73",
  "Pedestrian": "#CC79A7",
  "Pedestrians": "#CC79A7",
  "Heavy transport": "#56B4E9",
  "Bus occupant": "#E69F00",
  "Other/unknown": "#999990",
  "Other or unknown": "#999990"
};

const StateColors = {
  "NSW": "#332288",
  "Vic": "#88CCEE",
  "VIC": "#88CCEE",
  "Qld": "#CC6677",
  "QLD": "#CC6677",
  "WA": "#117733",
  "SA": "#DDCC77",
  "Tas": "#AA4499",
  "NT": "#44AA99",
  "ACT": "#882255"
};

function hexToRgba(hex, alpha = 0.22) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex;
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Chart Color Theme Configuration ────────────────────────────────────────
const ChartTheme = {
  state: {
    rankings: {
      normal: StateColors["NSW"],
      selected: StateColors["NSW"],
      dimmed: hexToRgba(StateColors["NSW"], 0.22)
    },
    los: {
      normal: StateColors["NT"],
      selected: StateColors["NT"],
      dimmed: hexToRgba(StateColors["NT"], 0.22)
    },
    car: {
      normal: RoadUserColors["Car, van, ute"],
      selected: RoadUserColors["Car, van, ute"],
      dimmed: hexToRgba(RoadUserColors["Car, van, ute"], 0.22)
    },
    cyclist: {
      normal: RoadUserColors["Cyclist"],
      selected: RoadUserColors["Cyclist"],
      dimmed: hexToRgba(RoadUserColors["Cyclist"], 0.22)
    },
    moto: {
      normal: RoadUserColors["Motorcyclist"],
      selected: RoadUserColors["Motorcyclist"],
      dimmed: hexToRgba(RoadUserColors["Motorcyclist"], 0.22)
    },
    ped: {
      normal: RoadUserColors["Pedestrian"],
      selected: RoadUserColors["Pedestrian"],
      dimmed: hexToRgba(RoadUserColors["Pedestrian"], 0.22)
    },
    beddays: {
      normal: StateColors["NSW"],
      selected: StateColors["NSW"],
      dimmed: hexToRgba(StateColors["NSW"], 0.22)
    }
  },
  yearTrend: {
    national: {
      normal: RoadUserColors["Heavy transport"],
      selected: RoadUserColors["Car, van, ute"],
      dimmed: hexToRgba(RoadUserColors["Heavy transport"], 0.25)
    },
    firstNations: {
      normal: RoadUserColors["Bus occupant"],
      selected: RoadUserColors["Motorcyclist"],
      dimmed: hexToRgba(RoadUserColors["Bus occupant"], 0.25)
    }
  }
};

// Generates bar color array based on active filter (normal, selected, or dimmed)
function getBarColorList(labels, selectedLabel, theme) {
  const isAll = (!selectedLabel || selectedLabel === "all");
  return labels.map(lbl => {
    if (isAll) return theme.normal;
    return (String(lbl) === String(selectedLabel)) ? theme.selected : theme.dimmed;
  });
}

// Road user label matching helper
function matchRoadUser(rawUser, targetLabel) {
  if (!rawUser) return false;
  const norm = rawUser.trim().toLowerCase();
  switch (targetLabel) {
    case "Car, van, ute":
      return norm.includes("car") || norm.includes("ute");
    case "Motorcyclist":
      return norm.includes("motorcycl");
    case "Cyclist":
      return norm === "cyclist";
    case "Pedestrian":
      return norm.includes("pedestrian");
    case "Heavy transport":
      return norm.includes("heavy transport");
    case "Bus occupant":
      return norm.includes("bus occupant");
    case "Other/unknown":
      return norm.includes("other") || norm.includes("unknown");
    default:
      return norm === targetLabel.toLowerCase();
  }
}

// ─── Filter Bar DOM Elements ────────────────────────────────────────────────
const filterData = document.getElementById("filter-data");
const filterYear = document.getElementById("filter-year");
const filterState = document.getElementById("filter-state");
const btnReset = document.getElementById("btn-reset-all");
const scopeBadge = document.getElementById("db-scope-badge");

// ─── Raw Data Store ──────────────────────────────────────────────────────────
const RawData = {
  national: [],
  firstNations: [],
  state: []
};

// ─── Lazy-init Flags & Chart Stores ──────────────────────────────────────────
const pageInited = { national: false, firstnations: false, state: false };
const natCharts = {};
const fnCharts = {};
const stCharts = {};
let currentData = "national";

// Data filtering helpers
function getNatTrafficRows(yearFilter) {
  return RawData.national.filter(r => {
    if (r.cause_of_injury !== "Traffic") return false;
    if (yearFilter !== "all" && String(r.year) !== String(yearFilter)) return false;
    return true;
  });
}

function getFnRows(yearFilter) {
  return RawData.firstNations.filter(r => {
    if (yearFilter !== "all" && String(r.year) !== String(yearFilter)) return false;
    return true;
  });
}

