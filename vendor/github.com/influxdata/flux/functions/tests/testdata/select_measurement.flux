t_select_measurement = (table=<-) =>
  table
  |> range(start: 2018-05-21T13:09:22.885021542Z)
  |> filter(fn: (r) => r._measurement ==  "swap")
  |> group(columns: ["_measurement", "_start"])
  |> map(fn: (r) => ({_time: r._time, used_percent:r._value}))
  |> yield(name:"0")

testingTest(name: "select_measurement", load: testLoadData, infile: "select_measurement.in.csv", outfile: "select_measurement.out.csv", test: t_select_measurement)