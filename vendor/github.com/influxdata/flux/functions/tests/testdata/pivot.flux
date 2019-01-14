t_pivot = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> pivot(rowKey: ["_time"], columnKey: ["_measurement", "_field"], valueColumn: "_value")
  |> yield(name:"0")

testingTest(name: "pivot", load: testLoadData, infile: "pivot.in.csv", outfile: "pivot.out.csv", test: t_pivot)