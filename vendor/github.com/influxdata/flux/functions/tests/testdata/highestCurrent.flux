t_highestCurrent = (table=<-) =>
  table
    |> range(start: 2018-11-07T00:00:00Z)
    |> highestCurrent(n: 3, groupColumns: ["_measurement", "host"])

testingTest(name: "highestCurrent", load: testLoadData, infile: "highestCurrent.in.csv", outfile: "highestCurrent.out.csv", test: t_highestCurrent)