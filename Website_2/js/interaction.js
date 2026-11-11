// GenAI (OpenAI Codex) assisted with the view guidance, chart explanations, and filter updates.
// Each topic uses one chart per question. Calculations use the same CSV rows as the original dashboard.
const topics = {
  national: [
    { id: "national-overview", label: "Overview & trends", build: nationalOverview },
    { id: "national-users", label: "Road users & inpatient days", build: nationalRoadUsers },
    { id: "national-causes", label: "Transport causes", build: nationalCauses }
  ],
  firstnations: [
    { id: "first-trends", label: "Admission trends", build: firstNationsTrends },
    { id: "first-users", label: "Road user comparison", build: firstNationsRoadUsers },
    { id: "first-stay", label: "Inpatient days & stays", build: firstNationsStays }
  ],
  state: [
    { id: "state-overview", label: "State overview", build: stateOverview },
    { id: "state-users", label: "State road users", build: stateRoadUsers },
    { id: "state-stay", label: "Inpatient days & stays", build: stateStays }
  ]
};

const yearSelect = document.getElementById("filter-year");
const stateSelect = document.getElementById("filter-state");
const filterHint = document.getElementById("filter-hint");
let tabList;
let panel;
const selection = { data: "national", year: "all", state: "all", roadUser: roadUsers[0] };
const activeTopics = { national: 0, firstnations: 0, state: 0 };
let datasets;
let visibleCharts = [];
let openHelp;
let chartWidth;

function rowsForYear(rows) {
  return selection.year === "all" ? rows : rows.filter(row => row.year === selection.year);
}

function bars(title, help, data, metric, options = {}) {
  return {
    type: "bar", title, help,
    data: data.map(row => ({ label: row.label || row.category, values: [row[metric]] })),
    series: [{ color: palette.primary, label: title }],
    ...options
  };
}

function annualSeries(rows, metric, label, color = palette.primary, strokeStyle) {
  const byYear = byCategory(rows, "year", years);
  return { label, color, strokeStyle, values: byYear.map(row => row[metric]) };
}

function line(title, help, series, options = {}) {
  return { type: "line", title, help, series, year: selection.year, ...options };
}

function donut(title, help, rows) {
  return {
    type: "donut", title, help,
    data: rows.map(row => ({ label: row.label || row.category, value: row.admissions }))
  };
}

const stayFormat = { format: days, axisFormat: value => `${value}d` };
const bedDayNote = "The source bed-day field excludes bed days for patients who died in hospital. Average stay is calculated by dividing those bed days by the number of admissions.";
const selectedPeriod = () => selection.year === "all" ? "2011–2021" : String(selection.year);

function nationalOverview() {
  const rows = rowsForYear(datasets.traffic);
  const totals = summarise(rows);
  return {
    metrics: [
      ["Traffic hospitalisations", count(totals.admissions), selectedPeriod()],
      ["Acute bed days", count(totals.bedDays), selectedPeriod()],
      ["Average length of stay", totals.averageStay == null ? "—" : days(totals.averageStay), "Per admission"]
    ],
    charts: [
      line("Annual road crash hospitalisations",
        "Shows the number of traffic injury hospitalisations recorded across Australia in each year. Choose a year to highlight its point.",
        [annualSeries(datasets.traffic, "admissions", "Hospitalisations")]),
      donut("Hospitalisation share by road user",
        "Each segment shows the percentage of Australian traffic injury hospitalisations attributed to a road user type for the selected period.",
        byCategory(rows, "road_user", roadUsers)),
      line("Annual acute bed days",
        "Shows the total inpatient bed days attributed to traffic injuries each year. The Year filter highlights that year. The source bed-day field excludes patients who died in hospital.",
        [annualSeries(datasets.traffic, "bedDays", "Acute bed days")], { wide: true })
    ]
  };
}

