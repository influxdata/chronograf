t_window_start_bound = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:00Z)
    |> window(start:2018-05-22T19:53:30Z,every: 1m)
testingTest(name: "window_start_bound", load: testLoadData, infile: "window_start_bound.in.csv", outfile: "window_start_bound.out.csv", test: t_window_start_bound)