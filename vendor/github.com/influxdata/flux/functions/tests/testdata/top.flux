t_top = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:24.421470485Z)
    |> top(n:2)

testingTest(name: "top", load: testLoadData, infile: "top.in.csv", outfile: "top.out.csv", test: t_top)