// ─── Module B: National Overview Line Charts ────────────────────────────────

// Annual traffic hospitalisations line trend
function initNatAnnualTrendLine(annualHosp) {
  natCharts.annualTrend = new Chart(document.getElementById("c-annual-trend"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [{
        label: "Hospitalisations",
        data: annualHosp,
        borderColor: RoadUserColors["Car, van, ute"],
        backgroundColor: hexToRgba(RoadUserColors["Car, van, ute"], 0.08),
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Admissions: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        y: { min: 30000, grid: { color: "#f1f3f5" } },
        x: { grid: { display: false } }
      }
    }
  });
}

function updateNatAnnualTrendLine(year) {
  if (!natCharts.annualTrend) return;
  const isAll = (year === "all");
  const idx = natYearsList.indexOf(year);
  const ds = natCharts.annualTrend.data.datasets[0];

  ds.pointRadius = natYearsList.map((_, i) => (!isAll && i === idx ? 8 : 3));
  ds.pointHoverRadius = natYearsList.map((_, i) => (!isAll && i === idx ? 10 : 6));
  ds.pointBackgroundColor = natYearsList.map((_, i) => (!isAll && i === idx ? "#e03131" : RoadUserColors["Car, van, ute"]));
  ds.pointBorderColor = natYearsList.map(() => "#ffffff");
  ds.pointBorderWidth = natYearsList.map((_, i) => (!isAll && i === idx ? 2 : 1));

  clearChartHoverState(natCharts.annualTrend);
  natCharts.annualTrend.update();
}

// Two-wheeler trend (Motorcyclists vs Cyclists)
function initNatTwoWheelLine(motoAnnual, cycAnnual) {
  natCharts.twoWheel = new Chart(document.getElementById("c-two-wheel"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [
        { label: "Motorcyclists", data: motoAnnual, borderColor: RoadUserColors["Motorcyclist"], borderWidth: 2, pointRadius: 2.5 },
        { label: "Cyclists", data: cycAnnual, borderColor: RoadUserColors["Cyclist"], borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
    }
  });
}

function updateNatTwoWheelLine(year) {
  if (!natCharts.twoWheel) return;
  const isAll = (year === "all");
  const yearIdx = natYearsList.indexOf(year);

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

// Pedestrian annual trend
function initNatPedestrianLine(pedAnnual) {
  natCharts.pedestrianTrend = new Chart(document.getElementById("c-pedestrian-trend"), {
    type: "line",
    data: {
      labels: natYearsList,
      datasets: [{
        label: "Pedestrians",
        data: pedAnnual,
        borderColor: RoadUserColors["Pedestrian"],
        backgroundColor: hexToRgba(RoadUserColors["Pedestrian"], 0.08),
        fill: true,
        borderWidth: 2,
        pointRadius: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Pedestrians: ${ctx.parsed.y.toLocaleString()}` } }
      }
    }
  });
}

function updateNatPedestrianLine(year, pedHospYear) {
  if (!natCharts.pedestrianTrend) return;
  const isAll = (year === "all");
  const yearIdx = natYearsList.indexOf(year);
  const ds = natCharts.pedestrianTrend.data.datasets[0];

  ds.pointRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 8 : 2.5));
  ds.pointHoverRadius = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 10 : 5));
  ds.pointBackgroundColor = natYearsList.map((_, i) => (!isAll && i === yearIdx ? "#e03131" : RoadUserColors["Pedestrian"]));
  ds.pointBorderColor = natYearsList.map(() => "#ffffff");
  ds.pointBorderWidth = natYearsList.map((_, i) => (!isAll && i === yearIdx ? 2 : 1));

  clearChartHoverState(natCharts.pedestrianTrend);
  natCharts.pedestrianTrend.update();

  const tagPed = document.getElementById("tag-ped-trend");
  if (tagPed) {
    tagPed.textContent = isAll
      ? "Annual admissions (2011–2021)"
      : `Highlighted Year: ${year} (${pedHospYear.toLocaleString()} admissions)`;
  }
}


// ─── Module C: First Nations Line Charts ────────────────────────────────────

// First Nations admissions trend
function initFnTrendLine(fnTrendData) {
  fnCharts.fnTrend = new Chart(document.getElementById("c-fn-trend"), {
    type: "line",
    data: {
      labels: fnYearsList,
      datasets: [{
        label: "First Nations Admissions",
        data: fnTrendData,
        borderColor: RoadUserColors["Motorcyclist"],
        backgroundColor: hexToRgba(RoadUserColors["Motorcyclist"], 0.08),
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: "#f1f3f5" } },
        x: { grid: { display: false } }
      }
    }
  });
}

function updateFnTrendLine(year) {
  if (!fnCharts.fnTrend) return;
  const isAll = (year === "all");
  const idx = fnYearsList.indexOf(year);

  fnCharts.fnTrend.data.datasets[0].pointRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 8 : 3));
  fnCharts.fnTrend.data.datasets[0].pointHoverRadius = fnYearsList.map((_, i) => (!isAll && i === idx ? 10 : 6));
  fnCharts.fnTrend.data.datasets[0].pointBackgroundColor = fnYearsList.map((_, i) => (!isAll && i === idx ? "#e03131" : RoadUserColors["Motorcyclist"]));
  fnCharts.fnTrend.data.datasets[0].pointBorderColor = fnYearsList.map(() => "#ffffff");
  fnCharts.fnTrend.data.datasets[0].pointBorderWidth = fnYearsList.map((_, i) => (!isAll && i === idx ? 2 : 1));

  clearChartHoverState(fnCharts.fnTrend);
  fnCharts.fnTrend.update();
}

// 10-year trajectory growth index
function initFnGrowthIndexLine(fnGrowthIndex, nonGrowthIndex) {
  fnCharts.growthIndex = new Chart(document.getElementById("c-growth-index"), {
    type: "line",
    data: {
      labels: fnYearsList,
      datasets: [
        { label: "First Nations (+92.5%)", data: fnGrowthIndex, borderColor: RoadUserColors["Motorcyclist"], borderWidth: 2, pointRadius: 2.5 },
        { label: "Non-Indigenous (+15.9%)", data: nonGrowthIndex, borderColor: RoadUserColors["Car, van, ute"], borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
    }
  });
}

function updateFnGrowthIndexLine(year) {
  if (!fnCharts.growthIndex) return;
  const isAll = (year === "all");
  const idx = fnYearsList.indexOf(year);

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


// ─── Module D: State & Territory Line Charts ────────────────────────────────

// Top 3 states annual trends line chart
function initStAnnualLine(top3Datasets) {
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
}

function updateStAnnualChart(selectedState, selectedYear) {
  if (!stCharts.stateAnnual) return;

  const annualMap = { NSW: 0, Vic: 1, Qld: 2 };
  const origColors = [StateColors["NSW"], StateColors["Vic"], StateColors["Qld"]];
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

