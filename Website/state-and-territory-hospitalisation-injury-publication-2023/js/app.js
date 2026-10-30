const stateStats = {
  "ACT": { hosp: 6860, bedDays: 28004, los: 4.08, users: [2684, 1521, 2314, 281, 6, 12, 42] },
  "NSW": { hosp: 116060, bedDays: 603566, los: 5.20, users: [55205, 27358, 19601, 9749, 1524, 992, 1631] },
  "NT":  { hosp: 6996, bedDays: 39379, los: 5.63, users: [3752, 1638, 822, 630, 30, 17, 107] },
  "Qld": { hosp: 93967, bedDays: 388700, los: 4.14, users: [46653, 23872, 15152, 4688, 1715, 393, 1494] },
  "SA":  { hosp: 26730, bedDays: 132331, los: 4.95, users: [12953, 5809, 5379, 1740, 325, 141, 383] },
  "Tas": { hosp: 7123, bedDays: 39142, los: 5.50, users: [3496, 1852, 1146, 488, 38, 0, 103] },
  "Vic": { hosp: 107942, bedDays: 531653, los: 4.93, users: [54983, 19313, 22309, 7901, 1329, 581, 1526] },
  "WA":  { hosp: 36965, bedDays: 203608, los: 5.51, users: [16214, 9679, 7297, 2329, 443, 228, 775] }
};

const stateNames = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"];
const allHosp = [116060, 107942, 93967, 36965, 26730, 7123, 6996, 6860];
const allBedDays = [603566, 531653, 388700, 203608, 132331, 39142, 39379, 28004];
const allStay = [5.20, 4.93, 4.14, 5.51, 4.95, 5.49, 5.63, 4.08];

const charts = {};
Chart.defaults.font.size = 11;

// TAB 1 CHARTS
function initRankings() {
  charts.stateRankings = new Chart(document.getElementById("c-state-rankings"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{
        data: allHosp,
        backgroundColor: stateNames.map(() => "#1d72b8"),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } }, x: { grid: { display: false } } }
    }
  });

  charts.stateShare = new Chart(document.getElementById("c-state-share"), {
    type: "doughnut",
    data: {
      labels: stateNames,
      datasets: [{
        data: allHosp,
        backgroundColor: ["#1d72b8", "#339af0", "#4dabf7", "#74c0fc", "#a5d8ff", "#adb5bd", "#ced4da", "#dee2e6"],
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 9.5 } } } },
      cutout: "55%"
    }
  });

  charts.stateLos = new Chart(document.getElementById("c-state-los"), {
    type: "bar",
    data: {
      labels: ["NT", "WA", "Tas", "NSW", "SA", "Vic", "Qld", "ACT"],
      datasets: [{
        data: [5.63, 5.51, 5.49, 5.20, 4.95, 4.93, 4.14, 4.08],
        backgroundColor: "#20c997",
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: (v) => `${v} d` } } }
    }
  });

  charts.stateAnnual = new Chart(document.getElementById("c-state-annual"), {
    type: "line",
    data: {
      labels: ["2011", "2013", "2015", "2017", "2019", "2021"],
      datasets: [
        { label: "NSW", data: [10618, 11421, 11084, 11016, 9942, 9003], borderColor: "#1d72b8", borderWidth: 2 },
        { label: "VIC", data: [9326, 7784, 9198, 10794, 11392, 11130], borderColor: "#339af0", borderWidth: 2 },
        { label: "QLD", data: [6322, 7821, 8306, 9134, 9515, 10447], borderColor: "#f59f00", borderWidth: 2 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// TAB 2 CHARTS
function initUsersTab() {
  if (charts.carState) {
    charts.carState.resize();
    charts.cyclistState.resize();
    charts.motoState.resize();
    charts.pedState.resize();
    return;
  }

  charts.carState = new Chart(document.getElementById("c-car-state"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{ data: [55205, 54983, 46653, 16214, 12953, 3496, 3752, 2684], backgroundColor: "#1d72b8", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });

  charts.cyclistState = new Chart(document.getElementById("c-cyclist-state"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{ data: [19601, 22309, 15152, 7297, 5379, 1146, 822, 2314], backgroundColor: "#40c057", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });

  charts.motoState = new Chart(document.getElementById("c-moto-state"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{ data: [27358, 19313, 23872, 9679, 5809, 1852, 1638, 1521], backgroundColor: "#fd7e14", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });

  charts.pedState = new Chart(document.getElementById("c-ped-state"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{ data: [9749, 7901, 4688, 2329, 1740, 488, 630, 281], backgroundColor: "#e03131", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });
}

// TAB 3 CHARTS
function initLengthTab() {
  if (charts.totBeddaysState) {
    charts.totBeddaysState.resize();
    charts.deviationBench.resize();
    return;
  }

  charts.totBeddaysState = new Chart(document.getElementById("c-tot-beddays-state"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{ data: allBedDays, backgroundColor: "#228be6", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });

  charts.deviationBench = new Chart(document.getElementById("c-deviation-bench"), {
    type: "bar",
    data: {
      labels: stateNames,
      datasets: [{
        label: "Difference from National Benchmark (4.89d)",
        data: allStay.map((s) => +(s - 4.89).toFixed(2)),
        backgroundColor: allStay.map((s) => (s >= 4.89 ? "#fa5252" : "#40c057")),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y > 0 ? "+" : ""}${ctx.parsed.y} days vs avg` } }
      }
    }
  });
}

function updateJurisdictionFilter(selectedState) {
  const badge = document.getElementById("state-active-badge");

  if (selectedState === "all") {
    badge.textContent = "National State Comparison";
    document.getElementById("kpi-juris-tot").textContent = "401,766";
    charts.stateRankings.data.datasets[0].backgroundColor = stateNames.map(() => "#1d72b8");
  } else {
    const sData = stateStats[selectedState];
    badge.textContent = `Focus: ${selectedState} (${sData.hosp.toLocaleString()} Admissions)`;
    document.getElementById("kpi-juris-tot").textContent = sData.hosp.toLocaleString();

    // Highlights selected state in orange, dims others in gray
    charts.stateRankings.data.datasets[0].backgroundColor = stateNames.map(
      (st) => (st === selectedState ? "#f59f00" : "#ced4da")
    );
  }
  charts.stateRankings.update();
}

document.addEventListener("DOMContentLoaded", () => {
  initRankings();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");

      // Draw charts when tab is now visible
      if (target === "tab-users") initUsersTab();
      if (target === "tab-length") initLengthTab();
    });
  });

  const stateSelect = document.getElementById("filter-state");
  stateSelect.addEventListener("change", (e) => updateJurisdictionFilter(e.target.value));

  document.getElementById("btn-reset").addEventListener("click", () => {
    stateSelect.value = "all";
    updateJurisdictionFilter("all");
  });
});