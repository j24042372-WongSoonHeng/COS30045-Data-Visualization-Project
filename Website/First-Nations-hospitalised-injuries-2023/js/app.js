const demoData = {
  "First Nations": {
    hosp: 18616,
    bedDays: 100025,
    los: 5.37,
    yearsTrend: [1150, 1396, 1402, 1439, 1594, 1657, 1717, 1924, 1833, 2290, 2214],
    users: [10204, 3565, 2244, 2067, 359, 134, 43],
    userBedDays: [53202, 19633, 18317, 5992, 2049, 620, 212]
  },
  "Non-Indigenous": {
    hosp: 380684,
    bedDays: 1834954,
    los: 4.82,
    yearsTrend: [31441, 31347, 32310, 32859, 34539, 36419, 36520, 36942, 36671, 35186, 36450],
    users: [184844, 87313, 25796, 72255, 5493, 4124, 859],
    userBedDays: [856855, 471713, 234748, 211773, 31125, 24386, 4354]
  }
};

const yearsList = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
const userLabels = ["Car, van, ute", "Motorcyclist", "Pedestrian", "Cyclist", "Other/unknown", "Heavy transport", "Bus occupant"];

const charts = {};
Chart.defaults.font.size = 11;

// TAB 1 CHARTS
function initTrendsTab() {
  charts.fnTrend = new Chart(document.getElementById("c-fn-trend"), {
    type: "line",
    data: {
      labels: yearsList,
      datasets: [{
        label: "First Nations Admissions",
        data: demoData["First Nations"].yearsTrend,
        borderColor: "#d9480f",
        backgroundColor: "rgba(217, 72, 15, 0.08)",
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { grid: { color: "#f1f3f5" } }, x: { grid: { display: false } } }
    }
  });

  const fnBase = demoData["First Nations"].yearsTrend[0];
  const nonBase = demoData["Non-Indigenous"].yearsTrend[0];
  const fnIndex = demoData["First Nations"].yearsTrend.map((v) => +((v / fnBase) * 100).toFixed(1));
  const nonIndex = demoData["Non-Indigenous"].yearsTrend.map((v) => +((v / nonBase) * 100).toFixed(1));

  charts.growthIndex = new Chart(document.getElementById("c-growth-index"), {
    type: "line",
    data: {
      labels: yearsList,
      datasets: [
        { label: "First Nations (+92.5%)", data: fnIndex, borderColor: "#d9480f", borderWidth: 2, pointRadius: 2.5 },
        { label: "Non-Indigenous (+15.9%)", data: nonIndex, borderColor: "#1d72b8", borderWidth: 2, pointRadius: 2.5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
    }
  });

  charts.fnBeddays = new Chart(document.getElementById("c-fn-beddays-trend"), {
    type: "bar",
    data: {
      labels: yearsList,
      datasets: [{
        label: "Bed Days",
        data: demoData["First Nations"].yearsTrend.map((v, i) => [6406, 7187, 7533, 7669, 7587, 8926, 8752, 10152, 10176, 12376, 13261][i]),
        backgroundColor: "#f76707",
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      }
    }
  });

  charts.cohortShare = new Chart(document.getElementById("c-cohort-share"), {
    type: "doughnut",
    data: {
      labels: ["First Nations People", "Non-Indigenous"],
      datasets: [{
        data: [18616, 380684],
        backgroundColor: ["#d9480f", "#ced4da"],
        borderWidth: 1.5,
        borderColor: "#fff"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: "60%" }
  });
}

// TAB 2 CHARTS
function initDisparityTab() {
  if (charts.fnUserBar) {
    charts.fnUserBar.resize();
    charts.nonUserBar.resize();
    charts.pedestrianGap.resize();
    charts.cyclistGap.resize();
    return;
  }

  charts.fnUserBar = new Chart(document.getElementById("c-fn-user-bar"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: demoData["First Nations"].users, backgroundColor: "#d9480f", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } }
    }
  });

  charts.nonUserBar = new Chart(document.getElementById("c-non-user-bar"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: demoData["Non-Indigenous"].users, backgroundColor: "#1d72b8", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Count: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } }
    }
  });

  charts.pedestrianGap = new Chart(document.getElementById("c-pedestrian-gap"), {
    type: "bar",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{
        data: [12.1, 6.8],
        backgroundColor: ["#d9480f", "#1d72b8"],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Pedestrian Proportion: ${ctx.parsed.y}%` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v}%` }, max: 15 } }
    }
  });

  charts.cyclistGap = new Chart(document.getElementById("c-cyclist-gap"), {
    type: "bar",
    data: {
      labels: ["First Nations", "Non-Indigenous"],
      datasets: [{
        data: [11.1, 19.0],
        backgroundColor: ["#d9480f", "#1d72b8"],
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Cyclist Proportion: ${ctx.parsed.y}%` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v}%` }, max: 25 } }
    }
  });
}

