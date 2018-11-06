memUsed = from(bucket: "telegraf/autogen")
  |> range(start:2018-05-22T19:53:00Z, stop:2018-05-22T19:55:00Z)
  |> filter(fn: (r) => r._measurement == "mem" AND r._field == "used" )

procTotal = from(bucket: "telegraf/autogen")
  |> range(start:2018-05-22T19:53:00Z, stop:2018-05-22T19:55:00Z)
  |> filter(fn: (r) =>
    r._measurement == "processes" AND
    r._field == "total"
    )

join(tables: {mem:memUsed, proc:procTotal}, on: ["_time", "_stop", "_start", "host"]) |> yield()