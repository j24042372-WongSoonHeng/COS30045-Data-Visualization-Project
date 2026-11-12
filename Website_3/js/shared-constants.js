// GenAI (OpenAI Codex) assisted with the shared chart scales, interaction and colours.
// Bar and line colours encode comparisons or selection. Donut colours encode categories.
const years = Array.from({ length: 11 }, (_, index) => 2011 + index);
const roadUsers = ["Car, van or ute", "Motorcyclist", "Cyclist", "Pedestrian", "Heavy transport", "Bus occupant", "Other or unknown"];
// Object keys match the jurisdiction values in the source CSV.
const jurisdictions = {
  NSW: { abbreviation: "NSW", name: "New South Wales" },
  Vic: { abbreviation: "VIC", name: "Victoria" },
  Qld: { abbreviation: "QLD", name: "Queensland" },
  WA: { abbreviation: "WA", name: "Western Australia" },
  SA: { abbreviation: "SA", name: "South Australia" },
  Tas: { abbreviation: "TAS", name: "Tasmania" },
  NT: { abbreviation: "NT", name: "Northern Territory" },
  ACT: { abbreviation: "ACT", name: "Australian Capital Territory" }
};
const cohorts = ["First Nations people", "Non-Indigenous"];
const transportCauses = ["Traffic", "Non-traffic", "Unknown traffic", "Other transport"];
const palette = {
  primary: "#285d7d",
  secondary: "#8197a8",
  third: "#4e6579",
  muted: "#c4d2dc",
  donut: ["#0072B2", "#D55E00", "#009E73", "#A34F83", "#57A8CE", "#E69F00", "#7F8792"]
};

const formatNumber = new Intl.NumberFormat("en-AU");
const count = value => formatNumber.format(value);
const days = value => `${value.toFixed(2)} days`;
const share = (part, whole) => whole ? part / whole : 0;
const percent = fraction => `${(fraction * 100).toFixed(1)}%`;
const groupRows = (rows, key) => d3.group(rows, row => row[key]);

function summarise(rows = []) {
  const admissions = d3.sum(rows, row => row.hosp);
  const bedDays = d3.sum(rows, row => row.bed_days_excl_died);
  return { admissions, bedDays, averageStay: admissions ? bedDays / admissions : null };
}

function byCategory(rows, key, categories) {
  const groups = groupRows(rows, key);
  return categories.map(category => ({ category, ...summarise(groups.get(category)) }));
}

function countAxis(value) {
  return value >= 1000 ? `${+(value / 1000).toFixed(1)}k` : count(value);
}

function annualTickYears(width, selected = "all") {
  return width < 520
    ? years.filter((year, index) => year === selected ||
        (index % 2 === 0 && (selected === "all" || Math.abs(year - selected) > 1)))
    : years;
}

function startChart(area, label, width, height) {
  return area.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "group")
    .attr("aria-label", label);
}

const markTooltip = document.getElementById("mark-tooltip");

function positionTooltip(element, tooltip) {
  const mark = element.getBoundingClientRect();
  const tip = tooltip.getBoundingClientRect();
  const left = mark.left + (mark.width - tip.width) / 2;
  const top = mark.top >= tip.height + 10 ? mark.top - tip.height - 7 : mark.bottom + 7;
  tooltip.style.left = `${Math.max(6, Math.min(left, window.innerWidth - tip.width - 6))}px`;
  tooltip.style.top = `${Math.max(6, Math.min(top, window.innerHeight - tip.height - 6))}px`;
}

function showMarkTooltip(element, label) {
  markTooltip.textContent = label;
  markTooltip.hidden = false;
  positionTooltip(element, markTooltip);
}

function hideMarkTooltip() {
  markTooltip.hidden = true;
}

// Expose the same value when hovering, tapping or tabbing to a D3 mark.
function addMarkHelp(marks, describe) {
  marks.classed("chart-mark", true)
    .attr("tabindex", 0)
    .attr("role", "img")
    .attr("aria-label", describe)
    .on("pointerenter focus click", (event, datum) => showMarkTooltip(event.currentTarget, describe(datum)))
    .on("pointerleave blur", hideMarkTooltip);
}

function addSeriesLegend(area, series, isLine = false) {
  if (series.length < 2) return 0;
  const legend = area.append("ul").attr("class", "chart-legend");
  const items = legend.selectAll("li").data(series).join("li");
  items.append("span")
    .attr("aria-hidden", "true")
    .attr("class", item => isLine ? `legend-line ${item.strokeStyle || ""}` : "legend-dot")
    .style(isLine ? "border-color" : "background-color", item => item.color);
  items.append("span").text(item => item.label);
  return legend.node().offsetHeight + 5;
}
