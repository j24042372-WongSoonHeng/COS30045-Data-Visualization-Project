// GenAI (OpenAI Codex) assisted with the heatmap and its keyboard navigation.
function renderHeatmap(area, { title, rows, selected }) {
  // The 0–100% scale stays fixed so colours can be compared between years.
  const stops = [0, 0.25, 0.5, 0.75, 1];
  const colours = ["#edf4f8", "#b5d0e0", "#427e9f", "#235775", "#102e43"];
  const colour = d3.scaleLinear().domain(stops).range(colours);
  area.append("p").attr("class", "heatmap-scroll-hint").text("Scroll across to see all road users.");
  const scroll = area.append("div").attr("class", "heatmap-scroll").on("scroll", hideMarkTooltip);
  const table = scroll.append("table").attr("class", "heatmap-table").attr("aria-label", title);
  table.append("thead").append("tr")
    .selectAll("th").data(["State / territory", ...roadUsers]).join("th")
    .attr("scope", "col").text(label => label);

  const body = table.append("tbody").selectAll("tr").data(rows).join("tr")
    .classed("heatmap-selected", row => row.label === selected);
  body.append("th").attr("scope", "row").text(row => row.label);
  const marks = body.selectAll("td").data((row, rowIndex) => row.cells.map((cell, columnIndex) => ({
    ...cell, jurisdiction: row.label, rowIndex, columnIndex
  }))).join("td").append("span").attr("class", "heatmap-cell")
    .text(cell => cell.fraction == null ? "—" : percent(cell.fraction));
  marks.each(function ({ fraction }) {
    const background = fraction == null ? "#f4f6f8" : colour(fraction);
    d3.select(this).style("background-color", background).style("color", heatmapTextColour(background));
  });

  addMarkHelp(marks, cell => {
    const name = `${cell.jurisdiction}, ${cell.category}`;
    return cell.fraction == null
      ? `${name}: no hospitalisations recorded for this jurisdiction in the selected period.`
      : `${name}: ${percent(cell.fraction)} (${count(cell.admissions)} of ${count(cell.total)} hospitalisations).`;
  });

  // Keep one cell in the tab order. Arrow keys explore the rest of the table.
  const cells = marks.nodes();
  let activeCell = cells[0];
  marks.attr("tabindex", -1)
    .on("focus.heatmap", event => {
      activeCell.tabIndex = -1;
      activeCell = event.currentTarget;
      activeCell.tabIndex = 0;
    })
    .on("keydown", (event, { rowIndex, columnIndex }) => {
      const offsets = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      const offset = offsets[event.key];
      if (!offset) return;
      const row = rowIndex + offset[0];
      const column = columnIndex + offset[1];
      if (row >= 0 && row < rows.length && column >= 0 && column < roadUsers.length) {
        event.preventDefault();
        cells[row * roadUsers.length + column].focus();
      }
    });
  activeCell.tabIndex = 0;

  const legend = area.append("div").attr("class", "heatmap-legend");
  legend.append("span").text("Share of a jurisdiction’s hospitalisations");
  legend.append("div").attr("class", "heatmap-gradient")
    .style("background", `linear-gradient(to right, ${colours.join(", ")})`);
  legend.append("div").attr("class", "heatmap-legend-ticks").selectAll("span").data(stops).join("span")
    .text(value => `${value * 100}%`);
}

// Pick black or white using relative luminance to keep the printed percentages legible.
function heatmapTextColour(background) {
  const { r, g, b } = d3.rgb(background);
  const [red, green, blue] = [r, g, b].map(channel => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue >= 0.179 ? "#000" : "#fff";
}
