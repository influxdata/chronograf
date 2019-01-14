simple_max = (table=<-) =>
  table
  |> range(start:2018-04-17T00:00:00Z)
  |> group(columns: ["_measurement", "_start"])
  |> max(column: "_value")
  |> map(fn: (r) => ({_time: r._time,max:r._value}))

testingTest(name: "simple_max", load: testLoadData, infile: "simple_max.in.csv", outfile: "simple_max.out.csv", test: simple_max)
