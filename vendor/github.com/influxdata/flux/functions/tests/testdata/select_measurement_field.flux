t_select_measurement_field = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> filter(fn: (r) => r._measurement ==  "system" and r._field == "load1")
  |> group(columns: ["_measurement", "_start"])
  |> map(fn: (r) => ({_time: r._time, load1:r._value}))
  |> yield(name:"0")

testingTest(name: "select_measurement_field", load: testLoadData, infile: "select_measurement_field.in.csv", outfile: "select_measurement_field.out.csv", test: t_select_measurement_field)