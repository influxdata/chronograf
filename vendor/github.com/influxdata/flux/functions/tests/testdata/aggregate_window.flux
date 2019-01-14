aggregate_window = (table=<-) =>
  table
  |> range(start: 2018-05-22T00:00:00Z, stop:2018-05-22T00:01:00Z)
  |> aggregateWindow(every:30s,fn:mean)

testingTest(name: "aggregate_window", load: testLoadData, infile: "aggregate_window.in.csv", outfile: "aggregate_window.out.csv", test: aggregate_window)
