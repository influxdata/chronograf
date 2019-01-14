t_range = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:36Z)


testingTest(name: "range", load: testLoadData, infile: "range.in.csv", outfile: "range.out.csv", test: t_range)