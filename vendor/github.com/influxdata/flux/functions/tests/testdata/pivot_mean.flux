t_pivot_mean = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> group(columns: ["_stop", "_measurement", "_field", "host"])
  |> mean()
  |> pivot(rowKey: ["_stop"], columnKey: ["host"], valueColumn: "_value")
  |> yield(name:"0")

testingTest(name: "pivot_mean", load: testLoadData, infile: "pivot_mean.in.csv", outfile: "pivot_mean.out.csv", test: t_pivot_mean)