// Keep each category's percentage visible in the legend, with its count available on the segment.
function renderDonutChart(area, chart, height) {
  const { unit = "admissions" } = chart;
  const total = d3.sum(chart.data, item => item.value);
  const items = chart.data.map((item, index) => ({ ...item, color: palette.donut[index] }));
  const layout = area.append("div").attr("class", "donut-layout");
  const graphic = layout.append("div").attr("class", "donut-graphic")
    .style("height", `${Math.min(height, 360)}px`);
  const svg = startChart(graphic, chart.title, 192, 192);
  const ring = svg.append("g").attr("transform", "translate(96,96)");
  ring.append("circle").attr("r", 72).attr("fill", "none").attr("stroke", "#e3ebf0").attr("stroke-width", 22)
    .attr("aria-hidden", "true");

  const slices = d3.pie().sort(null).value(item => item.value)(items.filter(item => item.value > 0));
  const arc = d3.arc().innerRadius(61).outerRadius(83);
  const marks = ring.selectAll("path").data(slices).join("path")
    .attr("d", arc).attr("fill", slice => slice.data.color).attr("stroke", "#fff");
  addMarkHelp(marks, ({ data }) => `${data.label}: ${percent(share(data.value, total))} (${count(data.value)} ${unit})`);

  ring.append("text").attr("class", "donut-total").attr("text-anchor", "middle")
    .attr("y", -2).text(count(total));
  ring.append("text").attr("class", "donut-caption").attr("text-anchor", "middle")
    .attr("y", 14).text(unit);

  const legend = layout.append("ul").attr("class", "donut-legend").attr("aria-label", `Share of ${unit}`)
    .selectAll("li").data(items).join("li");
  legend.append("span").attr("class", "legend-dot").attr("aria-hidden", "true")
    .style("background-color", item => item.color);
  legend.append("span").text(item => item.label);
  legend.append("strong").text(item => percent(share(item.value, total)));
}
