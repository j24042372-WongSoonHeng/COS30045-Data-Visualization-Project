// D3 horizontal bars share a zero baseline. A band scale nests the two cohort bars within each road user.
function renderBarChart(area, chart, width) {
  const { data, series, format = count, axisFormat = countAxis, selected } = chart;
  const height = 40 + data.length * (series.length > 1 ? 35 : 29);
  const left = width < 350 ? 103 : 117;
  const right = series.length === 1 ? 66 : 13;
  const bottom = height - 27;
  const maximum = d3.max(data, row => d3.max(row.values)) || 1;
  const x = d3.scaleLinear().domain([0, maximum]).nice().range([left, width - right]);
  const y = d3.scaleBand().domain(data.map(row => row.label)).range([7, bottom]).paddingInner(0.24);
  const band = d3.scaleBand().domain(series.map(item => item.label)).range([0, y.bandwidth()]).padding(0.13);
  const ticks = x.ticks(width < 420 ? 3 : 5);

  addSeriesLegend(area, series);
  const svg = startChart(area, chart.title, width, height);
  svg.append("g")
    .attr("class", "chart-gridlines").attr("aria-hidden", "true")
    .attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).tickValues(ticks).tickSize(7 - bottom).tickFormat(() => ""))
    .call(axis => axis.select(".domain").remove());
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).tickValues(ticks).tickFormat(axisFormat).tickSizeOuter(0));
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(${left},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(6))
    .call(axis => axis.select(".domain").remove())
    .selectAll(".tick text").attr("font-weight", label => label === selected ? 700 : null);

  const groups = svg.selectAll(".bar-group").data(data).join("g")
    .attr("class", "bar-group").attr("transform", row => `translate(0,${y(row.label)})`);
  const marks = groups.selectAll("rect").data(row => series.map((item, index) => ({
    category: row.label,
    series: item.label,
    color: selected && selected !== row.label ? palette.muted : item.color,
    value: row.values[index]
  })).filter(mark => mark.value > 0)).join("rect")
    .attr("x", left).attr("y", mark => band(mark.series))
    .attr("width", mark => x(mark.value) - left).attr("height", band.bandwidth())
    .attr("rx", 2).attr("fill", mark => mark.color);
  addMarkHelp(marks, mark => `${mark.category}${series.length > 1 ? `, ${mark.series}` : ""}: ${format(mark.value)}`);

  if (series.length === 1) {
    groups.append("text").attr("class", "chart-value")
      .attr("x", row => x(row.values[0] || 0) + 5)
      .attr("y", y.bandwidth() / 2).attr("dy", "0.35em")
      .text(row => row.values[0] == null ? "—" : format(row.values[0]));
  }
}
