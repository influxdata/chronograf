supl = testLoadData(file: "task_per_line.in.csv")
  |> range(start: 2018-10-02T17:55:11.520461Z)
  |> filter(fn: (r) => r._measurement == "records" and r.taskID == "02bac3c8f0f37000" )
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> group(columns: ["runID"])



main = testLoadData(file: "task_per_line.in.csv")
  |> range(start: 2018-10-02T17:55:11.520461Z)
  |> filter(fn: (r) => r._measurement == "records" and r.taskID == "02bac3c8f0f37000" )
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> pivot(rowKey:["runID"], columnKey: ["status"], valueColumn: "_time")


got = join(tables: {main: main, supl: supl}, on: ["_start", "_stop", "orgID", "taskID", "runID", "_measurement"])
want = testLoadData(file: "task_per_line.out.csv")
assertEquals(name: "task_per_line", want: want, got: got)