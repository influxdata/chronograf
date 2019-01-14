option now = () => 2018-12-18T22:12:00Z

t_spread = (table=<-) => table
  |> range(start: -5m)
  |> spread()

testingTest(name: "spread", load: testLoadData, infile: "spread.in.csv", outfile: "spread.out.csv", test: t_spread)
