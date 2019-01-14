option now = () => 2018-12-18T22:12:00Z

t_stddev = (table=<-) => table
  |> range(start: -5m)
  |> stddev()

testingTest(name: "stddev", load: testLoadData, infile: "stddev.in.csv", outfile: "stddev.out.csv", test: t_stddev)
