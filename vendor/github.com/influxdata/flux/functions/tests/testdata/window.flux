t_window = (table=<-) =>
  table
  |> range(start:2018-05-22T19:53:00Z, stop: 2018-05-22T19:55:00Z)
  |> group(columns: ["_measurement"])
  |> window(every: 1s)
  |> mean()
  |> duplicate(column: "_start", as: "_time")
  |> window(every: inf)
  |> map(fn: (r) => ({_time: r._time, mean: r._value}))
  |> yield(name:"0")

testingTest(name: "window", load: testLoadData, infile: "window.in.csv", outfile: "window.out.csv", test: t_window)