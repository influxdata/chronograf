t_lowestCurrent = (table=<-) =>
  table
    |> range(start: 2018-11-07T00:00:00Z)
    |> lowestCurrent(n: 3, groupColumns: ["_measurement", "host"])

testingTest(name: "lowestCurrent", load: testLoadData, infile: "lowestCurrent.in.csv", outfile: "lowestCurrent.out.csv", test: t_lowestCurrent)