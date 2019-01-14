t_lowestMin = (table=<-) =>
  table
    |> range(start: 2018-11-07T00:00:00Z)
    |> lowestMin(n: 3, groupColumns: ["_measurement", "host"])

testingTest(name: "lowestMin", load: testLoadData, infile: "lowestMin.in.csv", outfile: "lowestMin.out.csv", test: t_lowestMin)