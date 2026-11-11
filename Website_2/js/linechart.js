// Annual series keep the full timeline visible when the Year filter highlights a point.
function renderLineChart(area, chart, width) {
  const { series, format = count, axisFormat = countAxis, year } = chart;
  const height = width < 450 ? 209 : 228;
  const left = 46;
  const right = width - 17;
  const top = 12;
  const bottom = height - 30;
  const [minimum, maximum] = d3.extent(series.flatMap(item => item.values));
  const padding = Math.max(1, (maximum - minimum) * 0.12);
  const y = d3.scaleLinear().domain([Math.max(0, minimum - padding), maximum + padding]).nice().range([bottom, top]);
  const x = d3.scalePoint().domain(years).range([left, right]);
  const tickYears = width < 520
    ? years.filter((value, index) => value === year || (index % 2 === 0 && (year === "all" || Math.abs(value - year) > 1)))
    : years;
  const tickValues = y.ticks(5);

  addSeriesLegend(area, series, true);
  const svg = startChart(area, chart.title, width, height);
  svg.append("g").attr("class", "chart-gridlines").attr("aria-hidden", "true")
    .attr("transform", `translate(${left},0)`)
    .call(d3.axisLeft(y).tickValues(tickValues).tickSize(left - right).tickFormat(() => ""))
    .call(axis => axis.select(".domain").remove());
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(${left},0)`)
    .call(d3.axisLeft(y).tickValues(tickValues).tickFormat(axisFormat).tickSizeOuter(0));
  svg.append("g").attr("class", "chart-axis").attr("aria-hidden", "true")
    .attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).tickValues(tickYears).tickFormat(value => value).tickSizeOuter(0))
    .selectAll(".tick text").attr("font-weight", value => value === year ? 700 : null);

  if (year !== "all") {
    svg.append("line").attr("x1", x(year)).attr("x2", x(year)).attr("y1", top).attr("y2", bottom)
      .attr("stroke", palette.secondary).attr("stroke-dasharray", "3 4").attr("aria-hidden", "true");
  }

  const line = d3.line().x((_, index) => x(years[index])).y(value => y(value));
  const groups = svg.selectAll(".line-series").data(series).join("g").attr("class", "line-series");
  groups.append("path").attr("d", item => line(item.values)).attr("fill", "none").attr("aria-hidden", "true")
    .attr("stroke", item => item.color).attr("stroke-width", 2.4)
    .attr("stroke-dasharray", item => ({ dashed: "7 4", dotted: "2 4" })[item.strokeStyle] || null);

  const points = groups.selectAll("circle").data(item => item.values.map((value, index) => ({
    year: years[index], value, label: item.label, color: item.color
  }))).join("circle")
    .attr("cx", point => x(point.year)).attr("cy", point => y(point.value))
    .attr("r", point => point.year === year ? 5.5 : 3)
    .attr("fill", point => point.color).attr("stroke", "#fff");
  addMarkHelp(points, point => `${point.year}, ${point.label}: ${format(point.value)}`);
}
