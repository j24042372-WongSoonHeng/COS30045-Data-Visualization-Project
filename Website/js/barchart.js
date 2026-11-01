// ─── Module B: National Overview Bar Charts ─────────────────────────────────

// Road user hospitalisations bar chart
function initNatRoadUsersHospBar() {
  natCharts.roadUsersHosp = new Chart(document.getElementById("c-road-users-hosp"), {
    type: "bar",
    data: {
      labels: natUserLabels,
      datasets: [{
        data: [],
        backgroundColor: natUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { grid: { color: "#f1f3f5" } },
        x: { grid: { display: false }, ticks: { font: { size: 9 } } }
      }
    }
  });
}

function updateNatRoadUsersHospBar(userCounts) {
  if (!natCharts.roadUsersHosp) return;
  natCharts.roadUsersHosp.data.datasets[0].data = userCounts;
  natCharts.roadUsersHosp.update();
}

// Annual bed days trend bar chart
function initNatBedDaysTrendBar(annualBeds) {
  natCharts.bedDaysTrend = new Chart(document.getElementById("c-bed-days-trend"), {
    type: "bar",
    data: {
      labels: natYearsList,
      datasets: [{
        data: annualBeds,
        backgroundColor: RoadUserColors["Heavy transport"],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { grid: { color: "#f1f3f5" }, ticks: { callback: v => `${v / 1000}k` } },
        x: { grid: { display: false } }
      }
    }
  });
}

function updateNatBedDaysTrendBar(year) {
  if (!natCharts.bedDaysTrend) return;
  natCharts.bedDaysTrend.data.datasets[0].backgroundColor = getBarColorList(
    natYearsList,
    year,
    ChartTheme.yearTrend.national
  );
  clearChartHoverState(natCharts.bedDaysTrend);
  natCharts.bedDaysTrend.update();
}

// User total bed days bar chart
function initNatUserBedDaysBar() {
  natCharts.userBeddays = new Chart(document.getElementById("c-user-beddays"), {
    type: "bar",
    data: {
      labels: natUserLabels,
      datasets: [{
        data: [],
        backgroundColor: natUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } },
        x: { ticks: { font: { size: 9 } } }
      }
    }
  });
}

function updateNatUserBedDaysBar(userBedDays) {
  if (!natCharts.userBeddays) return;
  natCharts.userBeddays.data.datasets[0].data = userBedDays;
  clearChartHoverState(natCharts.userBeddays);
  natCharts.userBeddays.update();
}

// User length of stay horizontal bar chart
function initNatUserLosBar() {
  natCharts.userLos = new Chart(document.getElementById("c-user-los"), {
    type: "bar",
    data: {
      labels: natUserLabels,
      datasets: [{
        data: [],
        backgroundColor: natUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Avg Stay: ${ctx.parsed.x} days` } }
      },
      scales: {
        x: { ticks: { callback: v => `${v} d` } }
      }
    }
  });
}

function updateNatUserLosBar(userLos) {
  if (!natCharts.userLos) return;
  natCharts.userLos.data.datasets[0].data = userLos;
  clearChartHoverState(natCharts.userLos);
  natCharts.userLos.update();
}

// All causes bar chart
function initNatCausesBar(causesLabels) {
  natCharts.allCauses = new Chart(document.getElementById("c-all-causes"), {
    type: "bar",
    data: {
      labels: causesLabels,
      datasets: [{
        data: [],
        backgroundColor: ["#0072B2", "#56B4E9", "#999990", "#E69F00"],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } }
      }
    }
  });
}

function updateNatCausesBar(causesData) {
  if (!natCharts.allCauses) return;
  natCharts.allCauses.data.datasets[0].data = causesData;
  natCharts.allCauses.update();
}


// ─── Module C: First Nations Bar Charts ─────────────────────────────────────

// Annual bed days trend bar chart
function initFnBedDaysBar(fnBedDaysData) {
  fnCharts.fnBeddays = new Chart(document.getElementById("c-fn-beddays-trend"), {
    type: "bar",
    data: {
      labels: fnYearsList,
      datasets: [{
        label: "Bed Days",
        data: fnBedDaysData,
        backgroundColor: RoadUserColors["Bus occupant"],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      }
    }
  });
}

function updateFnBedDaysBar(year) {
  if (!fnCharts.fnBeddays) return;
  fnCharts.fnBeddays.data.datasets[0].backgroundColor = getBarColorList(
    fnYearsList,
    year,
    ChartTheme.yearTrend.firstNations
  );
  clearChartHoverState(fnCharts.fnBeddays);
  fnCharts.fnBeddays.update();
}

// First Nations road user composition bar chart
function initFnUserBar() {
  fnCharts.fnUserBar = new Chart(document.getElementById("c-fn-user-bar"), {
    type: "bar",
    data: {
      labels: fnUserLabels,
      datasets: [{
        data: [],
        backgroundColor: fnUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } },
        x: { ticks: { font: { size: 9 } } }
      }
    }
  });
}

function updateFnUserBar(counts) {
  if (!fnCharts.fnUserBar) return;
  fnCharts.fnUserBar.data.datasets[0].data = counts;
  clearChartHoverState(fnCharts.fnUserBar);
  fnCharts.fnUserBar.update();
}

// Non-Indigenous road user composition bar chart
function initNonUserBar() {
  fnCharts.nonUserBar = new Chart(document.getElementById("c-non-user-bar"), {
    type: "bar",
    data: {
      labels: fnUserLabels,
      datasets: [{
        data: [],
        backgroundColor: fnUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } },
        x: { ticks: { font: { size: 9 } } }
      }
    }
  });
}

function updateNonUserBar(counts) {
  if (!fnCharts.nonUserBar) return;
  fnCharts.nonUserBar.data.datasets[0].data = counts;
  clearChartHoverState(fnCharts.nonUserBar);
  fnCharts.nonUserBar.update();
}

// Pedestrian disparity bar chart
function initFnPedGapBar() {
  fnCharts.pedestrianGap = new Chart(document.getElementById("c-pedestrian-gap"), {
    type: "bar",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{
        data: [12.1, 6.8],
        backgroundColor: [RoadUserColors["Motorcyclist"], RoadUserColors["Car, van, ute"]],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Pedestrian Proportion: ${ctx.parsed.y}%` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v}%` }, max: 15 }
      }
    }
  });
}

// Cyclist disparity bar chart
function initFnCycGapBar() {
  fnCharts.cyclistGap = new Chart(document.getElementById("c-cyclist-gap"), {
    type: "bar",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{
        data: [11.1, 19.0],
        backgroundColor: [RoadUserColors["Motorcyclist"], RoadUserColors["Car, van, ute"]],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Cyclist Proportion: ${ctx.parsed.y}%` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v}%` }, max: 25 }
      }
    }
  });
}

// Length of stay comparison bar chart
function initFnLosCompBar(compLabels, fnLosData, nonLosData) {
  fnCharts.losComparison = new Chart(document.getElementById("c-los-comparison"), {
    type: "bar",
    data: {
      labels: compLabels,
      datasets: [
        { label: "First Nations", data: fnLosData, backgroundColor: RoadUserColors["Motorcyclist"], borderRadius: 3 },
        { label: "Non-Indigenous", data: nonLosData, backgroundColor: RoadUserColors["Car, van, ute"], borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 10 } }
      },
      scales: {
        y: { ticks: { callback: v => `${v} d` } }
      }
    }
  });
}

// First Nations user bed days bar chart
function initFnBeddaysUserBar() {
  fnCharts.fnBeddaysUser = new Chart(document.getElementById("c-fn-beddays-user"), {
    type: "bar",
    data: {
      labels: fnUserLabels,
      datasets: [{
        data: [],
        backgroundColor: fnUserLabels.map(u => RoadUserColors[u]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } },
        x: { ticks: { font: { size: 9 } } }
      }
    }
  });
}

function updateFnBeddaysUserBar(beddays) {
  if (!fnCharts.fnBeddaysUser) return;
  fnCharts.fnBeddaysUser.data.datasets[0].data = beddays;
  clearChartHoverState(fnCharts.fnBeddaysUser);
  fnCharts.fnBeddaysUser.update();
}


// ─── Module D: State & Territory Bar Charts ─────────────────────────────────

// Jurisdiction hospitalisations rankings bar chart
function initStRankingsBar(stateHosp) {
  stCharts.stateRankings = new Chart(document.getElementById("c-state-rankings"), {
    type: "bar",
    data: {
      labels: stNames,
      datasets: [{
        data: stateHosp,
        backgroundColor: stNames.map(st => StateColors[st]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { ticks: { callback: v => `${v / 1000}k` } },
        x: { grid: { display: false } }
      }
    }
  });
}

function updateStRankingsBar(selectedState) {
  if (!stCharts.stateRankings) return;
  const isAll = (!selectedState || selectedState === "all");
  stCharts.stateRankings.data.datasets[0].backgroundColor = isAll
    ? stNames.map(st => StateColors[st])
    : stNames.map(st => (st === selectedState) ? StateColors[st] : hexToRgba(StateColors[st], 0.22));
  stCharts.stateRankings.update();
}

// Length of stay horizontal bar chart
function initStLosBar(losOrder, losValues) {
  stCharts.stateLos = new Chart(document.getElementById("c-state-los"), {
    type: "bar",
    data: {
      labels: losOrder,
      datasets: [{
        data: losValues,
        backgroundColor: losOrder.map(st => StateColors[st]),
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => `${v} d` } } }
    }
  });
}

function updateStLosBar(selectedState) {
  if (!stCharts.stateLos) return;
  const losOrder = ["NT", "WA", "Tas", "NSW", "SA", "Vic", "Qld", "ACT"];
  const isAll = (!selectedState || selectedState === "all");
  stCharts.stateLos.data.datasets[0].backgroundColor = isAll
    ? losOrder.map(st => StateColors[st])
    : losOrder.map(st => (st === selectedState) ? StateColors[st] : hexToRgba(StateColors[st], 0.22));
  stCharts.stateLos.update();
}

// Factory for road user breakdowns by state (colored by State palette)
function makeStUserBarChart(canvasId, roadUserLabel) {
  const data = stNames.map(st => {
    return RawData.state
      .filter(r => r.state === st && matchRoadUser(r.road_user, roadUserLabel))
      .reduce((s, r) => s + (Number(r.hosp) || 0), 0);
  });
  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: stNames,
      datasets: [{
        data,
        backgroundColor: stNames.map(st => StateColors[st]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${roadUserLabel} (${ctx.label}): ${ctx.parsed.y.toLocaleString()} admissions`
          }
        }
      },
      scales: { y: { ticks: { callback: v => `${v / 1000}k` } } }
    }
  });
}

