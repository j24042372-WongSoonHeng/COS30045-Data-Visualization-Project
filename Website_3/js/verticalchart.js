// Columns and dots share a categorical x-axis and a zero-based numeric y-axis.
function renderVerticalChart(area, chart, width, availableHeight) {
  const { data, selected, timeline, format = count, axisFormat = countAxis } = chart;
  const height = Math.max(60, Math.min(availableHeight, 410));
  const left = 42;
  const right = width - 12;
  const top = 12;
  const bottom = height - 24;
  const labels = data.map(row => row.label);
  const x = d3.scaleBand().domain(labels).range([left, right]).padding(0.22);
  const maximum = d3.max(data, row => row.value) || 1;
  const y = d3.scaleLinear().domain([0, maximum]).nice().range([bottom, top]);
  const yTicks = y.ticks(Math.min(5, Math.max(2, Math.floor((bottom - top) / 30))));
  const xTicks = timeline ? annualTickYears(width, selected) : labels;
  const xCenter = row => x(row.label) + x.bandwidth() / 2;
  const markColour = row => selected !== undefined && row.label !== selected ? palette.muted : palette.primary;

  const svg = startChart(area, chart.title, width, height);
  svg.append("g").attr("class", "chart-gridlines").attr("aria-hidden", "true")
    .attr("transform", `translate(${left},0)`)
    .call(d3.axisLeft(y).tickValues(yTicks).tickSize(left - right).tickFormat(() => ""))
    .call(axis => axis.select(".domain").remove());
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(${left},0)`)
    .call(d3.axisLeft(y).tickValues(yTicks).tickFormat(axisFormat).tickSizeOuter(0));
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).tickValues(xTicks).tickSizeOuter(0))
    .selectAll(".tick text").attr("font-weight", label => label === selected ? 700 : null);

  const values = data.filter(row => row.value != null);
  let marks;
  if (chart.type === "dot") {
    marks = svg.selectAll("circle").data(values).join("circle")
      .attr("cx", xCenter).attr("cy", row => y(row.value))
      .attr("r", row => row.label === selected ? 6.5 : 4.5);
  } else {
    const barWidth = Math.min(48, x.bandwidth());
    marks = svg.selectAll("rect").data(values).join("rect")
      .attr("x", row => xCenter(row) - barWidth / 2).attr("y", row => y(row.value))
      .attr("width", barWidth).attr("height", row => bottom - y(row.value))
      .attr("rx", 2);
  }
  marks.attr("fill", markColour);
  addMarkHelp(marks, row => `${row.label}: ${format(row.value)}`);
}
