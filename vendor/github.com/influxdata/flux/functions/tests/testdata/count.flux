option now = () => 2018-12-18T21:00:00Z

t_count = (table=<-) => table
  |> range(start: -10m)
  |> count()

testingTest(name: "count", load: testLoadData, infile: "count.in.csv", outfile: "count.out.csv", test: t_count)
