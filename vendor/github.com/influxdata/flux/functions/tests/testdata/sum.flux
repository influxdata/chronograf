option now = () => 2018-12-18T22:12:00Z

t_sum = (table=<-) => table
  |> range(start: -5m)
  |> sum()

testingTest(name: "sum", load: testLoadData, infile: "sum.in.csv", outfile: "sum.out.csv", test: t_sum)
