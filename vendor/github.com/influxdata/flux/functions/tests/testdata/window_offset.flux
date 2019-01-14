t_window_offset = (table=<-) =>
  table
  |> range(start:2018-05-22T19:53:00Z,stop:2018-05-22T19:55:00Z)
  |> group(columns: ["_measurement"])
  |> window(every: 1s, start: 2)
  |> mean()
  |> duplicate(column: "_start", as: "_time")
  |> window(every: inf)
  |> map(fn: (r) => ({_time: r._time, mean: r._value}))
  |> yield(name:"0")

testingTest(name: "window_offset", load: testLoadData, infile: "window_offset.in.csv", outfile: "window_offset.out.csv", test: t_window_offset)