// Fallback CSV text parser
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

// Asynchronously load and parse CSV dataset
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

// Initialize application and load all datasets
async function initApp() {
  const loadingEl = document.getElementById("db-loading");
  try {
    // Setup filter bar listeners first
    setupGlobalFilterListeners();

    // Fetch and parse all 3 AIHW CSV datasets in parallel
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

// Boot application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

