// ─── Chart.js Hover State Clearing ──────────────────────────────────────────
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
    // Graceful fallback for chart hover clearing
  }
}

// ─── Sub-tab Navigation Binding ─────────────────────────────────────────────
function bindSubTabs(container, onSwitch) {
  if (!container) return;
  const navBtns = container.querySelectorAll(".nav-btn");
  const panels = container.querySelectorAll(".view-panel");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab || btn.dataset.target;
      navBtns.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = container.querySelector(`#${targetId}`);
      if (targetPanel) targetPanel.classList.add("active");

      if (typeof onSwitch === "function") onSwitch(targetId);
    });
  });
}


// ─── Module B: National Overview Coordinator ────────────────────────────────
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

  initNatAnnualTrendLine(annualHosp);
  initNatRoadUsersHospBar();
  initNatBedDaysTrendBar(annualBeds);
  initNatRoadUserPie();

  updateNatOverview(filterYear.value);
}

function updateNatOverview(year) {
  const trafficRows = getNatTrafficRows(year);
  const totalHosp = trafficRows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const totalBeds = trafficRows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  const avgLos = totalHosp > 0 ? (totalBeds / totalHosp).toFixed(2) : "0.00";

  document.getElementById("kpi-hosp").textContent = totalHosp.toLocaleString();
  document.getElementById("kpi-beddays").textContent = totalBeds.toLocaleString();
  document.getElementById("kpi-los").innerHTML = `${avgLos} <small>days</small>`;

  const userCounts = natUserLabels.map(label => {
    return trafficRows
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  updateNatRoadUsersHospBar(userCounts);
  updateNatRoadUserPie(userCounts);
  updateNatAnnualTrendLine(year);
  updateNatBedDaysTrendBar(year);
}

function initNatRoadUsers() {
  if (natCharts.userBeddays) {
    natCharts.userBeddays.resize();
    natCharts.userLos.resize();
    natCharts.twoWheel.resize();
    natCharts.pedestrianTrend.resize();
    return;
  }

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

  initNatUserBedDaysBar();
  initNatUserLosBar();
  initNatTwoWheelLine(motoAnnual, cycAnnual);
  initNatPedestrianLine(pedAnnual);

  updateNatRoadUsers(filterYear.value);
}

function updateNatRoadUsers(year) {
  const trafficRows = getNatTrafficRows(year);
  const isAll = (year === "all");

  const userBedDays = natUserLabels.map(label => {
    return trafficRows
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  const totalBedsYear = userBedDays.reduce((a, b) => a + b, 0);
  updateNatUserBedDaysBar(userBedDays);

  const tagBedDays = document.getElementById("tag-user-beddays");
  if (tagBedDays) {
    tagBedDays.textContent = isAll
      ? "Healthcare Load (2011–2021)"
      : `Year ${year}: ${totalBedsYear.toLocaleString()} bed days`;
  }

  const userLos = natUserLabels.map(label => {
    const rows = trafficRows.filter(r => matchRoadUser(r.road_user, label));
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(1) : 0;
  });

  const overallStay = totalBedsYear > 0 && trafficRows.length
    ? (totalBedsYear / trafficRows.reduce((s, r) => s + (Number(r.hosp) || 0), 0)).toFixed(1)
    : 4.89;

  updateNatUserLosBar(userLos);

  const tagLos = document.getElementById("tag-user-los");
  if (tagLos) {
    tagLos.textContent = isAll
      ? "Days per admission (10-Yr Mean)"
      : `Year ${year} (Mean ${overallStay} days)`;
  }

  updateNatTwoWheelLine(year);

  const pedHospYear = trafficRows
    .filter(r => matchRoadUser(r.road_user, "Pedestrian"))
    .reduce((s, r) => s + (Number(r.hosp) || 0), 0);

  updateNatPedestrianLine(year, pedHospYear);
}

function initNatCauses() {
  if (natCharts.allCauses) {
    natCharts.allCauses.resize();
    natCharts.transportPie.resize();
    return;
  }

  const causesLabels = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];
  initNatCausesBar(causesLabels);
  initNatTransportPie(causesLabels);

  updateNatCauses(filterYear.value);
}

function updateNatCauses(year) {
  const causesLabels = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];
  const rows = RawData.national.filter(r => year === "all" || String(r.year) === String(year));

  const counts = causesLabels.map(c => {
    return rows
      .filter(r => r.cause_of_injury === c)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  updateNatCausesBar(counts);
  updateNatTransportPie(counts);
}


// ─── Module C: First Nations Coordinator ────────────────────────────────────
function initFirstNations() {
  initFnTrend();
  const pageEl = document.getElementById("page-firstnations");
  bindSubTabs(pageEl, target => {
    if (target === "tab-trends" || target === "tab-trend") updateFnYear(filterYear.value);
    if (target === "tab-roaduser-disparity" || target === "tab-disparity") { initFnDisparity(); updateFnDisparity(filterYear.value); }
    if (target === "tab-severity") { initFnSeverity(); updateFnSeverity(filterYear.value); }
  });
}

function initFnTrend() {
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

  const baseFN = fnTrendData[0] || 1083;
  const baseNon = nonTrendData[0] || 32900;
  const fnGrowthIndex = fnTrendData.map(v => +((v / baseFN) * 100).toFixed(1));
  const nonGrowthIndex = nonTrendData.map(v => +((v / baseNon) * 100).toFixed(1));

  initFnTrendLine(fnTrendData);
  initFnGrowthIndexLine(fnGrowthIndex, nonGrowthIndex);
  initFnBedDaysBar(fnBedDaysData);

  const totalFN = RawData.firstNations.filter(r => r.first_status === "First Nations people").reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const totalNon = RawData.firstNations.filter(r => r.first_status === "Non-Indigenous").reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  initFnCohortSharePie(totalFN, totalNon);

  updateFnYear(filterYear.value);
}

function updateFnYear(year) {
  const currentRows = getFnRows(year);
  const fnRowsCurrent = currentRows.filter(r => r.first_status === "First Nations people");
  const fnHospTotal = fnRowsCurrent.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const fnBedsTotal = fnRowsCurrent.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);

  const kpiHosp = document.querySelector("#page-firstnations .kpi-strip .kpi-card:nth-child(1) .kpi-val");
  const kpiGrowth = document.querySelector("#page-firstnations .kpi-strip .kpi-card:nth-child(2) .kpi-val");
  const kpiBeds = document.querySelector("#page-firstnations .kpi-strip .kpi-card:nth-child(3) .kpi-val");

  if (kpiHosp) kpiHosp.textContent = fnHospTotal.toLocaleString();
  if (kpiGrowth) kpiGrowth.textContent = (year === "all") ? "+92.5%" : `Year ${year}`;
  if (kpiBeds) kpiBeds.textContent = fnBedsTotal.toLocaleString();

  updateFnTrendLine(year);
  updateFnGrowthIndexLine(year);
  updateFnBedDaysBar(year);
}

function initFnDisparity() {
  if (fnCharts.fnUserBar) {
    fnCharts.fnUserBar.resize();
    fnCharts.nonUserBar.resize();
    fnCharts.pedestrianGap.resize();
    fnCharts.cyclistGap.resize();
    return;
  }

  initFnUserBar();
  initNonUserBar();
  initFnPedGapBar();
  initFnCycGapBar();

  updateFnDisparity(filterYear.value);
}

function updateFnDisparity(year) {
  const currentRows = getFnRows(year);
  const fnRowsCurrent = currentRows.filter(r => r.first_status === "First Nations people");
  const nonRowsCurrent = currentRows.filter(r => r.first_status === "Non-Indigenous");

  const fnCounts = fnUserLabels.map(label => {
    return fnRowsCurrent
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  const nonCounts = fnUserLabels.map(label => {
    return nonRowsCurrent
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  updateFnUserBar(fnCounts);
  updateNonUserBar(nonCounts);

  const tagFn = document.getElementById("tag-fn-user");
  const tagNon = document.getElementById("tag-non-user");
  const fnTot = fnCounts.reduce((a, b) => a + b, 0);
  const nonTot = nonCounts.reduce((a, b) => a + b, 0);

  if (tagFn) tagFn.textContent = (year === "all") ? "54.8% Car / 19.1% Moto" : `Year ${year}: ${fnTot.toLocaleString()} admissions`;
  if (tagNon) tagNon.textContent = (year === "all") ? "Higher Cyclist Share" : `Year ${year}: ${nonTot.toLocaleString()} admissions`;
}

function initFnSeverity() {
  if (fnCharts.losComparison) {
    fnCharts.losComparison.resize();
    fnCharts.fnBeddaysUser.resize();
    return;
  }

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

  initFnLosCompBar(compLabels, fnLosData, nonLosData);
  initFnBeddaysUserBar();

  updateFnSeverity(filterYear.value);
}

function updateFnSeverity(year) {
  const currentRows = getFnRows(year);
  const fnRowsCurrent = currentRows.filter(r => r.first_status === "First Nations people");

  const beddays = fnUserLabels.map(label => {
    return fnRowsCurrent
      .filter(r => matchRoadUser(r.road_user, label))
      .reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
  });

  updateFnBeddaysUserBar(beddays);
}


// ─── Module D: State & Territory Coordinator ────────────────────────────────
function initState() {
  initStRankings();
  const pageEl = document.getElementById("page-state");
  bindSubTabs(pageEl, target => {
    if (target === "tab-rankings") updateStFilter(filterState.value);
    if (target === "tab-users") { initStUsers(); updateStFilter(filterState.value); }
    if (target === "tab-length") { initStLength(); updateStFilter(filterState.value); }
  });
}

function initStRankings() {
  const stateHosp = stNames.map(st => {
    return RawData.state
      .filter(r => r.state === st)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });

  initStRankingsBar(stateHosp);
  initStSharePie(stateHosp);

  const losOrder = ["NT", "WA", "Tas", "NSW", "SA", "Vic", "Qld", "ACT"];
  const losValues = losOrder.map(st => {
    const rows = RawData.state.filter(r => r.state === st);
    const h = rows.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const b = rows.reduce((s, r) => s + (Number(r.bed_days_excl_died) || 0), 0);
    return h > 0 ? +(b / h).toFixed(2) : 0;
  });

  initStLosBar(losOrder, losValues);

  const top3Datasets = [
    { label: "NSW", st: "NSW", color: StateColors["NSW"] },
    { label: "VIC", st: "Vic", color: StateColors["Vic"] },
    { label: "QLD", st: "Qld", color: StateColors["Qld"] }
  ].map(item => {
    const data = stAnnualYears.map(y => {
      return RawData.state
        .filter(r => r.state === item.st && String(r.year) === y)
        .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    });
    return { label: item.label, data, borderColor: item.color, borderWidth: 2, pointRadius: 3 };
  });

  initStAnnualLine(top3Datasets);
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

  initStUserBars();
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

  initStBeddaysBar(stBedDays);

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
  initStDeviationBar(deviations, nationalAvg);

  updateStFilter(filterState.value);
}

function updateStYear(selectedYear) {
  updateStAnnualChart(filterState.value, selectedYear);
}

function updateStFilter(selectedState) {
  const badge = document.getElementById("state-active-badge");
  const kpiTotal = document.getElementById("kpi-juris-tot");
  const isAll = (selectedState === "all");

  const totalStateHosp = RawData.state.reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  const subActive = (badge && badge.parentElement && typeof badge.parentElement.querySelector === "function")
    ? badge.parentElement.querySelector(".kpi-sub")
    : null;
  if (kpiTotal) kpiTotal.textContent = totalStateHosp.toLocaleString();

  if (isAll) {
    if (badge) badge.textContent = "All States";
    if (subActive) subActive.textContent = "Use State filter above to highlight a jurisdiction";
  } else {
    const sHosp = RawData.state
      .filter(r => r.state === selectedState)
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
    const pct = totalStateHosp > 0 ? ((sHosp / totalStateHosp) * 100).toFixed(1) : 0;
    if (badge) badge.textContent = `${selectedState} — ${sHosp.toLocaleString()} admissions`;
    if (subActive) subActive.textContent = `${pct}% of national total (${selectedState})`;
  }

  updateStRankingsBar(selectedState);
  updateStShareChart(selectedState);
  updateStLosBar(selectedState);
  updateStAnnualChart(selectedState, filterYear.value);
  updateStUserBars(selectedState);
  updateStBeddaysBar(selectedState);
  updateStDeviationBar(selectedState);
}


// ─── Module Switch & Filter Listeners ───────────────────────────────────────
function switchData(dataKey) {
  currentData = dataKey;

  document.querySelectorAll(".db-page").forEach(p => p.classList.remove("active"));
  const targetPage = document.getElementById(`page-${dataKey}`);
  if (targetPage) targetPage.classList.add("active");

  const filterStateEl = document.getElementById("filter-state");
  if (dataKey === "state") {
    filterStateEl.disabled = false;
    filterStateEl.style.opacity = "1";
    filterStateEl.style.cursor = "default";
  } else {
    filterStateEl.disabled = true;
    filterStateEl.style.opacity = "0.45";
    filterStateEl.style.cursor = "not-allowed";
  }

  const badges = {
    national: "All Traffic Events · Australia",
    firstnations: "Indigenous Road Safety Disparity · Australia",
    state: "Jurisdictional Analysis · Australia"
  };
  const scopeBadgeEl = document.getElementById("db-scope-badge");
  if (scopeBadgeEl) scopeBadgeEl.textContent = badges[dataKey] || badges.national;

  if (dataKey === "national") {
    if (!pageInited.national) {
      initNational();
      pageInited.national = true;
    } else {
      updateNatOverview(filterYear.value);
    }
  } else if (dataKey === "firstnations") {
    if (!pageInited.firstnations) {
      initFirstNations();
      pageInited.firstnations = true;
    } else {
      updateFnYear(filterYear.value);
    }
  } else if (dataKey === "state") {
    if (!pageInited.state) {
      initState();
      pageInited.state = true;
    } else {
      updateStFilter(filterState.value);
    }
  }
}

function resetAllFilters() {
  filterYear.value = "all";
  filterState.value = "all";
  if (filterData) filterData.value = currentData;

  const allCharts = [
    natCharts.annualTrend, natCharts.bedDaysTrend, natCharts.twoWheel, natCharts.pedestrianTrend,
    natCharts.roadUsersHosp, natCharts.roadUserPie, natCharts.userBeddays, natCharts.userLos,
    natCharts.allCauses, natCharts.transportPie,
    fnCharts.fnTrend, fnCharts.growthIndex, fnCharts.fnBeddays, fnCharts.fnUserBar, fnCharts.nonUserBar,
    fnCharts.pedestrianGap, fnCharts.cyclistGap, fnCharts.losComparison, fnCharts.fnBeddaysUser,
    stCharts.stateAnnual, stCharts.stateRankings, stCharts.stateLos, stCharts.stateShare,
    stCharts.carState, stCharts.cyclistState, stCharts.motoState, stCharts.pedState,
    stCharts.totBeddaysState, stCharts.deviationBench
  ];
  allCharts.forEach(c => clearChartHoverState(c));

  if (currentData === "national") {
    updateNatOverview("all");
    const activeTab = document.querySelector("#page-national .nav-btn.active");
    const tabTarget = activeTab ? (activeTab.dataset.tab || activeTab.dataset.target) : null;
    if (tabTarget === "tab-roadusers") updateNatRoadUsers("all");
    if (tabTarget === "tab-causes") updateNatCauses("all");
  } else if (currentData === "firstnations") {
    updateFnYear("all");
    const activeTab = document.querySelector("#page-firstnations .nav-btn.active");
    const tabTarget = activeTab ? (activeTab.dataset.tab || activeTab.dataset.target) : null;
    if (tabTarget === "tab-roaduser-disparity" || tabTarget === "tab-disparity") updateFnDisparity("all");
    if (tabTarget === "tab-severity") updateFnSeverity("all");
  } else if (currentData === "state") {
    updateStYear("all");
    updateStFilter("all");
  }
}

function setupGlobalFilterListeners() {
  if (filterData) {
    filterData.addEventListener("change", e => {
      switchData(e.target.value);
    });
  }

  if (filterYear) {
    filterYear.addEventListener("change", e => {
      const year = e.target.value;
      if (currentData === "national") {
        updateNatOverview(year);
        const activeTab = document.querySelector("#page-national .nav-btn.active");
        const tabTarget = activeTab ? (activeTab.dataset.tab || activeTab.dataset.target) : null;
        if (tabTarget === "tab-roadusers") updateNatRoadUsers(year);
        if (tabTarget === "tab-causes") updateNatCauses(year);
      } else if (currentData === "firstnations") {
        updateFnYear(year);
        const activeTab = document.querySelector("#page-firstnations .nav-btn.active");
        const tabTarget = activeTab ? (activeTab.dataset.tab || activeTab.dataset.target) : null;
        if (tabTarget === "tab-roaduser-disparity" || tabTarget === "tab-disparity") updateFnDisparity(year);
        if (tabTarget === "tab-severity") updateFnSeverity(year);
      } else if (currentData === "state") {
        updateStYear(year);
      }
    });
  }

  if (filterState) {
    filterState.addEventListener("change", e => {
      if (currentData === "state") {
        updateStFilter(e.target.value);
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", resetAllFilters);
  }
}

