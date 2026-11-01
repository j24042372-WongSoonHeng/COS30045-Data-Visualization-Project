/* ═══════════════════════════════════════════════════════════════════════════
   AUSTRALIAN ROAD TRAUMA DASHBOARD — app.js (CSV Data-Driven)
   All data dynamically loaded and aggregated from:
     - data/Hospitalisation.csv
     - data/first_nations_road_user.csv
     - data/state_road_user.csv
   Controlled by unified filter bar (Year / State / Data / Reset).
═══════════════════════════════════════════════════════════════════════════ */

Chart.defaults.font.size = 11;

// ─── Standard Labels & Dimensions ───────────────────────────────────────────
const natYearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const natUserLabels = ["Car, van, ute", "Motorcyclist", "Cyclist", "Pedestrian", "Heavy transport", "Bus occupant", "Other/unknown"];
const fnYearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const fnUserLabels = ["Car, van, ute", "Motorcyclist", "Pedestrian", "Cyclist", "Other/unknown", "Heavy transport", "Bus occupant"];
const stNames = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"];
const stAnnualYears = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];

// Helper to normalize road user string comparison between CSV variations
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

// ─── Raw Data Store ──────────────────────────────────────────────────────────
const RawData = {
  national: [],      // from Hospitalisation.csv
  firstNations: [],  // from first_nations_road_user.csv
  state: []          // from state_road_user.csv
};

// ─── Lazy-init flags ─────────────────────────────────────────────────────────
const pageInited = { national: false, firstnations: false, state: false };

// ─── Chart Stores ────────────────────────────────────────────────────────────
const natCharts = {};
const fnCharts = {};
const stCharts = {};

let currentData = "national";

// ─── Filter Bar DOM Elements ────────────────────────────────────────────────
const filterData = document.getElementById("filter-data");
const filterYear = document.getElementById("filter-year");
const filterState = document.getElementById("filter-state");
const btnReset = document.getElementById("btn-reset-all");
const scopeBadge = document.getElementById("db-scope-badge");


