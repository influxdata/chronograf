option now = () => 2018-12-18T22:12:00Z

t_skew = (table=<-) => table
  |> range(start: -5m)
  |> skew()

testingTest(name: "skew", load: testLoadData, infile: "skew.in.csv", outfile: "skew.out.csv", test: t_skew)