function nationalRoadUsers() {
  const rows = byCategory(rowsForYear(datasets.traffic), "road_user", roadUsers);
  const allUsers = groupRows(datasets.traffic, "road_user");
  return {
    charts: [
      bars("Total bed days by road user", "Compares the total inpatient days attributed to each road user type in the selected period. Longer bars mean more bed days.", rows, "bedDays"),
      bars("Average stay by road user", `Compares estimated inpatient days per admission by road user type for the selected period. ${bedDayNote}`, rows, "averageStay", stayFormat),
      line("Annual hospitalisations for motorcyclists, cyclists and pedestrians",
        "Compare annual admission counts for these three road user groups. The Year filter highlights the selected year across all three lines.",
        [
          annualSeries(allUsers.get("Motorcyclist"), "admissions", "Motorcyclists"),
          annualSeries(allUsers.get("Cyclist"), "admissions", "Cyclists", palette.third, "dashed"),
          annualSeries(allUsers.get("Pedestrian"), "admissions", "Pedestrians", palette.secondary, "dotted")
        ], { wide: true })
    ]
  };
}

function nationalCauses() {
  const totals = byCategory(rowsForYear(datasets.national), "cause_of_injury", transportCauses);
  const traffic = totals[0].admissions;
  const total = d3.sum(totals, row => row.admissions);
  return {
    charts: [donut("Share of transport injury hospitalisations",
      "Each segment shows a cause category’s share of the four transport categories in the selected period. Hover or focus a segment for the count.", totals)],
    notes: ["Reading the cause categories",
      `Traffic injuries accounted for ${count(traffic)} of ${count(total)} transport injury hospitalisations (${percent(share(traffic, total))}) in ${selectedPeriod()}.`,
      "This view covers the dataset’s traffic, non-traffic, unknown traffic and other transport categories. The rest of National Overview uses the traffic category."]
  };
}

function firstNationsTrends() {
  const totals = byCategory(rowsForYear(datasets.firstNations), "first_status", cohorts);
  const [first, non] = totals;
  const groups = groupRows(datasets.firstNations, "first_status");
  const firstSeries = annualSeries(groups.get(cohorts[0]), "admissions", cohorts[0]);
  const nonSeries = annualSeries(groups.get(cohorts[1]), "admissions", cohorts[1], palette.third, "dashed");
  const indexed = [firstSeries, nonSeries].map(item => ({
    ...item,
    values: item.values.map(value => 100 * share(value, item.values[0]))
  }));
  return {
    metrics: [
      ["First Nations admissions", count(first.admissions), selectedPeriod()],
      ["First Nations acute bed days", count(first.bedDays), selectedPeriod()],
      ["Non-Indigenous admissions", count(non.admissions), selectedPeriod()]
    ],
    charts: [
      line("Annual First Nations hospitalisations",
        "Shows the annual count of road crash hospitalisations recorded for First Nations people. Choose a year to highlight its point.",
        [firstSeries]),
      line("Change in admissions since 2011",
        "Each group starts at 100 in 2011. An index of 120 means admissions were 20% higher than in 2011 for that group. The comparison uses counts from the dataset.",
        indexed, { format: value => `${value.toFixed(1)} (index)`, axisFormat: value => value }),
      donut("Share of admissions by Indigenous status",
        "Shows the percentage of admissions in each of the two recorded Indigenous status groups for the selected period.",
        totals.map((row, index) => ({ ...row, label: index === 0 ? "First Nations" : row.category })))
    ],
    notes: ["Interpreting the First Nations data",
      "These figures describe recorded admissions for the two Indigenous status groups in the dataset. Each group has a different population size, which can affect how their admission counts compare."]
  };
}

function firstNationsRoadUsers() {
  const groups = groupRows(rowsForYear(datasets.firstNations), "first_status");
  const userBreakdowns = cohorts.map(cohort => byCategory(groups.get(cohort) || [], "road_user", roadUsers));
  const totals = userBreakdowns.map(rows => d3.sum(rows, row => row.admissions));
  return {
    charts: [{
      type: "bar", wide: true,
      title: "Road user share by Indigenous status",
      help: "Compare the percentage of each group’s recorded admissions by road user type. Each series uses its own group’s total as the denominator.",
      data: roadUsers.map((label, index) => ({
        label, values: userBreakdowns.map((rows, groupIndex) => share(rows[index].admissions, totals[groupIndex]))
      })),
      series: cohortSeries(),
      format: percent,
      axisFormat: value => `${Math.round(value * 100)}%`
    }],
    notes: ["How to read the shares",
      "Within each Indigenous status group, the road user shares add to about 100% after rounding. Use the paired bars to compare how admissions were distributed across road user types."]
  };
}

function cohortSeries() {
  return [
    { label: "First Nations", color: palette.primary },
    { label: "Non-Indigenous", color: palette.secondary }
  ];
}