/* ═══════════════════════════════════════════════════════════════════════════
   CHART COLOR THEME & FILTER PALETTE CONFIGURATION
   Configure bar chart colors:
     - normal:   default color (no filter)
     - selected: highlighted / emphasized color when filtered
     - dimmed:   faded color for unselected items
═══════════════════════════════════════════════════════════════════════════ */
const ChartTheme = {
  // State & Territory bar chart colors
  state: {
    // Hospitalisations by Jurisdiction (c-state-rankings)
    rankings: {
      normal:   "#1d72b8",
      selected: "#0c4a7e",
      dimmed:   "rgba(29, 114, 184, 0.22)"
    },
    // Average Hospital Bed Days by State (c-state-los)
    los: {
      normal:   "#20c997",
      selected: "#087f5b",
      dimmed:   "rgba(32, 201, 151, 0.22)"
    },
    // Road user breakdown: Car, van, ute (c-car-state)
    car: {
      normal:   "#1d72b8",
      selected: "#0c4a7e",
      dimmed:   "rgba(29, 114, 184, 0.22)"
    },
    // Road user breakdown: Cyclist (c-cyclist-state)
    cyclist: {
      normal:   "#40c057",
      selected: "#2b8a3e",
      dimmed:   "rgba(64, 192, 87, 0.22)"
    },
    // Road user breakdown: Motorcyclist (c-moto-state)
    moto: {
      normal:   "#fd7e14",
      selected: "#d9480f",
      dimmed:   "rgba(253, 126, 20, 0.22)"
    },
    // Road user breakdown: Pedestrian (c-ped-state)
    ped: {
      normal:   "#e03131",
      selected: "#c92a2a",
      dimmed:   "rgba(224, 49, 49, 0.22)"
    },
    // Total Bed Days by State (c-tot-beddays-state)
    beddays: {
      normal:   "#228be6",
      selected: "#1864ab",
      dimmed:   "rgba(34, 139, 230, 0.22)"
    }
  },

  // Annual trend bar chart colors
  yearTrend: {
    // National annual bed days (c-bed-days-trend)
    national: {
      normal:   "#4dabf7",
      selected: "#1864ab",
      dimmed:   "rgba(77, 171, 247, 0.25)"
    },
    // First Nations annual bed days (c-fn-beddays-trend)
    firstNations: {
      normal:   "#f76707",
      selected: "#d9480f",
      dimmed:   "rgba(247, 103, 7, 0.25)"
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


/* ═══════════════════════════════════════════════════════════════════════════
   CHART.JS HOVER STATE CLEARING
═══════════════════════════════════════════════════════════════════════════ */
function clearChartHoverState(chart) {
  if (!chart) return;
  try {
    if (typeof chart.setActiveElements === "function") {
      chart.setActiveElements([]);
    }
    if (chart.tooltip && typeof chart.tooltip.setActiveElements === "function") {
      chart.tooltip.setActiveElements([], { x: 0, y: 0 });
    }
    if (Array.isArray(chart._active)) {
      chart._active = [];
    }
    const count = chart.data && chart.data.datasets ? chart.data.datasets.length : 0;
    for (let d = 0; d < count; d++) {
      const meta = chart.getDatasetMeta(d);
      if (meta && meta.data) {
        meta.data.forEach(pt => {
          if (pt) {
            pt.active = false;
            if (pt.options) {
              delete pt.options.backgroundColor;
              delete pt.options.borderColor;
              delete pt.options.borderWidth;
              delete pt.options.radius;
              delete pt.options.hoverRadius;
              delete pt.options.hoverBackgroundColor;
              delete pt.options.hoverBorderColor;
              delete pt.options.hoverBorderWidth;
            }
          }
        });
      }
    }
  } catch (e) {
    // no-op
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   FILTER CONTROL HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function syncFilterState(dataKey) {
  const isState = dataKey === "state";
  filterYear.disabled = false;
  if (filterYear.previousElementSibling) {
    filterYear.previousElementSibling.classList.remove("disabled");
  }
  filterState.disabled = !isState;
  if (filterState.previousElementSibling) {
    filterState.previousElementSibling.classList.toggle("disabled", !isState);
  }
}

function updateBadge(dataKey, year, state) {
  const dataLabels = { national: "National", firstnations: "First Nations", state: "State & Territory" };
  let parts = [dataLabels[dataKey]];
  if (dataKey === "state" && state !== "all") parts.push(state);
  if (year !== "all") parts.push(`Year ${year}`);
  scopeBadge.textContent = parts.join(" · ");
}

function bindSubTabs(pageEl, onSwitch) {
  pageEl.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      pageEl.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      pageEl.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      pageEl.querySelector(`#${target}`).classList.add("active");
      if (onSwitch) onSwitch(target);
    });
  });
}


/* ═══════════════════════════════════════════════════════════════════════════
   MODULE B — NATIONAL OVERVIEW (Aggregations from Hospitalisation.csv)
═══════════════════════════════════════════════════════════════════════════ */

// Get traffic rows (aggregating across all 12 months)
function getNatTrafficRows(yearFilter) {
  return RawData.national.filter(r => {
    if (r.cause_of_injury !== "Traffic") return false;
    if (yearFilter !== "all" && String(r.year) !== String(yearFilter)) return false;
    return true;
  });
}

function initNational() {
  initNatOverview();
  const pageEl = document.getElementById("page-national");
  bindSubTabs(pageEl, target => {
    if (target === "tab-overview") updateNatOverview(filterYear.value);
    if (target === "tab-roadusers") { initNatRoadUsers(); updateNatRoadUsers(filterYear.value); }
    if (target === "tab-causes") { initNatCauses(); updateNatCauses(filterYear.value); }
  });
}

function initNatOverview() {
  // Annual trend data across all 11 years (summed across 12 months each)
  const annualHosp = natYearsList.map(y => {
    return RawData.national
      .filter(r => r.cause_of_injury === "Traffic" && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const annualBeds = natYearsList.map(y => {
    return RawData.national
      .filter(r => r.cause_of_injury === "Traffic" && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  natCharts.annualTrend = new Chart(document.getElementById("c-annual-trend"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [{
        label: "Hospitalisations",
        data: annualHosp,
        borderColor: "#1d72b8",
        backgroundColor: "rgba(29,114,184,0.08)",
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Admissions: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { min: 30000, grid: { color: "#f1f3f5" } }, x: { grid: { display: false } } }
    }
  });

  natCharts.roadUsersHosp = new Chart(document.getElementById("c-road-users-hosp"), {
    type: "bar",
    data: {
      labels: natUserLabels,
      datasets: [{ data: [], backgroundColor: "#1d72b8", borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { grid: { color: "#f1f3f5" } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } }
    }
  });

  natCharts.bedDaysTrend = new Chart(document.getElementById("c-bed-days-trend"), {
    type: "bar",
    data: {
      labels: natYearsList,
      datasets: [{ data: annualBeds, backgroundColor: "#4dabf7", borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { grid: { color: "#f1f3f5" }, ticks: { callback: v => `${v / 1000}k` } }, x: { grid: { display: false } } }
    }
  });

  natCharts.roadUserPie = new Chart(document.getElementById("c-road-user-pie"), {
    type: "doughnut",
    data: {
      labels: natUserLabels,
      datasets: [{
        data: [],
        backgroundColor: ["#1d72b8", "#339af0", "#4dabf7", "#74c0fc", "#adb5bd", "#ced4da", "#dee2e6"],
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 10, font: { size: 9 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
            }
          }
        }
      }, cutout: "55%"
    }
  });

  updateNatOverview(filterYear.value);
}

function initNatRoadUsers() {
  if (natCharts.userBeddays) {
    natCharts.userBeddays.resize();
    natCharts.userLos.resize();
    natCharts.twoWheel.resize();
    natCharts.pedestrianTrend.resize();
    return;
  }

  // Pre-calculate line trends across all 11 years from raw CSV
  const motoAnnual = natYearsList.map(y => {
    return RawData.national
      .filter(r => r.cause_of_injury === "Traffic" && matchRoadUser(r.road_user, "Motorcyclist") && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const cycAnnual = natYearsList.map(y => {
    return RawData.national
      .filter(r => r.cause_of_injury === "Traffic" && matchRoadUser(r.road_user, "Cyclist") && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const pedAnnual = natYearsList.map(y => {
    return RawData.national
      .filter(r => r.cause_of_injury === "Traffic" && matchRoadUser(r.road_user, "Pedestrian") && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  natCharts.userBeddays = new Chart(document.getElementById("c-user-beddays"), {
    type: "bar",
    data: { labels: natUserLabels, datasets: [{ data: [], backgroundColor: "#228be6", borderRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Days: ${ctx.parsed.y.toLocaleString()}` } } },
      scales: { y: { ticks: { callback: v => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } }
    }
  });

  natCharts.userLos = new Chart(document.getElementById("c-user-los"), {
    type: "bar",
    data: { labels: natUserLabels, datasets: [{ data: [], backgroundColor: "#15aabf", borderRadius: 3 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Avg Stay: ${ctx.parsed.x} days` } } },
      scales: { x: { ticks: { callback: v => `${v} d` } } }
    }
  });

  natCharts.twoWheel = new Chart(document.getElementById("c-two-wheel"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [
        { label: "Motorcyclists", data: motoAnnual, borderColor: "#1d72b8", borderWidth: 2, pointRadius: 2.5 },
        { label: "Cyclists", data: cycAnnual, borderColor: "#40c057", borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
    }
  });

  natCharts.pedestrianTrend = new Chart(document.getElementById("c-pedestrian-trend"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [{
        label: "Pedestrians", data: pedAnnual,
        borderColor: "#fa5252", backgroundColor: "rgba(250,82,82,0.08)", fill: true, borderWidth: 2, pointRadius: 2.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Pedestrians: ${ctx.parsed.y.toLocaleString()}` } } }
    }
  });

  updateNatRoadUsers(filterYear.value);
}

function initNatCauses() {
  if (natCharts.allCauses) {
    natCharts.allCauses.resize();
    natCharts.transportPie.resize();
    return;
  }

  const causesLabels = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];

  natCharts.allCauses = new Chart(document.getElementById("c-all-causes"), {
    type: "bar",
    data: { labels: causesLabels, datasets: [{ data: [], backgroundColor: ["#1d72b8", "#74c0fc", "#adb5bd", "#ced4da"], borderRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } } },
      scales: { y: { ticks: { callback: v => `${v / 1000}k` } } }
    }
  });

  natCharts.transportPie = new Chart(document.getElementById("c-transport-pie"), {
    type: "doughnut",
    data: { labels: causesLabels, datasets: [{ data: [], backgroundColor: ["#1d72b8", "#74c0fc", "#adb5bd", "#ced4da"], borderWidth: 1.5, borderColor: "#fff" }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${ctx.label}: ${((ctx.parsed / total) * 100).toFixed(1)}% (${ctx.parsed.toLocaleString()})`;
            }
          }
        }
      }, cutout: "60%"
    }
  });

  updateNatCauses(filterYear.value);
}

function updateNatOverview(year) {
  const trafficRows = getNatTrafficRows(year);
  const totalHosp = trafficRows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const totalBeds = trafficRows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  const avgLos = totalHosp > 0 ? (totalBeds / totalHosp).toFixed(2) : "0.00";

  document.getElementById("kpi-hosp").textContent = totalHosp.toLocaleString();
  document.getElementById("kpi-beddays").textContent = totalBeds.toLocaleString();
  document.getElementById("kpi-los").innerHTML = `${avgLos} <small>days</small>`;

  // Road users breakdown for current filter
  const userCounts = natUserLabels.map(label => {
    return trafficRows
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  if (natCharts.roadUsersHosp) {
    natCharts.roadUsersHosp.data.datasets[0].data = userCounts;
    natCharts.roadUsersHosp.update();
  }
  if (natCharts.roadUserPie) {
    natCharts.roadUserPie.data.datasets[0].data = userCounts;
    natCharts.roadUserPie.update();
  }

  const isAll = (year === "all");
  const idx = natYearsList.indexOf(year);

  if (natCharts.annualTrend) {
    const ds = natCharts.annualTrend.data.datasets[0];
    ds.pointRadius = natYearsList.map((_, i) => (!isAll && i === idx ? 8 : 3));
    ds.pointHoverRadius = natYearsList.map((_, i) => (!isAll && i === idx ? 10 : 6));
    ds.pointBackgroundColor = natYearsList.map((_, i) => (!isAll && i === idx ? "#e03131" : "#1d72b8"));
    ds.pointBorderColor = natYearsList.map(() => "#ffffff");
    ds.pointBorderWidth = natYearsList.map((_, i) => (!isAll && i === idx ? 2 : 1));

    clearChartHoverState(natCharts.annualTrend);
    natCharts.annualTrend.update();
  }

  if (natCharts.bedDaysTrend) {
    natCharts.bedDaysTrend.data.datasets[0].backgroundColor = getBarColorList(
      natYearsList,
      year,
      ChartTheme.yearTrend.national
    );
    clearChartHoverState(natCharts.bedDaysTrend);
    natCharts.bedDaysTrend.update();
  }
}

function updateNatRoadUsers(year) {
  const trafficRows = getNatTrafficRows(year);
  const isAll = (year === "all");
  const yearIdx = natYearsList.indexOf(year);
  const idx = yearIdx;

  // 1. Total Bed Days by Road User
  const userBedDays = natUserLabels.map(label => {
    return trafficRows
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  const totalBedsYear = userBedDays.reduce((a, b) => a + b, 0);

  if (natCharts.userBeddays) {
    natCharts.userBeddays.data.datasets[0].data = userBedDays;
    clearChartHoverState(natCharts.userBeddays);
    natCharts.userBeddays.update();

    const tagBedDays = document.getElementById("tag-user-beddays");
    if (tagBedDays) {
      tagBedDays.textContent = isAll
        ? "Healthcare Load (2011–2021)"
        : `Year ${year}: ${totalBedsYear.toLocaleString()} bed days`;
    }
  }

  // 2. Average Length of Stay by User Type
  const userLos = natUserLabels.map(label => {
    const userRows = trafficRows.filter(r => matchRoadUser(r.road_user, label));
    const h = userRows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = userRows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  const totalHospYear = trafficRows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const overallStay = totalHospYear > 0 ? (totalBedsYear / totalHospYear).toFixed(2) : "0.00";

  if (natCharts.userLos) {
    natCharts.userLos.data.datasets[0].data = userLos;
    clearChartHoverState(natCharts.userLos);
    natCharts.userLos.update();

    const tagLos = document.getElementById("tag-user-los");
    if (tagLos) {
      tagLos.textContent = isAll
        ? "Days per admission (10-Yr Mean)"
        : `Year ${year} (Mean ${overallStay} days)`;
    }
  }

  // 3. Two-Wheeler Trend
  if (natCharts.twoWheel) {
    natCharts.twoWheel.data.datasets.forEach((ds) => {
      ds.pointRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 8 : 2.5));
      ds.pointHoverRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 10 : 5));
      ds.pointBackgroundColor = natYearsList.map((_, i) => (!isAll && i === yearIdx ? "#e03131" : ds.borderColor));
      ds.pointBorderColor = natYearsList.map(() => "#ffffff");
      ds.pointBorderWidth = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 2 : 1));
    });
    clearChartHoverState(natCharts.twoWheel);
    natCharts.twoWheel.update();

    const tagTwoWheel = document.getElementById("tag-two-wheel");
    if (tagTwoWheel) {
      tagTwoWheel.textContent = isAll ? "Annual Growth (2011–2021)" : `Highlighted Year: ${year}`;
    }
  }

  // 4. Pedestrian Admissions Trend
  if (natCharts.pedestrianTrend) {
    const ds = natCharts.pedestrianTrend.data.datasets[0];
    ds.pointRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 8 : 2.5));
    ds.pointHoverRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 10 : 5));
    ds.pointBackgroundColor = natYearsList.map((_, i) => (!isAll && i === yearIdx ? "#e03131" : "#fa5252"));
    ds.pointBorderColor = natYearsList.map(() => "#ffffff");
    ds.pointBorderWidth = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 2 : 1));

    clearChartHoverState(natCharts.pedestrianTrend);
    natCharts.pedestrianTrend.update();

    const pedHospYear = trafficRows
      .filter(r => matchRoadUser(r.road_user, "Pedestrian"))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);

    const tagPed = document.getElementById("tag-ped-trend");
    if (tagPed) {
      tagPed.textContent = isAll
        ? "Annual admissions (2011–2021)"
        : `Highlighted Year: ${year} (${pedHospYear.toLocaleString()} admissions)`;
    }
  }
}

function updateNatCauses(year) {
  const causesLabels = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];
  const counts = causesLabels.map(cause => {
    return RawData.national
      .filter(r => r.cause_of_injury === cause && (year === "all" || String(r.year) === String(year)))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  if (natCharts.allCauses) {
    natCharts.allCauses.data.datasets[0].data = counts;
    natCharts.allCauses.update();
  }

  if (natCharts.transportPie) {
    natCharts.transportPie.data.datasets[0].data = counts;
    natCharts.transportPie.update();
  }
}

function updateNatYear(year) {
  updateNatOverview(year);
  updateNatRoadUsers(year);
  updateNatCauses(year);
}


/* ═══════════════════════════════════════════════════════════════════════════
   MODULE A — FIRST NATIONS (Aggregations from first_nations_road_user.csv)
═══════════════════════════════════════════════════════════════════════════ */

function getFnRows(yearFilter) {
  return RawData.firstNations.filter(r => {
    if (yearFilter !== "all" && String(r.year) !== String(yearFilter)) return false;
    return true;
  });
}

function initFirstNations() {
  initFnTrends();
  const pageEl = document.getElementById("page-firstnations");
  bindSubTabs(pageEl, target => {
    if (target === "tab-trends") updateFnYear(filterYear.value);
    if (target === "tab-roaduser-disparity") { initFnDisparity(); updateFnDisparity(filterYear.value); }
    if (target === "tab-severity") { initFnSeverity(); updateFnSeverity(filterYear.value); }
  });
}

function initFnTrends() {
  const fnTrendData = fnYearsList.map(y => {
    return RawData.firstNations
      .filter(r => r.first_status === "First Nations people" && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const nonTrendData = fnYearsList.map(y => {
    return RawData.firstNations
      .filter(r => r.first_status === "Non-Indigenous" && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const fnBedDaysData = fnYearsList.map(y => {
    return RawData.firstNations
      .filter(r => r.first_status === "First Nations people" && String(r.year) === y)
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  const baseFN = fnTrendData[0] || 1;
  const baseNon = nonTrendData[0] || 1;
  const fnGrowthIndex = fnTrendData.map(v => +((v / baseFN) * 100).toFixed(1));
  const nonGrowthIndex = nonTrendData.map(v => +((v / baseNon) * 100).toFixed(1));

  fnCharts.fnTrend = new Chart(document.getElementById("c-fn-trend"), {
    type: "line",
    data: {
      labels: fnYearsList,
      datasets: [{
        label: "First Nations Admissions",
        data: fnTrendData,
        borderColor: "#d9480f",
        backgroundColor: "rgba(217,72,15,0.08)",
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.2
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: "#f1f3f5" } }, x: { grid: { display: false } } } }
  });

  fnCharts.growthIndex = new Chart(document.getElementById("c-growth-index"), {
    type: "line",
    data: {
      labels: fnYearsList,
      datasets: [
        { label: "First Nations (+92.5%)", data: fnGrowthIndex, borderColor: "#d9480f", borderWidth: 2, pointRadius: 2.5 },
        { label: "Non-Indigenous (+15.9%)", data: nonGrowthIndex, borderColor: "#1d72b8", borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { boxWidth: 12 } } } }
  });

  fnCharts.fnBeddays = new Chart(document.getElementById("c-fn-beddays-trend"), {
    type: "bar",
    data: {
      labels: fnYearsList,
      datasets: [{ label: "Bed Days", data: fnBedDaysData, backgroundColor: "#f76707", borderRadius: 3 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } } } }
  });

  const totalFN = RawData.firstNations.filter(r => r.first_status === "First Nations people").reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const totalNon = RawData.firstNations.filter(r => r.first_status === "Non-Indigenous").reduce((s, r) => s + (Number(r.hosp) || 0), 0);

  fnCharts.cohortShare = new Chart(document.getElementById("c-cohort-share"), {
    type: "doughnut",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{ data: [totalFN, totalNon], backgroundColor: ["#d9480f", "#ced4da"], borderWidth: 1.5, borderColor: "#fff" }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: "60%" }
  });

  updateFnYear(filterYear.value);
}

function initFnDisparity() {
  if (fnCharts.fnUserBar) {
    fnCharts.fnUserBar.resize();
    fnCharts.nonUserBar.resize();
    fnCharts.pedestrianGap.resize();
    fnCharts.cyclistGap.resize();
    return;
  }

  fnCharts.fnUserBar = new Chart(document.getElementById("c-fn-user-bar"), {
    type: "bar",
    data: { labels: fnUserLabels, datasets: [{ data: [], backgroundColor: "#d9480f", borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } } }
  });

  fnCharts.nonUserBar = new Chart(document.getElementById("c-non-user-bar"), {
    type: "bar",
    data: { labels: fnUserLabels, datasets: [{ data: [], backgroundColor: "#1d72b8", borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } } }
  });

  fnCharts.pedestrianGap = new Chart(document.getElementById("c-pedestrian-gap"), {
    type: "bar",
    data: { labels: ["First Nations", "Non-Indigenous"], datasets: [{ data: [12.1, 6.8], backgroundColor: ["#d9480f", "#1d72b8"], borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Pedestrian Proportion: ${ctx.parsed.y}%` } } }, scales: { y: { ticks: { callback: v => `${v}%` }, max: 15 } } }
  });

  fnCharts.cyclistGap = new Chart(document.getElementById("c-cyclist-gap"), {
    type: "bar",
    data: { labels: ["First Nations", "Non-Indigenous"], datasets: [{ data: [11.1, 19.0], backgroundColor: ["#d9480f", "#1d72b8"], borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Cyclist Proportion: ${ctx.parsed.y}%` } } }, scales: { y: { ticks: { callback: v => `${v}%` }, max: 25 } } }
  });

  updateFnDisparity(filterYear.value);
}

function initFnSeverity() {
  if (fnCharts.losComparison) {
    fnCharts.losComparison.resize();
    fnCharts.fnBeddaysUser.resize();
    return;
  }

  // Categories for LOS comparison
  const compLabels = ["Car, van, ute", "Motorcyclist", "Pedestrian", "Cyclist", "Other/unknown"];
  const fnLosData = compLabels.map(label => {
    const rows = RawData.firstNations.filter(r => r.first_status === "First Nations people" && matchRoadUser(r.road_user, label));
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  const nonLosData = compLabels.map(label => {
    const rows = RawData.firstNations.filter(r => r.first_status === "Non-Indigenous" && matchRoadUser(r.road_user, label));
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  fnCharts.losComparison = new Chart(document.getElementById("c-los-comparison"), {
    type: "bar",
    data: {
      labels: compLabels,
      datasets: [
        { label: "First Nations", data: fnLosData, backgroundColor: "#d9480f", borderRadius: 3 },
        { label: "Non-Indigenous", data: nonLosData, backgroundColor: "#1d72b8", borderRadius: 3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { boxWidth: 10 } } }, scales: { y: { ticks: { callback: v => `${v} d` } } } }
  });

  fnCharts.fnBeddaysUser = new Chart(document.getElementById("c-fn-beddays-user"), {
    type: "bar",
    data: { labels: fnUserLabels, datasets: [{ data: [], backgroundColor: "#f76707", borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } } }
  });

  updateFnSeverity(filterYear.value);
}

function updateFnYear(year) {
  const currentRows = getFnRows(year);
  const fnRowsCurrent = currentRows.filter(r => r.first_status === "First Nations people");
  const nonRowsCurrent = currentRows.filter(r => r.first_status === "Non-Indigenous");

  const fnHospTotal = fnRowsCurrent.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const fnBedsTotal = fnRowsCurrent.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  const nonHospTotal = nonRowsCurrent.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const fnStayDays = fnHospTotal > 0 ? (fnBedsTotal / fnHospTotal).toFixed(2) : "0.00";

  const kpiAdm = document.getElementById("fn-kpi-adm");
  const kpiAdmSub = document.getElementById("fn-kpi-adm-sub");
  const kpiBeds = document.getElementById("fn-kpi-beds");
  const kpiBedsSub = document.getElementById("fn-kpi-beds-sub");
  const kpiNon = document.getElementById("fn-kpi-non");
  const kpiNonSub = document.getElementById("fn-kpi-non-sub");

  if (year === "all") {
    if (kpiAdm) kpiAdm.textContent = fnHospTotal.toLocaleString();
    if (kpiAdmSub) kpiAdmSub.innerHTML = 'Increased by <strong class="trend-up">+92.5%</strong> from 2011 to 2021';
    if (kpiBeds) kpiBeds.textContent = fnBedsTotal.toLocaleString();
    if (kpiBedsSub) kpiBedsSub.innerHTML = `Mean stay: <strong>${fnStayDays} days</strong> (vs 4.82 non-Indigenous)`;
    if (kpiNon) kpiNon.textContent = nonHospTotal.toLocaleString();
    if (kpiNonSub) kpiNonSub.textContent = "Total 1,834,954 bed days recorded";
  } else {
    if (kpiAdm) kpiAdm.textContent = fnHospTotal.toLocaleString();
    if (kpiAdmSub) kpiAdmSub.innerHTML = `Admissions recorded in <strong>${year}</strong>`;
    if (kpiBeds) kpiBeds.textContent = fnBedsTotal.toLocaleString();
    if (kpiBedsSub) kpiBedsSub.innerHTML = `Mean stay: <strong>${fnStayDays} days</strong> in ${year}`;
    if (kpiNon) kpiNon.textContent = nonHospTotal.toLocaleString();
    if (kpiNonSub) kpiNonSub.innerHTML = `Non-Indigenous admissions in <strong>${year}</strong>`;
  }

  const isAll = (year === "all");
  const idx = fnYearsList.indexOf(year);

  if (fnCharts.fnTrend) {
    fnCharts.fnTrend.data.datasets[0].pointRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 8 : 3));
    fnCharts.fnTrend.data.datasets[0].pointHoverRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 10 : 6));
    fnCharts.fnTrend.data.datasets[0].pointBackgroundColor = fnYearsList.map((_, i) => (!isAll && i === idx ? "#e03131" : "#d9480f"));
    fnCharts.fnTrend.data.datasets[0].pointBorderColor = fnYearsList.map(() => "#ffffff");
    fnCharts.fnTrend.data.datasets[0].pointBorderWidth = fnYearsList.map((_, i) => (!isAll && i === idx ? 2 : 1));
    clearChartHoverState(fnCharts.fnTrend);
    fnCharts.fnTrend.update();
  }

  if (fnCharts.fnBeddays) {
    fnCharts.fnBeddays.data.datasets[0].backgroundColor = getBarColorList(
      fnYearsList,
      year,
      ChartTheme.yearTrend.firstNations
    );
    clearChartHoverState(fnCharts.fnBeddays);
    fnCharts.fnBeddays.update();
  }

  if (fnCharts.growthIndex) {
    fnCharts.growthIndex.data.datasets.forEach(ds => {
      ds.pointRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 8 : 2.5));
      ds.pointHoverRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 10 : 5));
      ds.pointBackgroundColor = fnYearsList.map((_, i) => (!isAll && i === idx ? "#e03131" : ds.borderColor));
      ds.pointBorderColor = fnYearsList.map(() => "#ffffff");
      ds.pointBorderWidth = fnYearsList.map((_, i) => (!isAll && i === idx ? 2 : 1));
    });
    clearChartHoverState(fnCharts.growthIndex);
    fnCharts.growthIndex.update();
  }

  updateFnDisparity(year);
  updateFnSeverity(year);
}

function updateFnDisparity(year) {
  const currentRows = getFnRows(year);
  const fnCounts = fnUserLabels.map(label => {
    return currentRows
      .filter(r => r.first_status === "First Nations people" && matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const nonCounts = fnUserLabels.map(label => {
    return currentRows
      .filter(r => r.first_status === "Non-Indigenous" && matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  if (fnCharts.fnUserBar) {
    fnCharts.fnUserBar.data.datasets[0].data = fnCounts;
    fnCharts.fnUserBar.update();
    const tagFn = document.getElementById("tag-fn-user");
    if (tagFn) {
      const fnTot = fnCounts.reduce((a, b) => a + b, 0);
      tagFn.textContent = year === "all" ? "54.8% Car / 19.1% Moto" : `Year ${year}: ${fnTot.toLocaleString()} admissions`;
    }
  }

  if (fnCharts.nonUserBar) {
    fnCharts.nonUserBar.data.datasets[0].data = nonCounts;
    fnCharts.nonUserBar.update();
    const tagNon = document.getElementById("tag-non-user");
    if (tagNon) {
      const nonTot = nonCounts.reduce((a, b) => a + b, 0);
      tagNon.textContent = year === "all" ? "Higher Cyclist Share" : `Year ${year}: ${nonTot.toLocaleString()} admissions`;
    }
  }

  // Pedestrian & Cyclist proportion gaps dynamically
  const fnTotal = fnCounts.reduce((a, b) => a + b, 0);
  const nonTotal = nonCounts.reduce((a, b) => a + b, 0);

  const fnPed = fnCounts[2];
  const nonPed = nonCounts[2];
  const fnPedPct = fnTotal > 0 ? +((fnPed / fnTotal) * 100).toFixed(1) : 0;
  const nonPedPct = nonTotal > 0 ? +((nonPed / nonTotal) * 100).toFixed(1) : 0;

  if (fnCharts.pedestrianGap) {
    fnCharts.pedestrianGap.data.datasets[0].data = [fnPedPct, nonPedPct];
    fnCharts.pedestrianGap.update();
  }

  const fnCyc = fnCounts[3];
  const nonCyc = nonCounts[3];
  const fnCycPct = fnTotal > 0 ? +((fnCyc / fnTotal) * 100).toFixed(1) : 0;
  const nonCycPct = nonTotal > 0 ? +((nonCyc / nonTotal) * 100).toFixed(1) : 0;

  if (fnCharts.cyclistGap) {
    fnCharts.cyclistGap.data.datasets[0].data = [fnCycPct, nonCycPct];
    fnCharts.cyclistGap.update();
  }
}

function updateFnSeverity(year) {
  const currentRows = getFnRows(year);
  const fnBedCounts = fnUserLabels.map(label => {
    return currentRows
      .filter(r => r.first_status === "First Nations people" && matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  if (fnCharts.fnBeddaysUser) {
    fnCharts.fnBeddaysUser.data.datasets[0].data = fnBedCounts;
    fnCharts.fnBeddaysUser.update();
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   MODULE C — STATE & TERRITORY (Aggregations from state_road_user.csv)
═══════════════════════════════════════════════════════════════════════════ */

function getStateRows(stateFilter, yearFilter) {
  return RawData.state.filter(r => {
    if (stateFilter !== "all" && r.state !== stateFilter) return false;
    if (yearFilter !== "all" && String(r.year) !== String(yearFilter)) return false;
    return true;
  });
}

function initState() {
  initStRankings();
  const pageEl = document.getElementById("page-state");
  bindSubTabs(pageEl, target => {
    if (target === "tab-rankings") updateStAnnualChart(filterState.value, filterYear.value);
    if (target === "tab-users") { initStUsers(); updateStFilter(filterState.value); }
    if (target === "tab-length") { initStLength(); updateStFilter(filterState.value); }
  });
}

function initStRankings() {
  // Aggregate state hospitalisations dynamically across all years
  const stateHosp = stNames.map(st => {
    return RawData.state
      .filter(r => r.state === st)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  stCharts.stateRankings = new Chart(document.getElementById("c-state-rankings"), {
    type: "bar",
    data: { labels: stNames, datasets: [{ data: stateHosp, backgroundColor: stNames.map(() => ChartTheme.state.rankings.normal), borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } }, x: { grid: { display: false } } } }
  });

  stCharts.stateShare = new Chart(document.getElementById("c-state-share"), {
    type: "doughnut",
    data: { labels: stNames, datasets: [{ data: stateHosp, backgroundColor: ["#1d72b8", "#339af0", "#4dabf7", "#74c0fc", "#a5d8ff", "#adb5bd", "#ced4da", "#dee2e6"], borderWidth: 1.5, borderColor: "#fff" }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 9.5 } } } }, cutout: "55%" }
  });

  // Calculate LOS for each state from CSV: sum(bed_days) / sum(hosp)
  const losOrder = ["NT", "WA", "Tas", "NSW", "SA", "Vic", "Qld", "ACT"];
  const losValues = losOrder.map(st => {
    const rows = RawData.state.filter(r => r.state === st);
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  stCharts.stateLos = new Chart(document.getElementById("c-state-los"), {
    type: "bar",
    data: { labels: losOrder, datasets: [{ data: losValues, backgroundColor: losOrder.map(() => ChartTheme.state.los.normal), borderRadius: 3 }] },
    options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: v => `${v} d` } } } }
  });

  // Top 3 State Annual Trends (NSW, Vic, Qld) dynamically aggregated
  const top3Datasets = [
    { label: "NSW", st: "NSW", color: "#1d72b8" },
    { label: "VIC", st: "Vic", color: "#339af0" },
    { label: "QLD", st: "Qld", color: "#f59f00" }
  ].map(item => {
    const data = stAnnualYears.map(y => {
      return RawData.state
        .filter(r => r.state === item.st && String(r.year) === y)
        .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    });
    return { label: item.label, data, borderColor: item.color, borderWidth: 2, pointRadius: 3 };
  });

  stCharts.stateAnnual = new Chart(document.getElementById("c-state-annual"), {
    type: "line",
    data: {
      labels: stAnnualYears,
      datasets: top3Datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} (${ctx.label}): ${ctx.parsed.y.toLocaleString()} admissions` } }
      }
    }
  });

  updateStFilter(filterState.value);
}

function initStUsers() {
  if (stCharts.carState) {
    stCharts.carState.resize();
    stCharts.cyclistState.resize();
    stCharts.motoState.resize();
    stCharts.pedState.resize();
    return;
  }

  const makeUserChart = (canvasId, roadUserLabel, color) => {
    const data = stNames.map(st => {
      return RawData.state
        .filter(r => r.state === st && matchRoadUser(r.road_user, roadUserLabel))
        .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    });
    return new Chart(document.getElementById(canvasId), {
      type: "bar",
      data: { labels: stNames, datasets: [{ data, backgroundColor: color, borderRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } } } }
    });
  };

  stCharts.carState = makeUserChart("c-car-state", "Car, van, ute", ChartTheme.state.car.normal);
  stCharts.cyclistState = makeUserChart("c-cyclist-state", "Cyclist", ChartTheme.state.cyclist.normal);
  stCharts.motoState = makeUserChart("c-moto-state", "Motorcyclist", ChartTheme.state.moto.normal);
  stCharts.pedState = makeUserChart("c-ped-state", "Pedestrian", ChartTheme.state.ped.normal);

  updateStFilter(filterState.value);
}

function initStLength() {
  if (stCharts.totBeddaysState) {
    stCharts.totBeddaysState.resize();
    stCharts.deviationBench.resize();
    return;
  }

  const stBedDays = stNames.map(st => {
    return RawData.state
      .filter(r => r.state === st)
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  stCharts.totBeddaysState = new Chart(document.getElementById("c-tot-beddays-state"), {
    type: "bar",
    data: { labels: stNames, datasets: [{ data: stBedDays, backgroundColor: ChartTheme.state.beddays.normal, borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: v => `${v / 1000}k` } } } }
  });

  // Calculate National Average Stay from state data: total beds / total hosp
  const totalStateHosp = RawData.state.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const totalStateBeds = RawData.state.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  const nationalAvg = totalStateHosp > 0 ? +(totalStateBeds / totalStateHosp).toFixed(2) : 4.89;

  const stStayList = stNames.map(st => {
    const rows = RawData.state.filter(r => r.state === st);
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  const deviations = stStayList.map(s => +(s - nationalAvg).toFixed(2));

  stCharts.deviationBench = new Chart(document.getElementById("c-deviation-bench"), {
    type: "bar",
    data: {
      labels: stNames,
      datasets: [{
        label: `Difference from National Benchmark (${nationalAvg}d)`,
        data: deviations,
        backgroundColor: deviations.map(d => d >= 0 ? "#fa5252" : "#40c057"),
        borderRadius: 3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y > 0 ? "+" : ""}${ctx.parsed.y} days vs avg` } } } }
  });

  updateStFilter(filterState.value);
}

function updateStAnnualChart(selectedState, selectedYear) {
  if (!stCharts.stateAnnual) return;

  const annualMap = { NSW: 0, Vic: 1, Qld: 2 };
  const origColors = ["#1d72b8", "#339af0", "#f59f00"];
  const isAllStates = selectedState === "all";
  const isAllYears = selectedYear === "all";
  const yearIdx = stAnnualYears.indexOf(selectedYear);

  stCharts.stateAnnual.data.datasets.forEach((ds, i) => {
    if (isAllStates) {
      ds.borderColor = origColors[i];
      ds.borderWidth = 2;
      ds.borderDash = [];
    } else if (selectedState in annualMap) {
      const selIdx = annualMap[selectedState];
      ds.borderColor = (i === selIdx) ? origColors[i] : "#ced4da";
      ds.borderWidth = (i === selIdx) ? 3 : 1;
      ds.borderDash = [];
    } else {
      ds.borderColor = "#ced4da";
      ds.borderWidth = 1;
      ds.borderDash = [4, 4];
    }

    ds.pointRadius = stAnnualYears.map((_, idx) => (!isAllYears && idx === yearIdx ? 8 : 3));
    ds.pointHoverRadius = stAnnualYears.map((_, idx) => (!isAllYears && idx === yearIdx ? 10 : 6));
    ds.pointBackgroundColor = stAnnualYears.map((_, idx) => (!isAllYears && idx === yearIdx ? "#e03131" : ds.borderColor));
    ds.pointBorderColor = stAnnualYears.map(() => "#ffffff");
    ds.pointBorderWidth = stAnnualYears.map((_, idx) => (!isAllYears && idx === yearIdx ? 2 : 1));
  });

  clearChartHoverState(stCharts.stateAnnual);

  const tagEl = document.getElementById("tag-state-annual");
  if (tagEl) {
    let tagParts = [];
    if (!isAllStates) tagParts.push(`State: ${selectedState}`);
    if (!isAllYears) tagParts.push(`Year: ${selectedYear}`);
    tagEl.textContent = tagParts.length ? tagParts.join(" · ") : "NSW vs VIC vs QLD (2011–2021)";
  }

  stCharts.stateAnnual.update();
}

function updateStYear(selectedYear) {
  updateStAnnualChart(filterState.value, selectedYear);
}

function updateStFilter(selectedState) {
  const badge = document.getElementById("state-active-badge");
  const kpiTotal = document.getElementById("kpi-juris-tot");
  const isAll = selectedState === "all";

  const totalStateHosp = RawData.state.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const subActive = badge ? badge.parentElement.querySelector(".kpi-sub") : null;
  kpiTotal.textContent = totalStateHosp.toLocaleString();

  if (isAll) {
    badge.textContent = "All States";
    if (subActive) subActive.textContent = "Use State filter above to highlight a jurisdiction";
  } else {
    const sHosp = RawData.state
      .filter(r => r.state === selectedState)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const pct = totalStateHosp > 0 ? ((sHosp / totalStateHosp) * 100).toFixed(1) : 0;
    badge.textContent = `${selectedState} — ${sHosp.toLocaleString()} admissions`;
    if (subActive) subActive.textContent = `${pct}% of national total (${selectedState})`;
  }

  // 1. Ranked bar chart
  if (stCharts.stateRankings) {
    stCharts.stateRankings.data.datasets[0].backgroundColor = getBarColorList(stNames, selectedState, ChartTheme.state.rankings);
    stCharts.stateRankings.update();
  }

  // 2. Doughnut proportion
  if (stCharts.stateShare) {
    const baseColors = ["#1d72b8", "#339af0", "#4dabf7", "#74c0fc", "#a5d8ff", "#adb5bd", "#ced4da", "#dee2e6"];
    const idx = stNames.indexOf(selectedState);
    stCharts.stateShare.data.datasets[0].backgroundColor = isAll
      ? baseColors
      : stNames.map((_, i) => (i === idx) ? baseColors[i] : "rgba(206, 212, 218, 0.35)");
    stCharts.stateShare.data.datasets[0].offset = isAll
      ? stNames.map(() => 0)
      : stNames.map((_, i) => (i === idx) ? 14 : 0);
    stCharts.stateShare.update();
  }

  // 3. Length of stay horizontal bar
  const losOrder = ["NT", "WA", "Tas", "NSW", "SA", "Vic", "Qld", "ACT"];
  if (stCharts.stateLos) {
    stCharts.stateLos.data.datasets[0].backgroundColor = getBarColorList(losOrder, selectedState, ChartTheme.state.los);
    stCharts.stateLos.update();
  }

  // 4. Annual trend line
  updateStAnnualChart(selectedState, filterYear.value);

  // 5. Road Users
  [
    { chart: stCharts.carState,     theme: ChartTheme.state.car },
    { chart: stCharts.cyclistState, theme: ChartTheme.state.cyclist },
    { chart: stCharts.motoState,    theme: ChartTheme.state.moto },
    { chart: stCharts.pedState,     theme: ChartTheme.state.ped }
  ].forEach(({ chart, theme }) => {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor = getBarColorList(stNames, selectedState, theme);
    chart.update();
  });

  // 6. Bed days & deviations
  if (stCharts.totBeddaysState) {
    stCharts.totBeddaysState.data.datasets[0].backgroundColor = getBarColorList(stNames, selectedState, ChartTheme.state.beddays);
    stCharts.totBeddaysState.update();
  }

  if (stCharts.deviationBench) {
    const totalH = RawData.state.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const totalB = RawData.state.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    const natAvg = totalH > 0 ? +(totalB / totalH).toFixed(2) : 4.89;

    const devColors = stNames.map(st => {
      const rows = RawData.state.filter(r => r.state === st);
      const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
      const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
      const diff = h > 0 ? (b / h) - natAvg : 0;
      return diff >= 0 ? "#fa5252" : "#40c057";
    });

    const devDim = devColors.map(c => c === "#fa5252" ? "rgba(250,82,82,0.22)" : "rgba(64,192,87,0.22)");

    stCharts.deviationBench.data.datasets[0].backgroundColor = isAll
      ? devColors
      : stNames.map((st, i) => (st === selectedState) ? devColors[i] : devDim[i]);
    stCharts.deviationBench.update();
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   PAGE / DATA SWITCHING & FILTER HANDLERS
═══════════════════════════════════════════════════════════════════════════ */
function switchData(dataKey) {
  currentData = dataKey;

  document.querySelectorAll(".db-page").forEach(p => p.classList.remove("active"));
  document.getElementById(`page-${dataKey}`).classList.add("active");

  syncFilterState(dataKey);

  if (!pageInited[dataKey]) {
    const initFns = { national: initNational, firstnations: initFirstNations, state: initState };
    initFns[dataKey]();
    pageInited[dataKey] = true;
  }

  applyYearFilter(filterYear.value);

  if (dataKey === "state") {
    updateStFilter(filterState.value);
  }

  updateBadge(dataKey, filterYear.value, filterState.value);
}

function applyYearFilter(year) {
  if (currentData === "national") updateNatYear(year);
  if (currentData === "firstnations") updateFnYear(year);
  if (currentData === "state") updateStYear(year);
  updateBadge(currentData, year, filterState.value);
}

filterData.addEventListener("change", () => {
  switchData(filterData.value);
});

filterYear.addEventListener("change", () => {
  applyYearFilter(filterYear.value);
});

filterState.addEventListener("change", () => {
  if (!filterState.disabled) {
    updateStFilter(filterState.value);
  }
  updateBadge(currentData, filterYear.value, filterState.value);
});

btnReset.addEventListener("click", () => {
  filterYear.value = "all";
  filterState.value = "all";
  applyYearFilter("all");
  if (currentData === "state") {
    updateStFilter("all");
  }
  updateBadge(currentData, "all", "all");
});


/* ═══════════════════════════════════════════════════════════════════════════
   CSV ASYNC DATA LOADER
═══════════════════════════════════════════════════════════════════════════ */
function parseCSVText(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let c of lines[i]) {
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) { row.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    row.push(cur.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx] ? row[idx].replace(/^"|"$/g, '').trim() : '';
      if (!isNaN(val) && val !== '') val = Number(val);
      obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

async function loadCSV(url) {
  if (window.Papa && typeof window.Papa.parse === "function") {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: res => resolve(res.data),
        error: err => reject(err)
      });
    });
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} reading ${url}`);
    const text = await res.text();
    return parseCSVText(text);
  }
}

async function initApp() {
  const loadingEl = document.getElementById("db-loading");
  try {
    const [nat, fn, st] = await Promise.all([
      loadCSV("data/Hospitalisation.csv"),
      loadCSV("data/first_nations_road_user.csv"),
      loadCSV("data/state_road_user.csv")
    ]);

    RawData.national = nat || [];
    RawData.firstNations = fn || [];
    RawData.state = st || [];

    // Hide loading overlay
    if (loadingEl) loadingEl.style.display = "none";

    // Boot default view
    switchData("national");
  } catch (err) {
    console.error("Failed to load CSV datasets:", err);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="db-error-box">
          <h3>Failed to Load Data CSVs</h3>
          <p>Browser security prevents reading local files directly via <code>file:///</code> protocol.</p>
          <p>Please open this folder using <strong>Live Server in VS Code</strong> (right-click <code>index.html</code> &rarr; <em>Open with Live Server</em>) or a local HTTP server (<code>python -m http.server</code>).</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
