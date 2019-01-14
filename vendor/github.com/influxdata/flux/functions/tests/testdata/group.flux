t_group = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> filter(fn: (r) => r._measurement == "diskio" and r._field == "io_time")
  |> group(columns: ["_measurement", "_start", "name"])
  |> max()
  |> map(fn: (r) => ({_time: r._time, max: r._value}))
  |> yield(name: "0")

testingTest(name: "group", load: testLoadData, infile: "group.in.csv", outfile: "group.out.csv", test: t_group)