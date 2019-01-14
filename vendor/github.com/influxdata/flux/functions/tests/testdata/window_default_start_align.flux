t_window_default_start_align = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:30Z, stop: 2018-05-22T19:59:00Z)
    |> window(every:1m)

testingTest(name: "window_default_start_align", load: testLoadData, infile: "window_default_start_align.in.csv", outfile: "window_default_start_align.out.csv", test: t_window_default_start_align)