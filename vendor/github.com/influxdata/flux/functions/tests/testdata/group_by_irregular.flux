t_group_by_irregular = (table=<-) =>
  table
  |> range(start: 2018-10-02T17:55:11.520461Z)
  |> filter(fn: (r) => r._measurement == "records" and r.taskID == "02bac3c8f0f37000" )
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> group(columns: ["runID"])
  |> yield(name:"r1")

testingTest(name: "group_by_irregular", load: testLoadData, infile: "group_by_irregular.in.csv", outfile: "group_by_irregular.out.csv", test: t_group_by_irregular)