function firstNationsStays() {
  const groups = groupRows(rowsForYear(datasets.firstNations), "first_status");
  const [first, non] = cohorts.map(cohort => byCategory(groups.get(cohort) || [], "road_user", roadUsers));
  return {
    charts: [
      {
        type: "bar", title: "Average stay by road user and Indigenous status",
        help: `Compares estimated days per admission for First Nations and non-Indigenous people in the selected period. ${bedDayNote}`,
        data: roadUsers.map((label, index) => ({ label, values: [first[index].averageStay, non[index].averageStay] })),
        series: cohortSeries(), ...stayFormat
      },
      bars("First Nations bed days by road user",
        "Shows total inpatient bed days recorded for First Nations people by road user type during the selected period.",
        first, "bedDays")
    ],
    notes: ["Bed-day measure", bedDayNote]
  };
}

function stateBreakdown(rows) {
  return byCategory(rows, "state", Object.keys(jurisdictions))
    .map(row => ({ ...row, label: jurisdictions[row.category].abbreviation }));
}

function stateOverview() {
  const rows = rowsForYear(datasets.state);
  const ranked = stateBreakdown(rows).sort((a, b) => b.admissions - a.admissions);
  const totals = summarise(rows);
  const focus = ranked.find(row => row.category === selection.state);
  const byState = groupRows(datasets.state, "state");
  const displayedStates = focus ? [focus.category] : ["NSW", "Vic", "Qld"];
  return {
    metrics: [
      ["Admissions across all jurisdictions", count(totals.admissions), selectedPeriod()],
      ["Most admissions", ranked[0].label, `${count(ranked[0].admissions)} admissions`],
      ["Selected jurisdiction", focus?.label || "All jurisdictions", focus ? `${count(focus.admissions)} admissions` : "Choose a state or territory to focus"]
    ],
    charts: [
      bars("Hospitalisations by state and territory",
        "Compares the number of road crash hospitalisations recorded in each jurisdiction during the selected period. The State or territory filter highlights one jurisdiction.",
        ranked, "admissions", { selected: focus?.label }),
      line(focus ? `Annual hospitalisations in ${focus.label}` : "Annual hospitalisations in NSW, VIC and QLD",
        "Shows annual counts for the three jurisdictions with the largest totals across 2011–2021. Select a state or territory to see its own timeline.",
        displayedStates.map((state, index) => annualSeries(byState.get(state), "admissions", jurisdictions[state].abbreviation,
          [palette.primary, palette.third, palette.secondary][index], [undefined, "dashed", "dotted"][index])))
    ]
  };
}

function stateRoadUserCounts() {
  const rows = rowsForYear(datasets.state).filter(row => row.road_user === selection.roadUser);
  const ranked = stateBreakdown(rows).sort((a, b) => b.admissions - a.admissions);
  return bars("Hospitalisations by state and road user",
    "Choose a road user type to compare its recorded hospitalisations across all eight jurisdictions for the selected period.",
    ranked, "admissions", { selected: jurisdictions[selection.state]?.abbreviation, roadUserFilter: true });
}

function stateRoadUsers() {
  const byState = groupRows(rowsForYear(datasets.state), "state");
  const composition = Object.entries(jurisdictions).map(([code, { abbreviation }]) => {
    const rows = byState.get(code) || [];
    const { admissions: total } = summarise(rows);
    // Each row uses its own jurisdiction's total for the selected period.
    const cells = byCategory(rows, "road_user", roadUsers).map(({ category, admissions }) => ({
      category, admissions, total, fraction: total ? share(admissions, total) : null
    }));
    return { label: abbreviation, cells };
  });

  return {
    gridClass: "state-road-user-grid",
    charts: [
      stateRoadUserCounts(),
      {
        type: "heatmap",
        title: "Road user share by state and territory",
        help: "Each cell shows the percentage of hospitalisations in that jurisdiction involving the road user type during the selected period. Darker cells mean a larger share. Focus a cell or point to it for counts. Use the arrow keys to move between cells.",
        rows: composition,
        selected: jurisdictions[selection.state]?.abbreviation
      }
    ]
  };
}

