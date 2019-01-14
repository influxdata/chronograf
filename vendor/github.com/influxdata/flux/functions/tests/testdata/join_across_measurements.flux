memUsed = testLoadData(file: "join_across_measurements.in.csv")
  |> range(start:2018-05-22T19:53:00Z, stop:2018-05-22T19:55:00Z)
  |> filter(fn: (r) => r._measurement == "mem" and r._field == "used" )

procTotal = testLoadData(file: "join_across_measurements.in.csv")
  |> range(start:2018-05-22T19:53:00Z, stop:2018-05-22T19:55:00Z)
  |> filter(fn: (r) =>
    r._measurement == "processes" and
    r._field == "total"
    )

got = join(tables: {mem:memUsed, proc:procTotal}, on: ["_time", "_stop", "_start", "host"])
want = testLoadData(file: "join_across_measurements.out.csv")
assertEquals(name: "join", want: want, got: got)