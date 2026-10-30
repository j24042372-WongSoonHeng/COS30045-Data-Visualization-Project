const yearlyData = {
  "all": {
    hosp: 410884,
    bedDays: 2007387,
    los: 4.89,
    users: [200127, 92322, 75362, 28532, 5611, 2584, 6346]
  },
  "2011": {
    hosp: 34033,
    bedDays: 154673,
    los: 4.54,
    users: [16937, 7565, 5391, 2754, 562, 214, 610]
  },
  "2016": {
    hosp: 38963,
    bedDays: 217765,
    los: 5.59,
    users: [19403, 8526, 6904, 2743, 484, 283, 620]
  },
  "2021": {
    hosp: 39505,
    bedDays: 198934,
    los: 5.04,
    users: [18880, 8883, 8163, 2334, 475, 169, 601]
  }
};

const userLabels = ["Car, van, ute", "Motorcyclist", "Cyclist", "Pedestrian", "Heavy transport", "Bus occupant", "Other/unknown"];
const userBedDaysAll = [940015, 502512, 221868, 259617, 33052, 12944, 37379];
const userLosAll = [4.70, 5.44, 2.94, 9.10, 5.89, 5.01, 5.89];
const yearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const annualHosp = [34033, 34024, 35001, 35515, 37082, 38963, 39339, 39590, 39866, 37966, 39505];
const annualBedDays = [154673, 151795, 145898, 142980, 181830, 217765, 211289, 207342, 207715, 187166, 198934];

const charts = {};
Chart.defaults.font.size = 11;

