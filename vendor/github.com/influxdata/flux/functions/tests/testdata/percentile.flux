t_percentile = (table=<-) =>
  table
    |> range(start: 2018-05-22T19:50:26Z)
    |> group(columns: ["_measurement", "_start"])
    |> percentile(percentile:0.75, method:"exact_selector")
    |> map(fn: (r) => ({_time: r._time, percentile: r._value}))
    |> yield(name:"0")

testingTest(name: "percentile", load: testLoadData, infile: "percentile.in.csv", outfile: "percentile.out.csv", test: t_percentile)