function initStUserBars() {
  stCharts.carState = makeStUserBarChart("c-car-state", "Car, van, ute");
  stCharts.cyclistState = makeStUserBarChart("c-cyclist-state", "Cyclist");
  stCharts.motoState = makeStUserBarChart("c-moto-state", "Motorcyclist");
  stCharts.pedState = makeStUserBarChart("c-ped-state", "Pedestrian");
}

function updateStUserBars(selectedState) {
  const isAll = (!selectedState || selectedState === "all");
  [
    stCharts.carState,
    stCharts.cyclistState,
    stCharts.motoState,
    stCharts.pedState
  ].forEach(chart => {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor = isAll
      ? stNames.map(st => StateColors[st])
      : stNames.map(st => (st === selectedState) ? StateColors[st] : hexToRgba(StateColors[st], 0.22));
    chart.update();
  });
}

// Total bed days by state bar chart
function initStBeddaysBar(stBedDays) {
  stCharts.totBeddaysState = new Chart(document.getElementById("c-tot-beddays-state"), {
    type: "bar",
    data: {
      labels: stNames,
      datasets: [{
        data: stBedDays,
        backgroundColor: stNames.map(st => StateColors[st]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: v => `${v / 1000}k` } } }
    }
  });
}

function updateStBeddaysBar(selectedState) {
  if (!stCharts.totBeddaysState) return;
  const isAll = (!selectedState || selectedState === "all");
  stCharts.totBeddaysState.data.datasets[0].backgroundColor = isAll
    ? stNames.map(st => StateColors[st])
    : stNames.map(st => (st === selectedState) ? StateColors[st] : hexToRgba(StateColors[st], 0.22));
  stCharts.totBeddaysState.update();
}

// Benchmark deviation bar chart (colored by State palette)
function initStDeviationBar(deviations, nationalAvg) {
  stCharts.deviationBench = new Chart(document.getElementById("c-deviation-bench"), {
    type: "bar",
    data: {
      labels: stNames,
      datasets: [{
        label: `Difference from National Benchmark (${nationalAvg}d)`,
        data: deviations,
        backgroundColor: stNames.map(st => StateColors[st]),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed.y > 0 ? "+" : ""}${ctx.parsed.y} days vs avg`
          }
        }
      }
    }
  });
}

function updateStDeviationBar(selectedState) {
  if (!stCharts.deviationBench) return;
  const isAll = (!selectedState || selectedState === "all");
  stCharts.deviationBench.data.datasets[0].backgroundColor = isAll
    ? stNames.map(st => StateColors[st])
    : stNames.map(st => (st === selectedState) ? StateColors[st] : hexToRgba(StateColors[st], 0.22));
  stCharts.deviationBench.update();
}