function stateStays() {
  const rows = stateBreakdown(rowsForYear(datasets.state));
  const selected = jurisdictions[selection.state]?.abbreviation;
  return {
    charts: [
      bars("Total inpatient days by state and territory",
        "Compares the total acute bed days recorded in each state or territory during the selected period.",
        [...rows].sort((a, b) => b.bedDays - a.bedDays), "bedDays", { selected }),
      bars("Average stay by state and territory",
        `Compares estimated inpatient days per admission for each state or territory in the selected period. ${bedDayNote}`,
        [...rows].sort((a, b) => b.averageStay - a.averageStay), "averageStay", { selected, ...stayFormat })
    ],
    notes: ["Bed-day measure", bedDayNote]
  };
}


// Position the explanation within its chart so it stays readable on narrow screens.
function addChartHelp(header, chart, index) {
  const tipId = `chart-help-${index}`;
  const button = header.append("button").attr("type", "button").attr("class", "chart-help")
    .attr("aria-label", `About ${chart.title}`).attr("aria-describedby", tipId)
    .attr("aria-expanded", "false").text("?");
  const tip = header.append("div").attr("id", tipId).attr("role", "tooltip")
    .attr("class", "chart-help-tip").property("hidden", true).text(chart.help);
  let pinned = false;
  const entry = {
    header: header.node(),
    close() {
      button.attr("aria-expanded", "false");
      tip.property("hidden", true);
      pinned = false;
      if (openHelp === entry) openHelp = null;
    }
  };

  function show() {
    if (openHelp !== entry) openHelp?.close();
    openHelp = entry;
    button.attr("aria-expanded", "true");
    tip.property("hidden", false);
  }

  header.on("pointerleave", () => {
    if (!pinned && document.activeElement !== button.node()) entry.close();
  });
  button.on("pointerenter focus", show)
    .on("blur", () => entry.close())
    .on("click", () => {
      if (pinned) {
        entry.close();
      } else {
        show();
        pinned = true;
      }
    });
}

function drawCharts() {
  hideMarkTooltip();
  chartWidth = panel.node().clientWidth;
  visibleCharts.forEach(drawChart);
}

function drawChart({ area, chart }) {
  area.selectAll("*").remove();
  const width = Math.floor(area.node().clientWidth);
  if (!width) return;
  if (chart.type === "bar") renderBarChart(area, chart, width);
  if (chart.type === "line") renderLineChart(area, chart, width);
  if (chart.type === "donut") renderDonutChart(area, chart);
  if (chart.type === "heatmap") renderHeatmap(area, chart);
}

function addJurisdictionKey(grid, wide) {
  const card = grid.append("aside").attr("class", wide ? "chart-box notes-box wide" : "chart-box notes-box")
    .attr("aria-labelledby", "jurisdiction-key-title");
  card.append("div").attr("class", "box-head").append("h2")
    .attr("id", "jurisdiction-key-title").text("State and territory abbreviations");
  const entries = card.append("dl").attr("class", "jurisdiction-key")
    .selectAll("div").data(Object.values(jurisdictions)).join("div");
  entries.append("dt").text(jurisdiction => jurisdiction.abbreviation);
  entries.append("dd").text(jurisdiction => jurisdiction.name);
}

function drawTopic() {
  openHelp?.close();
  panel.selectAll("*").remove();
  const topic = topics[selection.data][activeTopics[selection.data]];
  const { metrics, charts, notes, gridClass = "" } = topic.build();

  tabList.selectAll("button").each(function (_, index) {
    const active = index === activeTopics[selection.data];
    d3.select(this).attr("aria-selected", active).attr("tabindex", active ? 0 : -1);
  });
  panel.attr("aria-labelledby", `tab-${topic.id}`);

  if (metrics) {
    const cards = panel.append("div").attr("class", "kpi-strip")
      .selectAll(".kpi-card").data(metrics).join("div").attr("class", "kpi-card");
    cards.append("span").attr("class", "kpi-label").text(metric => metric[0]);
    cards.append("div").attr("class", "kpi-val").text(metric => metric[1]);
    cards.append("span").attr("class", "kpi-sub").text(metric => metric[2]);
  }

  const grid = panel.append("div").attr("class", `chart-grid ${gridClass}`);
  visibleCharts = charts.map((chart, index) => {
    const card = grid.append("article").attr("class", chart.wide ? "chart-box wide" : "chart-box");
    const header = card.append("div").attr("class", "box-head");
    header.append("h2").text(chart.title);
    addChartHelp(header, chart, index);

    const rendered = { chart };
    if (chart.roadUserFilter) {
      const roadUser = card.append("label").attr("class", "chart-filter filter-item").text("Road user")
        .append("select").attr("id", "filter-road-user");
      addOptions(roadUser, roadUsers.map(label => [label, label]));
      roadUser.property("value", selection.roadUser).on("change", event => {
        selection.roadUser = event.currentTarget.value;
        hideMarkTooltip();
        rendered.chart = stateRoadUserCounts();
        drawChart(rendered);
      });
    }

    rendered.area = card.append("div").attr("class", "chart-area");
    return rendered;
  });

  if (notes) {
    const [title, ...paragraphs] = notes;
    const card = grid.append("aside").attr("class", "chart-box notes-box");
    card.append("div").attr("class", "box-head").append("h2").text(title);
    card.selectAll("p").data(paragraphs).join("p").text(paragraph => paragraph);
  }
  if (selection.data === "state") addJurisdictionKey(grid, !notes);
  drawCharts();
}

