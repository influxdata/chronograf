t_window_group_mean_ungroup = (table=<-) =>
  table
  |> range(start:2018-05-22T19:53:00Z, stop: 2018-05-22T19:55:00Z)
  |> group(columns: ["name"])
  |> window(every:1s)
  |> mean()
  |> group()

testingTest(name: "window_group_mean_ungroup", load: testLoadData, infile: "window_group_mean_ungroup.in.csv", outfile: "window_group_mean_ungroup.out.csv", test: t_window_group_mean_ungroup)