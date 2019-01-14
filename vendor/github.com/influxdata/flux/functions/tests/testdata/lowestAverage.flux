t_lowestAverage = (table=<-) =>
  table
    |> range(start: 2018-11-07T00:00:00Z)
    |> lowestAverage(n: 3, groupColumns: ["_measurement", "host"])

testingTest(name: "lowestAverage", load: testLoadData, infile: "lowestAverage.in.csv", outfile: "lowestAverage.out.csv", test: t_lowestAverage)