t_pivot_fields = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> yield(name:"0")

testingTest(name: "pivot_fields", load: testLoadData, infile: "pivot_fields.in.csv", outfile: "pivot_fields.out.csv", test: t_pivot_fields)