function selectTopic(index, focus = false) {
  activeTopics[selection.data] = index;
  drawTopic();
  if (focus) tabList.selectAll("button").nodes()[index].focus();
}

function drawTabs() {
  const tabs = topics[selection.data];
  tabList.selectAll("button").data(tabs, topic => topic.id).join("button")
    .attr("type", "button").attr("class", "nav-btn").attr("role", "tab")
    .attr("id", topic => `tab-${topic.id}`).attr("aria-controls", "view-panel")
    .text(topic => topic.label)
    .on("click", (_, topic) => selectTopic(tabs.indexOf(topic)))
    .on("keydown", (event, topic) => {
      const index = tabs.indexOf(topic);
      const next = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTopic(next, true);
    });
  drawTopic();
}

function addOptions(select, options) {
  select.selectAll(null).data(options).enter().append("option")
    .attr("value", option => option[0]).text(option => option[1]);
}

function updateViewControls() {
  const isState = selection.data === "state";
  document.getElementById("state-filter-label").hidden = !isState;
  stateSelect.disabled = !isState;
  filterHint.textContent = isState
    ? "Year filters totals and shares. Select a state or territory to highlight its chart values and see its timeline in State overview."
    : "Select a year to filter totals and shares and highlight it on timelines.";
}

function startDashboard(data) {
  datasets = data;
  tabList = d3.select("#view-tabs");
  panel = d3.select("#view-panel");
  const reset = document.getElementById("btn-reset-all");
  const viewChoices = document.querySelectorAll('input[name="data-view"]');

  addOptions(d3.select(yearSelect), years.map(year => [year, year]));
  addOptions(d3.select(stateSelect), Object.entries(jurisdictions).map(([code, { abbreviation }]) => [code, abbreviation]));
  yearSelect.value = "all";
  stateSelect.value = "all";
  viewChoices[0].checked = true;
  yearSelect.disabled = false;
  reset.disabled = false;
  document.getElementById("dashboard-content").hidden = false;

  viewChoices.forEach(choice => choice.addEventListener("change", () => {
    selection.data = choice.value;
    updateViewControls();
    drawTabs();
  }));
  yearSelect.addEventListener("change", () => {
    selection.year = yearSelect.value === "all" ? "all" : Number(yearSelect.value);
    drawTopic();
  });
  stateSelect.addEventListener("change", () => {
    selection.state = stateSelect.value;
    drawTopic();
  });
  reset.addEventListener("click", () => {
    yearSelect.value = selection.year = "all";
    stateSelect.value = selection.state = "all";
    selection.roadUser = roadUsers[0];
    drawTopic();
  });
  document.addEventListener("pointerdown", event => {
    if (openHelp && !openHelp.header.contains(event.target)) openHelp.close();
    if (!event.target.closest(".chart-mark")) hideMarkTooltip();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      openHelp?.close();
      hideMarkTooltip();
    }
  });
  window.addEventListener("scroll", hideMarkTooltip, { passive: true });

  // Redraw at the actual card width so axes stay readable on phones and desktops.
  new ResizeObserver(() => {
    if (chartWidth !== panel.node().clientWidth) drawCharts();
  }).observe(panel.node());

  updateViewControls();
  drawTabs();
}
