t_pivot_task_test = (table=<-) =>
  table
    |> range(start: 2018-10-02T17:55:11.520461Z)
	|> filter(fn: (r) => r._measurement == "records" and r.taskID == "02bac3c8f0f37000" )
	|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")

testingTest(name: "pivot_task_test", load: testLoadData, infile: "pivot_task_test.in.csv", outfile: "pivot_task_test.out.csv", test: t_pivot_task_test)