// TAB 3 CHARTS
function initSeverityTab() {
  if (charts.losComparison) {
    charts.losComparison.resize();
    charts.fnBeddaysUser.resize();
    return;
  }

  charts.losComparison = new Chart(document.getElementById("c-los-comparison"), {
    type: "bar",
    data: {
      labels: ["Car, van, ute", "Motorcyclist", "Pedestrian", "Cyclist", "Other"],
      datasets: [
        { label: "First Nations", data: [5.21, 5.51, 8.16, 2.90, 5.71], backgroundColor: "#d9480f", borderRadius: 3 },
        { label: "Non-Indigenous", data: [4.64, 5.40, 9.10, 2.93, 5.67], backgroundColor: "#1d72b8", borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 10 } } },
      scales: { y: { ticks: { callback: (v) => `${v} d` } } }
    }
  });

  charts.fnBeddaysUser = new Chart(document.getElementById("c-fn-beddays-user"), {
    type: "bar",
    data: {
      labels: userLabels,
      datasets: [{ data: demoData["First Nations"].userBedDays, backgroundColor: "#f76707", borderRadius: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` Bed Days: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: { y: { ticks: { callback: (v) => `${v / 1000}k` } }, x: { ticks: { font: { size: 9 } } } }
    }
  });
}

function updateDemographicFilter(status) {
  const badge = document.getElementById("badge-indigenous-scope");

  if (status === "fn") {
    badge.textContent = "Focus: First Nations People Only";
    charts.fnTrend.data.datasets[0].label = "First Nations Admissions";
    charts.fnTrend.data.datasets[0].data = demoData["First Nations"].yearsTrend;
    charts.fnTrend.data.datasets[0].borderColor = "#d9480f";
    charts.growthIndex.setDatasetVisibility(0, true);
    charts.growthIndex.setDatasetVisibility(1, false);
  } else if (status === "non") {
    badge.textContent = "Focus: Non-Indigenous People Only";
    charts.fnTrend.data.datasets[0].label = "Non-Indigenous Admissions";
    charts.fnTrend.data.datasets[0].data = demoData["Non-Indigenous"].yearsTrend;
    charts.fnTrend.data.datasets[0].borderColor = "#1d72b8";
    charts.growthIndex.setDatasetVisibility(0, false);
    charts.growthIndex.setDatasetVisibility(1, true);
  } else {
    badge.textContent = "Equity Comparison • Both Groups";
    charts.fnTrend.data.datasets[0].label = "First Nations Admissions";
    charts.fnTrend.data.datasets[0].data = demoData["First Nations"].yearsTrend;
    charts.fnTrend.data.datasets[0].borderColor = "#d9480f";
    charts.growthIndex.setDatasetVisibility(0, true);
    charts.growthIndex.setDatasetVisibility(1, true);
  }

  charts.fnTrend.update();
  charts.growthIndex.update();
}

document.addEventListener("DOMContentLoaded", () => {
  initTrendsTab();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");

      // Draw charts when tab is now visible
      if (target === "tab-roaduser-disparity") initDisparityTab();
      if (target === "tab-severity") initSeverityTab();
    });
  });

  const filterSelect = document.getElementById("filter-status");
  filterSelect.addEventListener("change", (e) => updateDemographicFilter(e.target.value));

  document.getElementById("btn-reset").addEventListener("click", () => {
    filterSelect.value = "both";
    updateDemographicFilter("both");
  });
});