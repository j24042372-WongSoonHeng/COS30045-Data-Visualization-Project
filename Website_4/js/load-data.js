// Read a dashboard CSV and convert the year and measures to numbers.
function readDataset(path) {
  return d3.csv(path, row => ({
    ...row,
    year: Number(row.year),
    hosp: Number(row.hosp),
    bed_days_excl_died: Number(row.bed_days_excl_died)
  }));
}

async function initApp() {
  const status = document.getElementById("db-loading");
  if (typeof d3 === "undefined") {
    status.textContent = "The D3 chart library could not load. Check your connection and reload the page.";
    return;
  }

  try {
    // Each export has its own reporting scope. Keep the three datasets separate.
    const [national, firstNations, state] = await Promise.all([
      readDataset("data/Hospitalisation.csv"),
      readDataset("data/first_nations_road_user.csv"),
      readDataset("data/state_road_user.csv")
    ]);
    // The Transport causes tab uses the full national export. The other national tabs use traffic rows.
    startDashboard({ national, firstNations, state, traffic: national.filter(row => row.cause_of_injury === "Traffic") });
    status.hidden = true;
  } catch (error) {
    console.error("Dashboard initialisation failed", error);
    status.textContent = location.protocol === "file:"
      ? "Open this folder with Live Server or another local HTTP server to load the CSV files."
      : "The dashboard could not load. Reload the page and check that all three CSV files are in the data folder.";
  }
}

document.addEventListener("DOMContentLoaded", initApp);