// TAB 1 CHARTS
function initOverview() {
  charts.annualTrend = new Chart(document.getElementById("c-annual-trend"), {
    type: "line",
    data: {
      labels: yearsList,
      datasets: [{
        label: "Hospitalisations",
        data: annualHosp,
        borderColor: "#1d72b8",
        backgroundColor: "rgba(29, 114, 184, 0.08)",
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
        tooltip: { callbacks: { label: (ctx) => ` Admissions: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { min: 30000, grid: { color: "#f1f3f5" } }, x: { grid: { display: false } } }
    }
  });

  charts.roadUsersHosp = new Chart(document.getElementById("c-road-users-hosp"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: yearlyData["all"].users, backgroundColor: "#1d72b8", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { grid: { color: "#f1f3f5" } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } }
    }
  });

  charts.bedDaysTrend = new Chart(document.getElementById("c-bed-days-trend"), {
    type: "bar",
    data: {
      labels: yearsList,
      datasets: [{ data: annualBedDays, backgroundColor: "#4dabf7", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { grid: { color: "#f1f3f5" }, ticks: { callback: (v) => `${v / 1000}k` } }, x: { grid: { display: false } } }
    }
  });

  charts.roadUserPie = new Chart(document.getElementById("c-road-user-pie"), {
    type: "doughnut",
    data: {
      labels: userLabels,
      datasets: [{
        data: yearlyData["all"].users,
        backgroundColor: ["#1d72b8", "#339af0", "#4dabf7", "#74c0fc", "#adb5bd", "#ced4da", "#dee2e6"],
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
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
            }
          }
        }
      },
      cutout: "55%"
    }
  });
}

// TAB 2 CHARTS
function initRoadUsersTab() {
  if (charts.userBeddays) {
    charts.userBeddays.resize();
    charts.userLos.resize();
    charts.twoWheel.resize();
    charts.pedestrianTrend.resize();
    return;
  }

  charts.userBeddays = new Chart(document.getElementById("c-user-beddays"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: userBedDaysAll, backgroundColor: "#228be6", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } }
    }
  });

  charts.userLos = new Chart(document.getElementById("c-user-los"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: userLosAll, backgroundColor: "#15aabf", borderRadius: 3 }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Avg Stay: ${ctx.parsed.x} days` } }
      },
      scales: { x: { ticks: { callback: (v) => `${v} d` } } }
    }
  });

  charts.twoWheel = new Chart(document.getElementById("c-two-wheel"), {
    type: "line",
    data: {
      labels: yearsList,
      datasets: [
        { label: "Motorcyclists", data: [6840, 7120, 7500, 7940, 8350, 8910, 9150, 9320, 9410, 8740, 9032], borderColor: "#1d72b8", borderWidth: 2, pointRadius: 2.5 },
        { label: "Cyclists", data: [5820, 5910, 6140, 6420, 6800, 7250, 7410, 7590, 7680, 7120, 7222], borderColor: "#40c057", borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
    }
  });

  charts.pedestrianTrend = new Chart(document.getElementById("c-pedestrian-trend"), {
    type: "line",
    data: {
      labels: yearsList,
      datasets: [{
        label: "Pedestrians",
        data: [2754, 2672, 2657, 2554, 2627, 2743, 2714, 2661, 2713, 2103, 2334],
        borderColor: "#fa5252",
        backgroundColor: "rgba(250, 82, 82, 0.08)",
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
        tooltip: { callbacks: { label: (ctx) => ` Pedestrians: ${ctx.parsed.y.toLocaleString()}` } }
      }
    }
  });
}

// TAB 3 CHARTS
function initCausesTab() {
  if (charts.allCauses) {
    charts.allCauses.resize();
    charts.transportPie.resize();
    return;
  }

  const causesLabels = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];
  const causesCounts = [410884, 169963, 63848, 18328];

  charts.allCauses = new Chart(document.getElementById("c-all-causes"), {
    type: "bar",
    data: {
      labels: causesLabels,
      datasets: [{
        data: causesCounts,
        backgroundColor: ["#1d72b8", "#74c0fc", "#adb5bd", "#ced4da"],
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
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } } }
    }
  });

  charts.transportPie = new Chart(document.getElementById("c-transport-pie"), {
    type: "doughnut",
    data: {
      labels: causesLabels,
      datasets: [{
        data: causesCounts,
        backgroundColor: ["#1d72b8", "#74c0fc", "#adb5bd", "#ced4da"],
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
            label: (ctx) => {
              const total = causesCounts.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${pct}% (${ctx.parsed.toLocaleString()})`;
            }
          }
        }
      },
      cutout: "60%"
    }
  });
}

function updateYearFilter(selectedYear) {
  const data = yearlyData[selectedYear] || yearlyData["all"];

  document.getElementById("kpi-hosp").textContent = data.hosp.toLocaleString();
  document.getElementById("kpi-beddays").textContent = data.bedDays.toLocaleString();
  document.getElementById("kpi-los").innerHTML = `${data.los} <small>days</small>`;

  const badge = document.getElementById("metric-scope-badge");
  badge.textContent = selectedYear === "all" ? "All Traffic Events • Australia" : `Traffic Snapshot: Year ${selectedYear}`;

  charts.roadUsersHosp.data.datasets[0].data = data.users;
  charts.roadUsersHosp.update();

  charts.roadUserPie.data.datasets[0].data = data.users;
  charts.roadUserPie.update();

  if (selectedYear === "all") {
    charts.annualTrend.data.datasets[0].pointBackgroundColor = "#1d72b8";
    charts.annualTrend.data.datasets[0].pointRadius = 3;
  } else {
    const idx = yearsList.indexOf(selectedYear);
    charts.annualTrend.data.datasets[0].pointBackgroundColor = yearsList.map((_, i) => (i === idx ? "#e03131" : "#1d72b8"));
    charts.annualTrend.data.datasets[0].pointRadius = yearsList.map((_, i) => (i === idx ? 8 : 3));
  }
  charts.annualTrend.update();
}

document.addEventListener("DOMContentLoaded", () => {
  initOverview();

  // Tab switching with lazy initialization
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      const targetPanel = document.getElementById(target);
      targetPanel.classList.add("active");

      // Draw charts when tab is now visible
      if (target === "tab-roadusers") initRoadUsersTab();
      if (target === "tab-causes") initCausesTab();
    });
  });

  const yearSelect = document.getElementById("filter-year");
  yearSelect.addEventListener("change", (e) => updateYearFilter(e.target.value));

  document.getElementById("btn-reset").addEventListener("click", () => {
    yearSelect.value = "all";
    updateYearFilter("all");
  });
});