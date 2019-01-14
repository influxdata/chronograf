t_influxFieldsAsCols = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z, stop: 2018-05-22T19:54:17Z)
  |> influxFieldsAsCols()
  |> yield(name:"0")
testingTest(name: "influxFieldsAsCols", load: testLoadData, infile: "influxFieldsAsCols.in.csv", outfile: "influxFieldsAsCols.out.csv", test: t_influxFieldsAsCols)