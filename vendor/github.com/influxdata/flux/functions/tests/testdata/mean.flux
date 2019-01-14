option now = () => 2018-12-18T22:12:00Z

t_mean = (table=<-) => table
  |> range(start: -5m)
  |> mean()

testingTest(name: "mean", load: testLoadData, infile: "mean.in.csv", outfile: "mean.out.csv", test: t_mean)
