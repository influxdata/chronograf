t_highestAverage = (table=<-) =>
  table
    |> highestAverage(n: 3, groupColumns: ["_measurement", "host"])

testingTest(name: "highestAverage", load: testLoadData, infile: "highestAverage.in.csv", outfile: "highestAverage.out.csv", test: t_highestAverage)