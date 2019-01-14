t_increase = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> increase()


testingTest(name: "increase", load: testLoadData, infile: "increase.in.csv", outfile: "increase.out.csv", test: t_increase)