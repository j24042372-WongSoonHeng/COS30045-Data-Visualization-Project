// ─── Module B: National Overview Doughnut Charts ────────────────────────────

// Road user proportions doughnut
function initNatRoadUserPie() {
  natCharts.roadUserPie = new Chart(document.getElementById("c-road-user-pie"), {
    type: "doughnut",
    data: {
      labels: natUserLabels,
      datasets: [{
        data: [],
        backgroundColor: natUserLabels.map(u => RoadUserColors[u]),
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 10, font: { size: 9 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${ctx.label}: ${((ctx.parsed / total) * 100).toFixed(1)}% (${ctx.parsed.toLocaleString()})`;
            }
          }
        }
      },
      cutout: "55%"
    }
  });
}

function updateNatRoadUserPie(userCounts) {
  if (!natCharts.roadUserPie) return;
  natCharts.roadUserPie.data.datasets[0].data = userCounts;
  natCharts.roadUserPie.update();
}

// Transport causes share doughnut
function initNatTransportPie(causesLabels) {
  natCharts.transportPie = new Chart(document.getElementById("c-transport-pie"), {
    type: "doughnut",
    data: {
      labels: causesLabels,
      datasets: [{
        data: [],
        backgroundColor: ["#0072B2", "#56B4E9", "#999990", "#E69F00"],
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      },
      cutout: "60%"
    }
  });
}

function updateNatTransportPie(counts) {
  if (!natCharts.transportPie) return;
  natCharts.transportPie.data.datasets[0].data = counts;
  natCharts.transportPie.update();
}


// ─── Module C: First Nations Doughnut Charts ────────────────────────────────

// Overall hospitalisation volume ratio doughnut
function initFnCohortSharePie(totalFN, totalNon) {
  fnCharts.cohortShare = new Chart(document.getElementById("c-cohort-share"), {
    type: "doughnut",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{
        data: [totalFN, totalNon],
        backgroundColor: [RoadUserColors["Motorcyclist"], "#ced4da"],
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%"
    }
  });
}


// ─── Module D: State & Territory Doughnut Charts ────────────────────────────

// Share of national inpatient volume doughnut
function initStSharePie(stateHosp) {
  stCharts.stateShare = new Chart(document.getElementById("c-state-share"), {
    type: "doughnut",
    data: {
      labels: stNames,
      datasets: [{
        data: stateHosp,
        backgroundColor: stNames.map(st => StateColors[st]),
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 10, font: { size: 9.5 } } }
      },
      cutout: "55%"
    }
  });
}

function updateStShareChart(selectedState) {
  if (!stCharts.stateShare) return;
  const isAll = (!selectedState || selectedState === "all");
  const baseColors = stNames.map(st => StateColors[st]);
  const idx = stNames.indexOf(selectedState);

  stCharts.stateShare.data.datasets[0].backgroundColor = isAll
    ? baseColors
    : stNames.map((st, i) => (i === idx) ? baseColors[i] : hexToRgba(baseColors[i], 0.25));
  stCharts.stateShare.data.datasets[0].offset = isAll
    ? stNames.map(() => 0)
    : stNames.map((_, i) => (i === idx) ? 14 : 0);
  stCharts.stateShare.update();
}

